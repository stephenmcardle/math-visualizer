import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  LineSegments,
  Points,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import type { ThreeRendererFactory } from "@/lib/rendering/types";
import type { LorenzParams } from "@/visualizations/lorenz-attractor/params";
import type { LorenzState } from "@/visualizations/lorenz-attractor/simulation";

/** Trail length, in frames in which the simulation advanced. */
const TRAIL_FRAMES = 120;
const TRAIL_ALPHA = 0.8;
const HEAD_SIZE = 3;
const GOLDEN_ANGLE = 137.508 / 360;

// Each segment stores the frame it was drawn in; the shader fades it by age,
// so a frame only uploads the newest segment of every trajectory.
const trailVertexShader = /* glsl */ `
  attribute float born;
  attribute vec3 tint;
  uniform float now;
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    vAlpha = clamp(1.0 - (now - born) / ${TRAIL_FRAMES.toFixed(1)}, 0.0, 1.0);
    vTint = tint;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const trailFragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    if (vAlpha <= 0.0) discard;
    gl_FragColor = vec4(vTint, vAlpha * ${TRAIL_ALPHA.toFixed(2)});
  }
`;

/**
 * Runs start on the ρ = 28 attractor (see the simulation), so frame at least
 * that region; larger ρ gives a larger attractor centered higher.
 */
function framingRho(rho: number): number {
  return Math.max(rho, 28);
}

/** Lorenz z is "up"; Three.js uses y. Center the view vertically on z ≈ ρ − 1. */
function zCenter(rho: number): number {
  return framingRho(rho) - 1;
}

/** Far enough to fit the attractor; portrait viewports need extra distance to fit its width. */
function cameraDistance(rho: number, aspect: number): number {
  return (2.3 * framingRho(rho)) / Math.min(aspect, 1);
}

/**
 * Trails are a ring of `TRAIL_FRAMES` slots, laid out slot-major so the
 * newest segments of all trajectories are contiguous and upload as one range.
 * When several simulation steps happen between frames, a segment joins the
 * sampled positions. The camera orbits on drag; zoom and pan are off so the
 * wheel and pinch never trap page scrolling, and vertical swipes still scroll.
 */
