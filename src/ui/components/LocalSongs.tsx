import { useEffect, useState } from "react";
import { loadSongLibrary, type LocalSong } from "../songLibrary.ts";
import { playLocalSong, stopSinging, useSing } from "../singing.ts";
import { useStore } from "../store.ts";
import { Chip } from "./Screen.tsx";

export function LocalSongs() {
  const [songs, setSongs] = useState<LocalSong[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const demo = useSing((s) => s.demo);
  useEffect(() => {
    const abort = new AbortController();
    loadSongLibrary(abort.signal).then((items) => {
      if (abort.signal.aborted) return;
      setSongs(items);
      setSelected(items.find((s) => s.vocals)?.id ?? items[0]?.id ?? "");
    }).catch((e: unknown) => { if (!abort.signal.aborted) setError(e instanceof Error ? e.message : "Could not load local songs."); });
    return () => abort.abort();
  }, []);
  const song = songs.find((s) => s.id === selected);
  const playing = song && demo === `local:${song.id}`;
  if (!song && !error) return null;
  return <div className="local-songs">
    {song && <>
      <div className="local-song-controls">
        <label htmlFor="local-song">Miku songs</label>
        <select id="local-song" value={selected} onKeyDown={(e) => e.stopPropagation()} onChange={(e) => { stopSinging(); setSelected(e.target.value); setError(""); }}>
          {songs.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        <Chip toggle={false} onClick={async () => {
          if (playing) { stopSinging(); return; }
          setError("");
          try {
            const { body, start } = useStore.getState();
            await playLocalSong(song, body, start);
          } catch (e) { setError(e instanceof Error ? e.message : "Could not play this melody."); }
        }}>{playing ? (song.vocals ? "Stop song" : "Stop melody") : (song.vocals ? "Sing lyrics" : "Play melody")}</Chip>
      </div>
      <p>{song.artist} · {song.excerpt} · {song.vocals ? "with lyrics" : "sung on “ah”"}</p>
      <p><a href={song.source} target="_blank" rel="noreferrer">MIDI arrangement: {song.credit}</a></p>
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
