import type { BodyMix, VoiceSource } from "../wasm/types.ts";

/** A Miku-inspired physical voice, not a sampled Vocaloid voicebank. The smaller tract
 * raises the resonances as well as the pitch; brisk, bright folds give it a synthetic edge. */
export const MIKU_BODY: Readonly<BodyMix> = { female: 1, child: 0.45 };
export const MIKU_SOURCE: Readonly<VoiceSource> = {
  f0: 391.995436, // G4; live MIDI still plays its written pitches
  glide: 0.012,
  pressure: 7,
  breathiness: 0.03,
  tension: 0.6,
  fry: 0,
  roughness: 0,
  vibratoDepth: 0,
  vibratoRate: 5.5,
  drift: 0,
  voiced: true,
  brightness: 0.65, // the smaller tract supplies the presence; avoid a harsh upper spectrum
};
export const MIKU_VIBRATO = 12; // cents on sung vowels
/** Demo melodies are written low for the adult female body; lift them a fifth for Miku. */
export const MIKU_DEMO_TRANSPOSE = 7;
