import type { ActiveLibrary, DiagnosticsResponse, QueuePlan, State, TasteProfileResponse } from "../../../packages/shared/src/index.js";

export type ClaudioMobileClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
};

export class ClaudioMobileClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClaudioMobileClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (!fetchImpl) throw new Error("当前移动端运行环境缺少 fetch，需要注入 fetchImpl。");
    this.fetchImpl = fetchImpl;
  }

  activeLibrary() {
    return this.get<ActiveLibrary>("/api/music/active-library");
  }

  state() {
    return this.get<State>("/api/state");
  }

  todayPlan() {
    return this.get<QueuePlan>("/api/plan/today");
  }

  tasteProfile() {
    return this.get<TasteProfileResponse>("/api/taste/profile");
  }

  diagnostics() {
    return this.get<DiagnosticsResponse>("/api/settings/diagnostics");
  }

  chat(input: string) {
    return this.post<QueuePlan>("/api/chat", { input });
  }

  private async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const reason = typeof data.error === "string" ? data.error : `请求失败：${path}（${response.status}）`;
      throw new Error(reason);
    }
    return data as T;
  }
}