export const createLorenzRenderer: ThreeRendererFactory<LorenzParams, LorenzState> = (
  { renderer, scene, camera, requestRender },
  initialContext,
) => {
  let context = initialContext;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  // OrbitControls sets "none", which would block page scrolling on touch screens.
  renderer.domElement.style.touchAction = "pan-y";
  controls.addEventListener("change", requestRender);

  const trailMaterial = new ShaderMaterial({
    vertexShader: trailVertexShader,
    fragmentShader: trailFragmentShader,
    uniforms: { now: { value: 0 } },
    transparent: true,
    depthWrite: false,
  });
  const headMaterial = new PointsMaterial({
    size: HEAD_SIZE,
    sizeAttenuation: false,
    vertexColors: true,
  });
  let trails: LineSegments | null = null;
  let heads: Points | null = null;

  let count = 0;
  let slot = 0;
  let frame = 0;
  let drawnStep = -1;
  let framedRho = Number.NaN;
  const prev = { x: new Float64Array(0), y: new Float64Array(0), z: new Float64Array(0) };

  const disposeObjects = () => {
    for (const object of [trails, heads]) {
      if (!object) continue;
      scene.remove(object);
      object.geometry.dispose();
    }
  };

  const frameCamera = (rho: number) => {
    // Keep the user's viewing direction; only refit the distance to the new size.
    const direction = camera.position.clone().normalize();
    if (direction.lengthSq() === 0) direction.set(0.25, 0.15, 1).normalize();
    camera.position.copy(
      direction.multiplyScalar(cameraDistance(rho, context.width / context.height)),
    );
    controls.target.set(0, 0, 0);
    controls.update();
  };

  return {
    reset(state) {
      disposeObjects();
      count = state.x.length;
      slot = 0;
      frame = 0;
      drawnStep = -1;
      prev.x = state.x.slice();
      prev.y = state.y.slice();
      prev.z = state.z.slice();

      const tints = new Float32Array(count * 3);
      const color = new Color();
      for (let i = 0; i < count; i++) {
        color.setHSL((i * GOLDEN_ANGLE) % 1, 0.7, 0.52).toArray(tints, i * 3);
      }

      const segments = TRAIL_FRAMES * count;
      const trailGeometry = new BufferGeometry();
      trailGeometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(segments * 2 * 3), 3).setUsage(DynamicDrawUsage),
      );
      // Born far in the past: every slot starts fully faded.
      trailGeometry.setAttribute(
        "born",
        new BufferAttribute(new Float32Array(segments * 2).fill(-1e9), 1).setUsage(
          DynamicDrawUsage,
        ),
      );
      const trailTints = new Float32Array(segments * 2 * 3);
      for (let s = 0; s < TRAIL_FRAMES; s++) {
        for (let i = 0; i < count; i++) {
          const v = (s * count + i) * 2;
          trailTints.set(tints.subarray(i * 3, i * 3 + 3), v * 3);
          trailTints.set(tints.subarray(i * 3, i * 3 + 3), (v + 1) * 3);
        }
      }
      trailGeometry.setAttribute("tint", new BufferAttribute(trailTints, 3));
      trails = new LineSegments(trailGeometry, trailMaterial);
      trails.frustumCulled = false;

      const headGeometry = new BufferGeometry();
      headGeometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage),
      );
      headGeometry.setAttribute("color", new BufferAttribute(tints, 3));
      heads = new Points(headGeometry, headMaterial);
      heads.frustumCulled = false;
      scene.add(trails, heads);

      if (state.rho !== framedRho) {
        framedRho = state.rho;
        frameCamera(state.rho);
      }
    },

    render(state) {
      if (!trails || !heads) return;
      const zc = zCenter(state.rho);
      const { x, y, z } = state;

      // Only add a segment when the simulation moved, so dragging the camera
      // while paused doesn't age the trails.
      if (state.step !== drawnStep) {
        if (drawnStep !== -1) {
          frame++;
          slot = (slot + 1) % TRAIL_FRAMES;
          const position = trails.geometry.getAttribute("position") as BufferAttribute;
          const born = trails.geometry.getAttribute("born") as BufferAttribute;
          const p = position.array as Float32Array;
          const b = born.array as Float32Array;
          const first = slot * count * 2;
          for (let i = 0; i < count; i++) {
            const v = first + i * 2;
            p.set([prev.x[i], prev.z[i] - zc, prev.y[i], x[i], z[i] - zc, y[i]], v * 3);
            b[v] = frame;
            b[v + 1] = frame;
          }
          position.clearUpdateRanges();
          position.addUpdateRange(first * 3, count * 2 * 3);
          position.needsUpdate = true;
          born.clearUpdateRanges();
          born.addUpdateRange(first, count * 2);
          born.needsUpdate = true;
        }
        drawnStep = state.step;
        prev.x.set(x);
        prev.y.set(y);
        prev.z.set(z);
        trailMaterial.uniforms.now.value = frame;
      }

      heads.visible = context.quality.level !== "low";
      const headPositions = heads.geometry.getAttribute("position") as BufferAttribute;
      const h = headPositions.array as Float32Array;
      for (let i = 0; i < count; i++) {
        h[i * 3] = x[i];
        h[i * 3 + 1] = z[i] - zc;
        h[i * 3 + 2] = y[i];
      }
      headPositions.needsUpdate = true;
    },

    resize(next) {
      context = next;
      if (!Number.isNaN(framedRho)) frameCamera(framedRho);
    },

    destroy() {
      controls.removeEventListener("change", requestRender);
      controls.dispose();
      disposeObjects();
      trailMaterial.dispose();
      headMaterial.dispose();
    },
  };
};
