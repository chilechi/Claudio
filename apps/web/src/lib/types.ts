import type { Track } from "@claudio/shared";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type RadioPlan = {
  mode: string;
  slot?: { label?: string; prompt?: string };
  queue: Track[];
  profile?: unknown;
  calendar?: { configured?: boolean; reason?: string };
  reason: string;
  reply: string;
};

export type LocalScanResponse = {
  configured: boolean;
  reason?: string;
  tracks: Track[];
  stats?: {
    trackCount: number;
    playableCount: number;
    taggedCount: number;
    fallbackFilenameCount: number;
  };
};

export type HostNarrationResponse = {
  kind: "intro" | "between-tracks";
  trackId: string;
  previousTrackId?: string;
  text: string;
  source: "deepseek" | "local";
  generatedAt: string;
};

export type VoiceStatus = {
  provider: string;
  configured: boolean;
  state: "ready" | "missing" | "fallback" | "error";
  audioSupported: boolean;
  fallbackProvider: string;
  reason?: string;
  envVars: string[];
};

export type RuntimeSnapshot = {
  running: boolean;
  programId?: string;
  sessionTitle?: string;
  queue: Track[];
  currentTrack?: Track;
  currentIndex: number;
  hostMessage?: string;
  jobs: Array<{ type: string; key: string; createdAt: string }>;
  workerRunning: boolean;
  updatedAt: string;
};

export type RuntimeApiResponse = {
  runtime?: RuntimeSnapshot;
  plan?: import("@claudio/shared").QueuePlan;
  hostMessage?: string;
  currentTrack?: Track;
  previousTrack?: Track;
  intent?: { action: string; reason: string; delta?: number };
  reason?: string;
};
