import type { TasteProfileResponse } from "@claudio/shared";

export function TastePanel({ taste }: { taste: TasteProfileResponse | null }) {
  const profile = taste?.profile;
  return (
    <div className="panel">
      <p className="panel-label">口味</p>
      <p className="taste-summary">喜欢 {profile?.likedCount || 0} 首，跳过 {profile?.skippedCount || 0} 首。画像来自当前真实歌库和播放事件。</p>
      <div className="tags">
        {(profile?.topTags || []).length ? profile?.topTags.map((item) => {
          const tag = typeof item === "string" ? item : item.tag;
          const count = typeof item === "string" ? "" : ` · ${item.count}`;
          return <span key={tag}>{tag}{count}</span>;
        }) : <span>暂无足够口味记录</span>}
      </div>
    </div>
  );
}
