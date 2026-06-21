import type { z } from "zod";
import type {
  activeLibrarySchema,
  aiProviderSchema,
  apiErrorSchema,
  chatRequestSchema,
  chatResponseSchema,
  deepSeekPlanSchema,
  diagnosticsResponseSchema,
  hostNarrationKindSchema,
  hostNarrationRequestSchema,
  hostNarrationResponseSchema,
  musicSourceSchema,
  musicSourceSelectionSchema,
  musicSourceTypeSchema,
  playerEventSchema,
  playerEventTypeSchema,
  providerStateSchema,
  providerStatusSchema,
  queuePlanSchema,
  stateSchema,
  tasteProfileResponseSchema,
  tasteProfileSchema,
  trackSchema,
  voiceSpeakRequestSchema,
  voiceStatusSchema
} from "./schemas.js";

export type ProviderState = z.infer<typeof providerStateSchema>;
export type ProviderStatus = z.infer<typeof providerStatusSchema>;

export type MusicSourceType = z.infer<typeof musicSourceTypeSchema>;
export type MusicSourceSelection = z.infer<typeof musicSourceSelectionSchema>;
export type MusicSource = z.infer<typeof musicSourceSchema>;

export type Track = z.infer<typeof trackSchema>;
export type ActiveLibrary = z.infer<typeof activeLibrarySchema>;

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type QueuePlan = z.infer<typeof queuePlanSchema>;
export type DeepSeekPlan = z.infer<typeof deepSeekPlanSchema>;

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;

export type HostNarrationKind = z.infer<typeof hostNarrationKindSchema>;
export type HostNarrationRequest = z.infer<typeof hostNarrationRequestSchema>;
export type HostNarrationResponse = z.infer<typeof hostNarrationResponseSchema>;

export type VoiceStatus = z.infer<typeof voiceStatusSchema>;
export type VoiceSpeakRequest = z.infer<typeof voiceSpeakRequestSchema>;

export type TasteProfile = z.infer<typeof tasteProfileSchema>;
export type TasteProfileResponse = z.infer<typeof tasteProfileResponseSchema>;

export type DiagnosticsResponse = z.infer<typeof diagnosticsResponseSchema>;
export type State = z.infer<typeof stateSchema>;

export type PlayerEventType = z.infer<typeof playerEventTypeSchema>;
export type PlayerEvent = z.infer<typeof playerEventSchema>;

export type ApiError = z.infer<typeof apiErrorSchema>;
