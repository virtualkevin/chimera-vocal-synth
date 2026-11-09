import type { BodyMix, VoiceSource } from "../wasm/types.ts";

/** A Miku-inspired physical voice, not a sampled Vocaloid voicebank. The smaller tract
 * raises the resonances as well as the pitch; brisk, bright folds give it a synthetic edge. */
export const MIKU_BODY: Readonly<BodyMix> = { female: 1, child: 0.15 };
export const MIKU_SOURCE: Readonly<VoiceSource> = {
  f0: 261.625565, // C4; keys and scores still play their written pitches
  glide: 0.025,
  pressure: 8,
  breathiness: 0.06,
  tension: 0.65,
  fry: 0,
  roughness: 0,
  vibratoDepth: 0,
  vibratoRate: 5.5,
  drift: 0,
  voiced: true,
  brightness: 0.7,
};
export const MIKU_VIBRATO = 18; // cents on sung vowels
