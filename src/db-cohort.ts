import { sb } from "./supabase";

function patchMajor(patch: string) {
  const [major] = (patch || "").split(".");
  return major || patch;
}

export type PlayerRow = {
  match_id: string;
  participant_id: number;
  puuid: string;
  summoner_name: string | null;
  team_id: 100 | 200;
  champion_id: number;
  champion_name: string;
  role: string | null;
  lane: string | null;
  role_norm: "TOP"|"JUNGLE"|"MID"|"ADC"|"SUPPORT"|"UNKNOWN";
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  gold_earned: number;
  total_damage_to_champions: number;
  vision_score: number;
  item0: number; item1: number; item2: number; item3: number; item4: number; item5: number; item6: number;
  queue_id: number;
  patch: string;
};

const TABLE = "v_participants_enriched";

export async function getPlayerRow(matchId: string, puuid: string) {
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .eq("match_id", matchId)
    .eq("puuid", puuid)
    .limit(1)
    .maybeSingle<PlayerRow>();
  if (error) throw error;
  return data ?? null; // <-- prima lanciava; ora ritorna null se non trovato
}


export type CohortStats = {
  n: number;
  winrate: number;
  avg_k: number; avg_d: number; avg_a: number;
  avg_gold: number; avg_dmg: number; avg_vision: number;
  p50_dmg: number; p90_dmg: number;
  p50_vision: number; p90_vision: number;
};

export async function getCohortStats(row: PlayerRow, sameMajor = true) {
  const patchFilter = sameMajor ? patchMajor(row.patch) : row.patch;
  const { data, error } = await sb.rpc("cohort_stats_rpc", {
    _champ: row.champion_name,
    _role: row.role_norm,
    _queue: row.queue_id,
    _patch: row.patch,
    _patch_major: patchFilter,
    _use_major: sameMajor,
  });
  if (error) throw error;
  return (data as CohortStats[])[0];
}

export type ItemFreq = { item_id: number; freq: number; };

export async function getCohortTopItems(row: PlayerRow, limit = 6, sameMajor = true) {
  const patchFilter = sameMajor ? patchMajor(row.patch) : row.patch;
  const { data, error } = await sb.rpc("cohort_top_items_rpc", {
    _champ: row.champion_name,
    _role: row.role_norm,
    _queue: row.queue_id,
    _patch: row.patch,
    _patch_major: patchFilter,
    _use_major: sameMajor,
    _limit: limit
  });
  if (error) throw error;
  return data as ItemFreq[];
}
