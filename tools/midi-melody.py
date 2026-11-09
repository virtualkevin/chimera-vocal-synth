"""Extract a local monophonic excerpt from a MIDI track (requires `pip install mido`).

Example: python tools/midi-melody.py song.mid --track 1 --start 40 --seconds 30 \
  --output public/shows/miku-songs/song.notes.json
Use --list to inspect tracks. Output is [MIDI pitch, onset seconds, duration seconds].
Tempo changes and note-off timing are retained. For piano chords, the highest active note
is used; select a dedicated vocal track whenever available. No song data belongs in git.
"""
import argparse
import bisect
import json
from pathlib import Path

import mido


def melody(mid, track, start, seconds):
    tempos = [(0, 500000)]
    for events in mid.tracks:
        tick = 0
        for msg in events:
            tick += msg.time
            if msg.type == "set_tempo":
                tempos.append((tick, msg.tempo))
    tempos.sort(key=lambda x: x[0])
    ticks, times, rates = [0], [0.0], [500000]
    for tick, tempo in tempos:
        time = times[-1] + mido.tick2second(tick - ticks[-1], mid.ticks_per_beat, rates[-1])
        ticks.append(tick)
        times.append(time)
        rates.append(tempo)

    def time_at(tick):
        i = bisect.bisect_right(ticks, tick) - 1
        return times[i] + mido.tick2second(tick - ticks[i], mid.ticks_per_beat, rates[i])

    events, pending, tick = [], {}, 0
    for msg in mid.tracks[track]:
        tick += msg.time
        if msg.type not in ("note_on", "note_off") or msg.channel == 9:
            continue
        key = (msg.channel, msg.note)
        if msg.type == "note_on" and msg.velocity:
            pending.setdefault(key, []).append(time_at(tick))
        elif pending.get(key):
            a = max(start, pending[key].pop(0))
            b = min(start + seconds, time_at(tick))
            if b > a:
                events.extend([(a, 1, msg.note), (b, -1, msg.note)])
    events.sort()
    attacks = {(time, pitch) for time, delta, pitch in events if delta == 1}
    active, result, previous = {}, [], start
    for time, delta, pitch in events:
        if time > previous and active:
            high = max(active)
            if result and result[-1][0] == high and (previous, high) not in attacks and abs(result[-1][1] + result[-1][2] - (previous - start)) < 1e-6:
                result[-1][2] += time - previous
            else:
                result.append([high, previous - start, time - previous])
        active[pitch] = active.get(pitch, 0) + delta
        if active[pitch] <= 0:
            del active[pitch]
        previous = time
    result = [[p, round(a, 6), round(d, 6)] for p, a, d in result if d >= .025]
    if result:
        offset = result[0][1]
        for n in result:
            n[1] = round(n[1] - offset, 6)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("midi")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--track", type=int, default=0)
    parser.add_argument("--start", type=float, default=0)
    parser.add_argument("--seconds", type=float, default=30)
    parser.add_argument("--output")
    args = parser.parse_args()
    mid = mido.MidiFile(args.midi)
    if mid.type == 2 or mid.ticks_per_beat <= 0:
        parser.error("Use a type 0 or 1 MIDI with musical tick timing.")
    if args.list:
        for i, track in enumerate(mid.tracks):
            print(i, track.name, sum(m.type == "note_on" and m.velocity > 0 for m in track), "notes")
    else:
        if not 0 <= args.track < len(mid.tracks) or args.start < 0 or not 0 < args.seconds <= 3600:
            parser.error("Invalid track or excerpt range.")
        result = melody(mid, args.track, args.start, args.seconds)
        if not result:
            parser.error("No melody notes in the selected range.")
        output = json.dumps(result) + "\n"
        if args.output:
            Path(args.output).write_text(output)
        else:
            print(output, end="")
