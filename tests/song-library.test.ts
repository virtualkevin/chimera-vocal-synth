import { expect, test } from "bun:test";
import { parseSongLibrary, loadSongLibrary, type LocalSong } from "../src/ui/songLibrary.ts";

const song: LocalSong = {
  id: "test", title: "Original test melody", artist: "Test", credit: "Test",
  source: "https://example.com", excerpt: "Test excerpt", notes: [[69, 0, .5], [72, 1, .5]],
};

test("local melody validation retains rests, timing and pitches", () => {
  expect(parseSongLibrary([song])).toEqual([song]);
  for (const notes of [[[69, 0, .5], [70, .2, .5]], [[128, 0, 1]], [[69, 0, NaN]], [[69, 0, -.1]], []]) {
    expect(() => parseSongLibrary([{ ...song, notes }])).toThrow();
  }
  expect(() => parseSongLibrary([song, song])).toThrow();
  expect(() => parseSongLibrary([{ ...song, source: "javascript:alert(1)" }])).toThrow();
});

test("missing local library tolerates both a 404 and the SPA fallback", async () => {
  const original = globalThis.fetch;
  try {
    for (const response of [new Response("", { status: 404 }), new Response("<!doctype html>", { headers: { "content-type": "text/html" } })]) {
      globalThis.fetch = (async () => response) as unknown as typeof fetch;
      expect(await loadSongLibrary()).toEqual([]);
    }
    globalThis.fetch = (async () => new Response("bad", { status: 500 })) as unknown as typeof fetch;
    await expect(loadSongLibrary()).rejects.toThrow("Could not load");
  } finally { globalThis.fetch = original; }
});

test("aligned lyrics require a validated syllable for every note", () => {
  const syllable = { text: "See", onset: ["s"], vowel: "i", coda: [], wordEnd: true };
  const vocals = { lyrics: "See me", syllables: [syllable, { ...syllable, text: "me", onset: ["m"] }] };
  expect(parseSongLibrary([{ ...song, vocals }])[0].vocals).toEqual(vocals);
  for (const bad of [null, { ...vocals, lyrics: "" }, { ...vocals, syllables: [syllable] }, { ...vocals, syllables: [syllable, { ...syllable, vowel: "" }] }, { ...vocals, syllables: [syllable, { ...syllable, onset: "m" }] }]) {
    expect(() => parseSongLibrary([{ ...song, vocals: bad }])).toThrow();
  }
});
