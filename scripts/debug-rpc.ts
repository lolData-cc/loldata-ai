import { sb } from "../src/supabase";

const dim = 1536;
const testVec = Array.from({ length: dim }, (_, i) => (i === 0 ? 0.001 : 0));

(async () => {
  const { data, error } = await sb.rpc("kb_search_v2", {
    query_embedding: testVec,
    match_count: 5,
    filter: null,
  });
  if (error) {
    console.error("RPC error:", error);
    process.exit(1);
  }
  console.log("RPC rows:", data?.length ?? 0);
  console.dir(data, { depth: 2 });
})();
