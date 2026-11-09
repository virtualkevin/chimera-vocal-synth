/** Local arrangements live under the gitignored public/shows directory. Times are seconds,
 * after applying the MIDI tempo map; pitches stay in the arrangement's original register. */
export interface VocalSyllable {
  text: string;
  onset: string[];
  vowel: string;
  coda: string[];
  wordEnd: boolean;
  phraseEnd?: boolean;
}

export interface LocalSong {
  id: string;
  title: string;
  artist: string;
  credit: string;
  source: string;
  excerpt: string;
  /** MIDI pitch, onset seconds, duration seconds. One monophonic melody. */
  notes: [number, number, number][];
  /** Explicit one-syllable-per-note alignment, independent of dictionary loading. */
  vocals?: { lyrics: string; syllables: VocalSyllable[] };
}

export const SONG_LIBRARY_URL = "/shows/miku-songs/index.json";

export function parseSongLibrary(value: unknown): LocalSong[] {
  if (!Array.isArray(value) || value.length > 100) throw new Error("Invalid song library.");
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid song.");
    const s = item as LocalSong;
    for (const key of ["id", "title", "artist", "credit", "source", "excerpt"] as const) {
      if (typeof s[key] !== "string" || !s[key].length || s[key].length > 500) throw new Error(`Invalid song ${key}.`);
    }
    if (ids.has(s.id) || !/^https?:\/\//.test(s.source)) throw new Error("Invalid song source or duplicate ID.");
    ids.add(s.id);
    if (!Array.isArray(s.notes) || !s.notes.length || s.notes.length > 4096) throw new Error("Invalid melody.");
    let end = 0;
    for (const n of s.notes) {
      if (!Array.isArray(n) || n.length !== 3 || !n.every(Number.isFinite)) throw new Error("Invalid MIDI note.");
      const [midi, start, duration] = n;
      if (!Number.isInteger(midi) || midi < 1 || midi > 127 || start < end - 0.001 || duration < 0.025 || start + duration > 3600) {
        throw new Error("Melody notes must be ordered, non-overlapping, and have valid pitches and durations.");
      }
      end = start + duration;
    }
    if (s.vocals !== undefined) {
      const v = s.vocals;
      if (!v || typeof v.lyrics !== "string" || !v.lyrics.trim() || v.lyrics.length > 20000 || !Array.isArray(v.syllables) || v.syllables.length !== s.notes.length) {
        throw new Error("Aligned lyrics must contain exactly one syllable per melody note.");
      }
      const phoneme = (p: unknown) => typeof p === "string" && p.length > 0 && p.length <= 12;
      const consonants = (ps: unknown) => Array.isArray(ps) && ps.length <= 8 && ps.every(phoneme);
      for (const syl of v.syllables) {
        if (!syl || typeof syl.text !== "string" || !syl.text.trim() || syl.text.length > 80 || !phoneme(syl.vowel) || !consonants(syl.onset) || !consonants(syl.coda) || typeof syl.wordEnd !== "boolean" || (syl.phraseEnd !== undefined && typeof syl.phraseEnd !== "boolean")) {
          throw new Error("Invalid aligned lyric syllable.");
        }
      }
    }
    return s;
  });
}

export async function loadSongLibrary(signal?: AbortSignal): Promise<LocalSong[]> {
  const response = await fetch(SONG_LIBRARY_URL, { signal });
  // Vite's SPA fallback is HTML when the optional local collection isn't installed.
  if (response.status === 404 || response.headers.get("content-type")?.includes("text/html")) return [];
  if (!response.ok) throw new Error("Could not load local songs.");
  return parseSongLibrary(await response.json());
}
