import { expect, test } from "bun:test";
import { WasmVoice } from "./harness.ts";
import { MIKU_BODY, MIKU_SOURCE } from "../src/ui/voicePresets.ts";

test("Miku renders a voiced C4 on its smaller tract, follows notes, and releases to silence", () => {
  const voice = new WasmVoice();
  const maleAreas = voice.state().orAreas;
  voice.setBody(MIKU_BODY);
  voice.setSource({ ...MIKU_SOURCE });
  voice.setGate(1);
  const audio = voice.render(48000);
  expect(audio.every(Number.isFinite)).toBe(true);
  expect(Math.max(...audio.map(Math.abs))).toBeLessThan(1);
  const tail = audio.slice(-12000);
  const rms = Math.sqrt(tail.reduce((s, v) => s + v * v, 0) / tail.length);
  expect(rms).toBeGreaterThan(0.001);
  expect(voice.state().orAreas).not.toEqual(maleAreas);
  expect(voice.state().voicing).toBeGreaterThan(0.5);
  expect(Math.abs(voice.state().f0 - MIKU_SOURCE.f0)).toBeLessThan(3);

  // Measure the waveform's period too: telemetry alone cannot catch an octave error in audio.
  let bestLag = 0, best = -Infinity;
  for (let lag = 140; lag <= 480; lag++) {
    let xy = 0, xx = 0, yy = 0;
    for (let i = 0; i < tail.length - lag; i++) {
      xy += tail[i] * tail[i + lag];
      xx += tail[i] ** 2;
      yy += tail[i + lag] ** 2;
    }
    const correlation = xy / Math.sqrt(xx * yy);
    // Take the first strong peak: integer rounding can make the two-period peak higher.
    if (best > 0.9 && correlation < best) break;
    if (correlation > best) { best = correlation; bestLag = lag; }
  }
  expect(Math.abs(48000 / bestLag - MIKU_SOURCE.f0)).toBeLessThan(5);
  voice.setSource({ f0: 440 });
  voice.render(24000);
  expect(Math.abs(voice.state().f0 - 440)).toBeLessThan(4);
  voice.setGate(0);
  const released = voice.render(48000).slice(-4800);
  expect(Math.max(...released.map(Math.abs))).toBeLessThan(0.001);
});
