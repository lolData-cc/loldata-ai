import { sb } from "../src/supabase";

(async () => {
  const { data, error } = await sb
    .from("kb_chunks")
    .select("id, doc_id, chunk, tags")
    .limit(10);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Rows:", data?.length ?? 0);
  for (const r of data ?? []) {
    const snippet = (r as any).chunk?.slice(0, 60) ?? "";
    console.log(`- ${r.id} | ${r.doc_id} | ${snippet}...`, (r as any).tags);
  }
})();
