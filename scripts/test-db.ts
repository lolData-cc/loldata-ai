import { insertKBChunks } from "../src/kb";

const fakeEmbedding = Array.from({ length: 1536 }, () => Math.random() * 0.01);

(async () => {
  const rows = await insertKBChunks([
    {
      doc_id: "demo.md",
      chunk: "Questo è un chunk di test per la KB di loldata.",
      embedding: fakeEmbedding,
      tags: { topic: "demo", patch: "14.16" },
    },
  ]);
  console.log("Inserted:", rows);
})();
