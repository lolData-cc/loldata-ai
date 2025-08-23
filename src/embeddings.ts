import { config } from "dotenv";
config({ path: ".env" }); // <-- importante su Windows

import OpenAI from "openai";

const MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-large";

export async function embed(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non trovata: assicurati che sia nel .env");
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const input = text.replace(/\s+/g, " ").trim();
  const res = await client.embeddings.create({ model: MODEL, input });
  return res.data[0].embedding as number[];
}