// src/llm.ts
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const CHAT_MODEL = process.env.ANALYSIS_MODEL || "gpt-4o-mini";
export const SUGG_COUNT = 5;

export async function askText(prompt: string, { retries = 1 }: { retries?: number } = {}) {
  for (let i = 0; i <= retries; i++) {
    const res = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.3,
      max_tokens: 150, // 🔒 prevents essays (~120 words max)
      messages: [
        { role: "system", content: "You are a League of Legends coach. Be concise." },
        { role: "user", content: prompt }
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    if (text) return text;
  }
  return "";
}

// (keep your JSON-oriented functions for /matchanalyze if you want)
// JSON-oriented helper for match analysis
export async function askLLM(prompt: string) {
  const res = await client.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" }, // ensures JSON
    messages: [
      {
        role: "system",
        content:
          "You are a League of Legends analyst. Always respond with valid JSON matching the analysis schema."
      },
      { role: "user", content: prompt },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return { summary: text };
  }
}
