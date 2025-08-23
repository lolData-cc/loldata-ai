import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export type ChatTopic =
  | "build" | "runes" | "matchup" | "release_date"
  | "item" | "ability" | "meta" | "general";

export type ChatIntent = {
  topic: ChatTopic;
  champion: string | null;    // "Volibear"
  opponent: string | null;    // "Lee Sin"
  role: "TOP"|"JUNGLE"|"MID"|"ADC"|"SUPPORT"|null;
  patch_major: string | null; // "15" or "15.13" if user typed it
  queue_id: number | null;    // default 420
  language: "en";
};

export async function extractIntent(prompt: string): Promise<ChatIntent> {
  const res = await client.chat.completions.create({
    model: process.env.ANALYSIS_MODEL || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Extract structured intent from a League of Legends question.
Return valid JSON with keys:
- topic: one of ["build","runes","matchup","release_date","item","ability","meta","general"]
- champion: string|null
- opponent: string|null
- role: TOP|JUNGLE|MID|ADC|SUPPORT|null
- patch_major: string|null  (e.g., "15" or "15.13")
- queue_id: number|null  (420 if unspecified)
- language: "en"

Examples:
Q: "What do I build on Volibear vs Lee Sin?" -> topic="build", champion="Volibear", opponent="Lee Sin", role=null
Q: "Best runes for Volibear jungle?" -> topic="runes", champion="Volibear", role="JUNGLE"
Q: "When did Leona release?" -> topic="release_date", champion="Leona"`
      },
      { role: "user", content: prompt }
    ],
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      topic: parsed.topic ?? "general",
      champion: parsed.champion ?? null,
      opponent: parsed.opponent ?? null,
      role: parsed.role ?? null,
      patch_major: parsed.patch_major ?? null,
      queue_id: parsed.queue_id ?? null,
      language: "en",
    };
  } catch {
    return { topic: "general", champion: null, opponent: null, role: null, patch_major: null, queue_id: null, language: "en" };
  }
}
