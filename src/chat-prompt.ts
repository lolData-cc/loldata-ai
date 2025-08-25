// src/chat-prompt.ts
export function buildChatPrompt(input: {
  question: string;
  topic: string;
  champion?: string|null;
  opponent?: string|null;
  role?: string|null;
  queueId?: number|null;
  patch_major?: string|null;
  cohort?: { n:number; winrate:number; avg?: any } | undefined;
  top_items?: Array<{ item:number; freq:number }>;
  top_runes?: Array<{ perk_id:number; freq:number }>;
  enemy_tags?: string[];
  mechanics?: { rewards?: Record<string, number|null> } | null;
  // NEW: control whether to reveal stats in text
  reveal_stats?: boolean;
}) {
  return `
You are a League of Legends coach. Answer IN ENGLISH.

STYLE RULES (STRICT):
- Output ONLY 3–4 short bullets. No intro, no conclusion, no headings, no bold.
- Stick exactly to the question.
- Never spell out ability names (say "Leona Q", not full names).
- Hard brevity: keep it under ~80 words total.

NUMBERS / STATS RULES:
- Do NOT state any numeric values (winrate, n, %, gold, seconds) unless explicitly allowed.
- reveal_stats=${!!input.reveal_stats}
- If reveal_stats=false, NEVER mention cohort or matchup numbers even if present in PACK.
- If MECHANICS.rewards has null for a value, do NOT invent a number.

Return plain text ONLY (bullets).

PACK:
${JSON.stringify({
  question: input.question,
  topic: input.topic,
  champion: input.champion,
  opponent: input.opponent,
  role: input.role,
  queueId: input.queueId,
  patch_major: input.patch_major,
  top_items: input.top_items,
  top_runes: input.top_runes,
  enemy_tags: input.enemy_tags
})}

MECHANICS:
${JSON.stringify(input.mechanics || { rewards: {} })}
`;
}
