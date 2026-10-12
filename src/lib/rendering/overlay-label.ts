import { Container, Graphics, Text } from "pixi.js";

const NEUTRAL = 0x8a8a8a;
const PADDING = 6;

export interface OverlayLabel {
  /** Add this to the stage above the content; it is not moved by pan and zoom. */
  container: Container;
  setText(text: string): void;
  /**
   * Draw a dark backing so the text stays readable over content, for when pan
   * and zoom can move content under it. Without it the text is plain gray,
   * which reads on both themes over the empty margin of the default view.
   */
  setBacked(backed: boolean): void;
}

/** A monospace readout in the viewport's top-left corner. */
export function createOverlayLabel(): OverlayLabel {
  const backing = new Graphics();
  const text = new Text({
    text: "",
    style: { fontFamily: "ui-monospace, monospace", fontSize: 13, fill: NEUTRAL },
  });
  text.position.set(12, 10);
  const container = new Container();
  container.addChild(backing, text);
  let backed = false;

  const drawBacking = () => {
    backing.clear();
    if (!backed || text.text === "") return;
    const { x, y, width, height } = text.getLocalBounds();
    backing
      .roundRect(
        text.x + x - PADDING,
        text.y + y - PADDING,
        width + 2 * PADDING,
        height + 2 * PADDING,
        6,
      )
      .fill({ color: 0x000000, alpha: 0.6 });
  };

  return {
    container,
    setText(next) {
      if (next === text.text) return;
      text.text = next;
      drawBacking();
    },
    setBacked(next) {
      if (next === backed) return;
      backed = next;
      text.style.fill = backed ? 0xffffff : NEUTRAL;
      drawBacking();
    },
  };
}
