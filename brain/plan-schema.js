import { z } from "zod";

export const aiPlanSchema = z.object({
  mode: z.string().min(1),
  queueIds: z.array(z.string().min(1)).min(1),
  reason: z.string().min(1),
  reply: z.string().min(1)
});

export function parseAiPlan(content) {
  const parsed = typeof content === "string" ? JSON.parse(content) : content;
  return aiPlanSchema.parse(parsed);
}
