import { sb } from "./supabase";

export type KBChunkRow = {
  doc_id: string;
  chunk: string;
  embedding: number[];         
  tags?: Record<string, any>;
};

export async function insertKBChunks(rows: KBChunkRow[]) {
  const { data, error } = await sb.from("kb_chunks").insert(
    rows.map(r => ({
      doc_id: r.doc_id,
      chunk: r.chunk,
      embedding: r.embedding,
      tags: r.tags ?? null,
    }))
  ).select("id");
  if (error) throw error;
  return data;
}

export async function kbSearch(embedding: number[], matchCount = 8, filter?: Record<string, any>) {
  const { data, error } = await sb.rpc("kb_search_v2", {
    query_embedding: embedding,      // <- array number[] JS -> float8[] in SQL
    match_count: matchCount,
    filter: filter ?? null,
  });
  if (error) throw error;
  return data as Array<{ id: string; doc_id: string; chunk: string; score: number; tags: any }>;
}
