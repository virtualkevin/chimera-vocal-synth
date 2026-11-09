# Local MIDI songs in Sing

The Sing tab optionally loads `/shows/miku-songs/index.json`. Choose a song under **Miku songs**
and press **Sing lyrics** for an arrangement with aligned lyrics, or **Play melody** for notes only.
Playback uses the current voice, preserves the arrangement's pitches,
tempo changes and rests, animates the mouth and piano roll, and stops with **Stop song** / **Stop melody**,
a live key, a body change or leaving Sing. Unlike the built-in demos, imported melodies are not
transposed up a fifth for Miku. Notes without an explicit vocal alignment sing on “ah”.
Songs with lyrics are selected first when opening the tab.

Song files and the catalog belong in `public/shows/miku-songs/`, which is already gitignored.
They are local assets, not part of the public repository. Vite copies them into a local build;
exclude them from any build you intend to publish without the necessary rights. A fresh clone
without a catalog simply shows the existing demos. Rebuild with `bun run build` after installing
songs if using `bun run preview`.

The local collection includes arrangement excerpts of World Is Mine, Senbonzakura,
Miku, Melt and Tell Your World. Source/arranger links appear beside each song. These are fan
arrangements, not official vocal scores. Dedicated vocal tracks are preferred; where only piano
arrangements are available, the excerpt follows the highest active note and may include fills.
The labels distinguish vocal-track excerpts from piano top-line excerpts. The local Miku entry
uses a 15-second, four-phrase chorus aligned to user-supplied words, with explicit vowel and
consonant pronunciation for every note. The other songs still have no supplied lyrics.
The original `.mid` files are retained alongside the local catalog.

To prepare another excerpt, install `mido` in a Python virtual environment, then:

```sh
python tools/midi-melody.py song.mid --list
python tools/midi-melody.py song.mid --track 1 --start 40 --seconds 30 --output song.notes.json
python tests/midi-melody.test.py
```

The extractor supports MIDI types 0 and 1 with musical tick timing. It reads the full tempo map,
skips percussion channel 10, preserves repeated attacks, selects the highest active note for
overlaps, trims to the requested interval and removes leading silence. Select the vocal track
explicitly rather than combining the accompaniment into the voice.

The catalog is an array of objects matching `LocalSong` in `src/ui/songLibrary.ts`: `id`, `title`,
`artist`, `credit`, `source` (HTTP/S URL), `excerpt` (display description), and `notes` (the extracted
array of `[MIDI pitch, onset seconds, duration seconds]`). Notes must be monophonic and ordered.
The UI validates the catalog before scheduling it. Tests use original synthetic notes only.

An optional `vocals` object contains `lyrics` (the displayed text) and `syllables`, an array
with exactly one entry per note. Each entry has `text`, `onset` (IPA consonant strings),
`vowel` (IPA vowel/diphthong), `coda` (IPA consonant strings), `wordEnd` (boolean), and optional
`phraseEnd` (boolean). Explicit alignment avoids dictionary-dependent syllable counts and
pronunciation of names. The mouth, piano roll and syllable cursor all use this same alignment.
The full text is displayed up to four lines high; editing it stops playback and switches to
the existing live-key lyrics behavior. Pressing **Sing lyrics** restores the saved alignment.
