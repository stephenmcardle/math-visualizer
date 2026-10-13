import { BufferImageSource, Container, Sprite, Texture } from "pixi.js";

import { createOverlayLabel } from "@/lib/rendering/overlay-label";
import { palette } from "@/lib/rendering/palettes";
import type { PixiRendererFactory, RenderContext } from "@/lib/rendering/types";
import { DEFAULT_VIEW, isDefaultView, viewTransform } from "@/lib/rendering/view";
import { colorTable, type LatticePainter } from "@/templates/lattice/painter";
import type { LatticeState } from "@/templates/lattice/simulation";

const MARGIN = 0.92;
/** Enough to pick out single sites in a 512² lattice on a phone. */
const MAX_ZOOM = 16;

/**
 * Draws the lattice as a texture with one pixel per site, scaled up to fit
 * the viewport, plus the model's overlay text. The pixel buffer is rewritten
 * only after a new sweep or a palette change.
 */
export function createLatticeRenderer<P extends { palette: string }, M>(
  painter: LatticePainter<P, M>,
): PixiRendererFactory<P, LatticeState<M>> {
  return (app, initialContext) => {
    let context = initialContext;
    let paletteValue = "";
    let table: Uint32Array = new Uint32Array(0);
    const applyPalette = (value: string, state: LatticeState<M>) => {
      paletteValue = value;
      table = colorTable(painter.colors(palette(value), state));
    };

    const lattice = new Sprite();
    const label = createOverlayLabel();
    // Pan and zoom move the lattice; the label stays put.
    const world = new Container();
    world.addChild(lattice);
    app.stage.addChild(world, label.container);

    let side = 0;
    let pixels = new Uint32Array(0);
    let source: BufferImageSource | null = null;
    let view = DEFAULT_VIEW;
    let fitScale = 1;
    let drawnSweeps = -1;

    const applyView = () => {
      const transform = viewTransform(view, context);
      world.position.set(transform.x, transform.y);
      world.scale.set(transform.scale);
      label.setBacked(!isDefaultView(view));
      // Sharp edges once a site covers a screen pixel or more; smooth sampling
      // below that avoids shimmering.
      if (source) source.scaleMode = fitScale * view.scale >= 1 ? "nearest" : "linear";
    };

    const layout = () => {
      if (side === 0) return;
      const fit = Math.min(context.width, context.height) * MARGIN;
      // Whole-number scales keep every site the same size on screen.
      const scale = fit >= side ? Math.floor(fit / side) : fit / side;
      fitScale = scale;
      const size = side * scale;
      lattice.position.set(
        Math.round((context.width - size) / 2),
        Math.round((context.height - size) / 2),
      );
      lattice.scale.set(scale);
      applyView();
    };

    const replaceTexture = (nextSide: number) => {
      side = nextSide;
      pixels = new Uint32Array(side * side);
      const previous = lattice.texture;
      source = new BufferImageSource({
        resource: new Uint8Array(pixels.buffer),
        width: side,
        height: side,
        format: "rgba8unorm",
        alphaMode: "premultiplied-alpha",
        scaleMode: "nearest",
      });
      lattice.texture = new Texture({ source });
      if (previous !== Texture.EMPTY) previous.destroy(true);
      layout();
    };

    return {
      reset(state, params) {
        if (state.side !== side) replaceTexture(state.side);
        // Always: the colors can depend on non-live params, such as the number of states.
        applyPalette(params.palette, state);
        drawnSweeps = -1;
      },

      render(state, params) {
        // The palette is live: repaint the current sites in the new colors.
        if (params.palette !== paletteValue) {
          applyPalette(params.palette, state);
          drawnSweeps = -1;
        }
        if (state.sweeps !== drawnSweeps && source) {
          drawnSweeps = state.sweeps;
          painter.paint(state, pixels, table);
          source.update();
        }
        // Live params such as temperature can change while paused.
        label.setText(painter.label(state, params));
      },

      resize(next: RenderContext) {
        context = next;
        layout();
      },

      panZoom: {
        minScale: 1,
        maxScale: MAX_ZOOM,
        setView(next) {
          view = next;
          applyView();
        },
      },

      destroy() {
        if (lattice.texture !== Texture.EMPTY) lattice.texture.destroy(true);
      },
    };
  };
}
