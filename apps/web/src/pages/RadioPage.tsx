import { Link } from "react-router-dom";
import { useRadio } from "../context/RadioProvider";
import { PlayerPanel } from "../components/radio/PlayerPanel";
import { ChatPanel } from "../components/radio/ChatPanel";
import { QueuePanel } from "../components/radio/QueuePanel";
import { TodayPlanPanel } from "../components/radio/TodayPlanPanel";
import { TastePanel } from "../components/radio/TastePanel";
import { sourceLabel } from "../lib/utils";

export function RadioPage() {
  const radio = useRadio();

  return (
    <main className="shell">
      <header className="topbar" aria-label="Claudio 状态">
        <div>
          <p className="eyebrow">个人 AI 电台</p>
          <h1>Claudio</h1>
        </div>
        <div className="status-strip">
          <span>{radio.provider}</span>
          <span>{radio.plan?.mode || "读取中"}</span>
          <span>{sourceLabel(radio.library?.source)}</span>
          {!radio.appInstalled && radio.installPrompt ? <button className="theme-toggle" type="button" onClick={radio.installApp}>安装</button> : null}
          <button className="theme-toggle" type="button" onClick={radio.runtime?.running ? radio.stopRuntime : radio.startRuntime} disabled={radio.runtimeBusy}>
            {radio.runtime?.running ? "停播" : "开播"}
          </button>
          <button className="theme-toggle" type="button" onClick={() => radio.setLight((value) => !value)}>{radio.light ? "亮色" : "暗色"}</button>
          <Link to="/admin" className="admin-link">管理</Link>
        </div>
      </header>

      <section className="workspace" aria-label="电台控制台">
        <PlayerPanel
          clock={radio.clock}
          currentTrack={radio.currentTrack}
          playing={radio.playing}
          currentTime={radio.currentTime}
          duration={radio.duration}
          progress={radio.progress}
          sourceHint={radio.sourceHint}
          hostMessage={radio.hostMessage}
          onPlay={radio.togglePlay}
          onPrev={() => radio.move(-1)}
          onNext={() => radio.move(1)}
          onLike={() => radio.sendPlayerEvent("like")}
          onSkip={() => { radio.sendPlayerEvent("skip"); radio.selectTrack(radio.currentIndex + 1, { continuePlayback: radio.playing }); }}
          onHide={() => radio.sendPlayerEvent("hide")}
          onProgress={(value) => radio.seek(value)}
          onVolume={(value) => radio.setVolume(value)}
        />

        <ChatPanel
          plan={radio.plan}
          message={radio.message}
          chatInput={radio.chatInput}
          setChatInput={radio.setChatInput}
          submitChat={radio.submitChat}
          radioHostEnabled={radio.radioHostEnabled}
          setRadioHostEnabled={radio.setRadioHostEnabled}
          runtime={radio.runtime}
          runtimeBusy={radio.runtimeBusy}
          startRuntime={radio.startRuntime}
          stopRuntime={radio.stopRuntime}
        />

        <QueuePanel queue={radio.activeQueue} currentIndex={radio.currentIndex} selectTrack={(index) => radio.selectTrack(index)} queueCount={radio.queueCount} />
      </section>

      <section className="lower-grid" aria-label="今日计划和设置">
        <TodayPlanPanel radio={radio.radio} reason={radio.message || radio.plan?.reason || "正在读取今日计划。"} />
        <TastePanel taste={radio.taste} />
        <div className="panel">
          <p className="panel-label">电台旁白</p>
          <label className="voice-toggle">
            <input type="checkbox" checked={radio.radioHostEnabled} onChange={(event) => radio.setRadioHostEnabled(event.target.checked)} />
            <span>让 Claudio 自己解读歌曲</span>
          </label>
          <p className="tiny">{radio.voiceStatus?.audioSupported ? `真实 TTS：${radio.voiceStatus.provider}` : "浏览器语音回退"}</p>
          <p className="tiny">
            {radio.runtime?.running ? `正在播出：${radio.runtime.sessionTitle || "自由电台"}` : "电台未开播，仍可手动播放。"}
            {radio.runtime?.jobs?.length ? ` · 队列任务 ${radio.runtime.jobs.length}` : ""}
          </p>
        </div>
      </section>
    </main>
  );
}
