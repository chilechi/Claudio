import { z } from "zod";

export const providerStateSchema = z.enum(["ready", "missing", "fallback", "error"]);

export const providerStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  configured: z.boolean(),
  state: providerStateSchema,
  reason: z.string().min(1).optional(),
  detail: z.string().min(1).optional(),
  envVars: z.array(z.string().min(1)).optional(),
  docs: z.string().min(1).optional()
});

export const musicSourceTypeSchema = z.enum(["local", "netease", "imported"]);
export const musicSourceSelectionSchema = z.enum(["auto", "local", "netease"]);

export const musicSourceSchema = z.object({
  name: z.string().min(1),
  type: musicSourceTypeSchema,
  selected: musicSourceSelectionSchema.optional(),
  playlistId: z.string().min(1).optional(),
  note: z.string().min(1).optional()
});

export const trackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  duration: z.number().nonnegative().nullable().optional(),
  durationText: z.string().min(1).nullable().optional(),
  source: musicSourceTypeSchema,
  playable: z.boolean().default(false),
  streamUrl: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).default([])
});

export const activeLibrarySchema = z.object({
  source: musicSourceSchema,
  tracks: z.array(trackSchema),
  fallbackReason: z.string().min(1).optional()
});

export const aiProviderSchema = z.enum(["deepseek", "local"]);

export const queuePlanSchema = z.object({
  mode: z.string().min(1),
  queue: z.array(trackSchema),
  reply: z.string().min(1),
  reason: z.string().min(1),
  aiProvider: aiProviderSchema
});

export const deepSeekPlanSchema = z.object({
  mode: z.string().min(1),
  queueIds: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1),
  reply: z.string().min(1)
});

export const chatRequestSchema = z.object({
  input: z.string().trim().min(1)
});

export const chatResponseSchema = queuePlanSchema;

export const tasteProfileSchema = z.object({
  likedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  topTags: z.array(z.union([
    z.string().min(1),
    z.object({ tag: z.string().min(1), count: z.number().int().nonnegative() })
  ])),
  topArtists: z.array(z.union([
    z.string().min(1),
    z.object({ artist: z.string().min(1), count: z.number().int().nonnegative() })
  ])),
  memories: z.array(z.string())
});

export const tasteProfileResponseSchema = z.object({
  source: musicSourceSchema,
  profile: tasteProfileSchema
});

export const diagnosticsResponseSchema = z.object({
  providers: z.array(providerStatusSchema),
  summary: z.object({
    ready: z.number().int().nonnegative(),
    fallback: z.number().int().nonnegative(),
    missing: z.number().int().nonnegative()
  }),
  docs: z.string().min(1),
  secretPolicy: z.string().min(1)
});

export const stateSchema = z.object({
  mode: z.string().min(1),
  currentTrackId: z.string().min(1).optional(),
  queue: z.array(z.string().min(1)),
  liked: z.array(z.string().min(1)),
  skipped: z.array(z.string().min(1)),
  recentPrompts: z.array(z.object({
    input: z.string(),
    reply: z.string(),
    at: z.string().min(1)
  })),
  memories: z.array(z.string()),
  updatedAt: z.string().min(1).optional()
});

export const playerEventTypeSchema = z.enum([
  "play",
  "pause",
  "next",
  "previous",
  "seek",
  "volume",
  "like",
  "hide",
  "skip"
]);

export const playerEventSchema = z.object({
  type: playerEventTypeSchema,
  trackId: z.string().min(1).optional(),
  positionSeconds: z.number().nonnegative().optional(),
  volume: z.number().min(0).max(1).optional()
});

export const apiErrorSchema = z.object({
  error: z.string().min(1),
  code: z.string().min(1).optional(),
  detail: z.unknown().optional()
});
