import { sb } from "./supabase";
import { getCohortStats, getCohortTopItems, type ItemFreq, type PlayerRow } from "./db-cohort";

export async function mostCommonRoleForChampion(champion: string): Promise<PlayerRow["role_norm"] | null> {
  const { data, error } = await sb.rpc("mc_role_rpc", { _champ: champion });
  if (error) throw error;
  // RPC returns either a string or null
  return (data as string | null) as any ?? null;
}

export async function mostCommonPatchMajorForChampion(
  champion: string,
  role?: string | null,
  queueId?: number | null
): Promise<string | null> {
  const { data, error } = await sb.rpc("mc_patch_major_rpc", {
    _champ: champion,
    _role: role ?? null,
    _queue: queueId ?? null,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function loadCohort(
  champion: string,
  role: PlayerRow["role_norm"],
  queueId: number,
  patchMajorOrExact: string,
  sameMajor = true
) {
  // Minimal "row" shape just to reuse your existing RPCs
  const row = {
    champion_name: champion,
    role_norm: role,
    queue_id: queueId,
    patch: patchMajorOrExact,
  } as PlayerRow;

  const cohort = await getCohortStats(row, sameMajor);
  if (!cohort || !cohort.n) return { cohort: null, topItems: [] as ItemFreq[] };

  const topItems = await getCohortTopItems(row, 8, sameMajor);
  return { cohort, topItems };
}
