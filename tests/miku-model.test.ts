import { expect, test } from "bun:test";
import type * as THREE from "three";
import { initEngine } from "./harness.ts";
import { MIKU_BODY } from "../src/ui/voicePresets.ts";

await initEngine();
const { VoiceModel } = await import("../src/ui/analysis.ts");
const { Anatomy3D } = await import("../src/ui/render/anatomy3d.ts");
const { NEUTRAL } = await import("../src/wasm/engine.ts");

test("Miku's twin tails fit inside the home camera on phone and desktop", () => {
  const model = new VoiceModel(MIKU_BODY, 48000);
  const renderer = new Anatomy3D();
  try {
    for (const [w, h] of [[350, 500], [700, 890], [700, 600]]) {
      renderer.resize(w, h);
      const pose = renderer.poses(model);
      renderer.camera.position.copy(pose.home);
      renderer.camera.lookAt(pose.target);
      renderer.camera.updateMatrixWorld();
      renderer.update(model, model.frame(NEUTRAL), NEUTRAL, null, { pressure: false, particles: false, grid: false, calipers: false }, 0);
      renderer.scene.updateMatrixWorld(true);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      renderer.scene.traverse((object) => {
        const geo = (object as THREE.Mesh).geometry as THREE.InstancedBufferGeometry | undefined;
        const points = geo?.getAttribute("instanceStart");
        if (!geo || !points) return;
        for (let i = 0; i < geo.instanceCount; i++) {
          const [x, y] = renderer.project(points.getX(i), points.getY(i), points.getZ(i));
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      });
      expect(minX).toBeGreaterThan(4);
      expect(maxX).toBeLessThan(w - 4);
      expect(minY).toBeGreaterThan(4);
      expect(maxY).toBeLessThan(h - 4);
    }
  } finally {
    renderer.dispose();
    model.dispose();
  }
});
