export type ProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  state: "ready" | "missing" | "error" | "fallback";
  reason?: string;
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  source: "local" | "netease" | "imported";
  playable: boolean;
  streamUrl?: string;
  tags: string[];
};

export type QueuePlan = {
  mode: string;
  reply: string;
  reason: string;
  provider: "deepseek" | "local";
  queue: Track[];
};
