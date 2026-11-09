"""Run with python tests/midi-melody.test.py (requires mido). Uses original synthetic notes."""
import importlib.util
from pathlib import Path
import unittest
import mido

spec = importlib.util.spec_from_file_location("extractor", Path(__file__).resolve().parents[1] / "tools/midi-melody.py")
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)


class MelodyTest(unittest.TestCase):
    def test_tempo_map_repeated_notes_and_rest(self):
        mid = mido.MidiFile(ticks_per_beat=480)
        mid.tracks.append(mido.MidiTrack([
            mido.MetaMessage("set_tempo", tempo=500000),
            mido.MetaMessage("set_tempo", tempo=1000000, time=480),
        ]))
        mid.tracks.append(mido.MidiTrack([
            mido.Message("note_on", note=69, velocity=80),
            mido.Message("note_off", note=69, time=480),
            mido.Message("note_on", note=69, velocity=80),
            mido.Message("note_on", note=69, velocity=0, time=480),
            mido.Message("note_on", note=72, velocity=80, time=480),
            mido.Message("note_off", note=72, time=480),
        ]))
        self.assertEqual(extractor.melody(mid, 1, 0, 4), [[69, 0, .5], [69, .5, 1], [72, 2.5, 1]])

    def test_top_voice_overlap_crop_and_percussion(self):
        mid = mido.MidiFile(ticks_per_beat=480)
        mid.tracks.append(mido.MidiTrack([
            mido.Message("note_on", note=48, velocity=80),
            mido.Message("note_on", note=72, velocity=80),
            mido.Message("note_on", note=100, velocity=80, channel=9),
            mido.Message("note_off", note=72, time=480),
            mido.Message("note_off", note=48, time=480),
            mido.Message("note_off", note=100, channel=9),
        ]))
        self.assertEqual(extractor.melody(mid, 0, .25, .5), [[72, 0, .25], [48, .25, .25]])


if __name__ == "__main__":
    unittest.main()
