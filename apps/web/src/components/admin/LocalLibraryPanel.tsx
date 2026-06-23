import type { LocalScanResponse } from "../../lib/types";

export function LocalLibraryPanel({ localScan }: { localScan: LocalScanResponse | null }) {
  const stats = localScan?.stats;
  if (!localScan) {
    return (
      <div className="panel">
        <p className="panel-label">本地歌库</p>
        <p className="empty-note">正在读取本地歌库信息。</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="panel-label">本地歌库</p>
      {localScan?.configured ? (
        <>
          <p className="library-summary">{stats?.trackCount || 0} 首本地音频，{stats?.playableCount || 0} 首可播放。</p>
          <div className="library-stats">
            <span>标签识别 {stats?.taggedCount || 0}</span>
            <span>文件名兜底 {stats?.fallbackFilenameCount || 0}</span>
          </div>
        </>
      ) : (
        <p className="empty-note">{localScan?.reason || "还没有配置 LOCAL_MUSIC_DIR。"}</p>
      )}
    </div>
  );
}
