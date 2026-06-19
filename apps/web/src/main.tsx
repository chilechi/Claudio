import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main className="shell">
      <section className="console">
        <header className="consoleHeader">
          <span className="brand">Claudio</span>
          <span className="status">v0.2 baseline</span>
        </header>
        <section className="clock">--:--</section>
        <section className="emptyState">
          <h1>真实功能复刻版工程基线</h1>
          <p>音乐源、AI、TTS、ASR 会按 provider 状态逐步接入；未配置能力不会伪装成可用。</p>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
