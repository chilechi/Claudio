import type { Track } from "@claudio/shared";

export function QueuePanel({ queue, currentIndex, selectTrack, queueCount }: { queue: Track[]; currentIndex: number; selectTrack: (index: number) => void; queueCount: number }) {
  return (
    <aside className="panel queue-panel">
      <p className="panel-label">队列</p>
      <p className="queue-count">{queueCount} 首</p>
      <ol className="queue">
        {queue.map((track, index) => (
          <li key={track.id} className={index === currentIndex ? "active" : ""} onClick={() => selectTrack(index)}>
            <span className="queue-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="queue-title">{track.title}</p>
              <p className="queue-meta">{track.artist} · {track.durationText || track.duration || "未知时长"}</p>
            </div>
          </li>
        ))}
      </ol>
      {!queue.length ? <p className="empty-note">还没有可用队列。先配置 LOCAL_MUSIC_DIR，或确认网易云歌单元数据已导入。</p> : null}
    </aside>
  );
}
