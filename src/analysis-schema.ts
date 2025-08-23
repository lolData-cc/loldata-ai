import { z } from "zod";

export const SuggestionZ = z.object({
  title: z.string(),                       // e.g., "Fix early reset timing"
  rationale: z.string(),                   // why this matters (numbers + enemy comp)
  timeframe: z.enum(["early","mid","late"]),
  priority: z.enum(["high","medium","low"]),
  expected_impact: z.string(),             // e.g., "+5–10% dmg @mid, fewer deaths"
  references: z.array(z.string()).default([]),  // e.g., ["cohort:dmg -35%", "vs:Sejuani,Ornn (tanky)"]
});

export const ItemRecZ = z.object({
  item_id: z.number(),                     // Riot item id
  when: z.enum(["first","second","third","situational"]),
  reason: z.string(),                      // MUST explain vs enemy comp and/or cohort gaps
  vs_tags: z.array(z.string()).default([]) // e.g., ["vs heavy AP", "vs tanks", "vs poke"]
});

export const AnalysisZ = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).max(6),
  weaknesses: z.array(z.string()).max(6),
  suggestions: z.array(SuggestionZ).min(3).max(7),
  item_recommendations: z.array(ItemRecZ).max(6),
  notes: z.array(z.string()).default([])
});

export const RatingZ = z.object({
  overall: z.number().min(0).max(100),
  dimensions: z.object({
    mechanics: z.number().min(0).max(100),
    macro: z.number().min(0).max(100),
    vision: z.number().min(0).max(100),
    damage: z.number().min(0).max(100),
    survivability: z.number().min(0).max(100),
  }),
  badges: z.array(z.string()).default([]),      // e.g., ["Objective Oriented", "Vision Gap"]
});

export const UiPayloadZ = z.object({
  meta: z.object({
    source: z.enum(["db","riot"]),
    patch: z.string(),
    queueId: z.number(),
    champion: z.string(),
    role: z.string(),
    win: z.boolean(),
    enemy_comp: z.array(z.string()),           // ["Sejuani","Ornn","Xerath","..."]
  }),
  cohort: z.object({
    n: z.number(),
    winrate: z.number(),                       // %
    topItems: z.array(z.object({ item: z.number(), freq: z.number() })) // %
  }),
  deltas: z.object({
    kills: z.number(), deaths: z.number(), assists: z.number(),
    gold: z.number(), dmg: z.number(), vision: z.number(), kda: z.number()
  }),
  rating: RatingZ,
  analysis: AnalysisZ
});

export type UiPayload = z.infer<typeof UiPayloadZ>;
