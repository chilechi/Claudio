import type { Track } from "@claudio/shared";
import { formatTime } from "../../lib/utils";

export function PlayerPanel(props: {
  clock: string;
  currentTrack?: Track;
  playing: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  sourceHint: string;
  hostMessage: string;
  onPlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLike: () => void;
  onSkip: () => void;
  onHide: () => void;
  onProgress: (value: number) => void;
  onVolume: (value: number) => void;
}) {
  const track = props.currentTrack;
  return (
    <aside className="panel player-panel">
      <p className="panel-label">播放器</p>
      <div className="clock-panel">
        <span>{props.clock}</span>
        <small>{props.playing ? "● 播放中" : "● 待命"}</small>
      </div>
      <div className={track?.coverUrl ? "cover has-image" : "cover"} aria-hidden="true">
        {track?.coverUrl ? <img src={track.coverUrl} alt="" /> : <span>{track?.artist?.slice(0, 1).toUpperCase() || "C"}</span>}
      </div>
      <p className="now-label">{props.playing ? "正在播放" : "当前曲目"}</p>
      <h2>{track?.title || "等待歌曲"}</h2>
      <p className="muted">{track ? `${track.artist} · ${track.album || "未知专辑"}` : "还没有队列"}</p>
      <div className="host-line" aria-live="polite">{props.hostMessage || "Claudio 会在播放时轻声解读这一首。"}</div>
      <div className="meter" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      <div className="controls">
        <button type="button" title="上一首" onClick={props.onPrev} disabled={!track}>‹</button>
        <button className="primary" type="button" title="播放/暂停" onClick={props.onPlay} disabled={!track}>{props.playing ? "暂停" : "播放"}</button>
        <button type="button" title="下一首" onClick={props.onNext} disabled={!track}>›</button>
        <button type="button" title="喜欢" onClick={props.onLike}>♡</button>
        <button type="button" title="跳过" onClick={props.onSkip}>↝</button>
      </div>
      <div className="transport">
        <span>{formatTime(props.currentTime)}</span>
        <input type="range" min="0" max="1000" value={props.progress} onInput={(event) => props.onProgress(Number(event.currentTarget.value))} onChange={(event) => props.onProgress(Number(event.target.value))} />
        <span>{formatTime(props.duration)}</span>
      </div>
      <div className="utility-controls">
        <button type="button" onClick={props.onHide}>隐藏</button>
        <button type="button" onClick={props.onLike}>收藏</button>
        <label>音量<input type="range" min="0" max="1" step="0.01" defaultValue="0.8" onInput={(event) => props.onVolume(Number(event.currentTarget.value))} onChange={(event) => props.onVolume(Number(event.target.value))} /></label>
      </div>
      <p className="tiny">{props.sourceHint}</p>
    </aside>
  );
}
