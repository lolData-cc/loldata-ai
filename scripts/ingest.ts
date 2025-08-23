import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { embed } from "../src/embeddings";
import { insertKBChunks } from "../src/kb";
import "dotenv/config";

// semplice splitter per parole (puoi migliorarlo con tokenizzazione)
function chunkText(text: string, size = 800, overlap = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += (size - overlap)) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}

async function* walk(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(fp);
    else if (/\.(md|mdx|txt|json)$/i.test(e.name)) yield fp;
  }
}

(async () => {
  const baseDir = path.join(process.cwd(), "kb", "data");
  let total = 0;

  for await (const fp of walk(baseDir)) {
    const raw = await fs.readFile(fp, "utf8");
    const { content, data } = matter(raw);

    const chunks = chunkText(content);
    const rows = [];
    for (const ch of chunks) {
      const vec = await embed(ch);
      rows.push({
        doc_id: path.relative(baseDir, fp),
        chunk: ch,
        embedding: vec,
        tags: data?.tags ?? null,
      });
    }
    const ins = await insertKBChunks(rows);
    total += ins?.length ?? 0;
    console.log(`Ingested ${ins?.length ?? 0} chunks from ${fp}`);
  }

  console.log(`✅ Done. Total chunks: ${total}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
