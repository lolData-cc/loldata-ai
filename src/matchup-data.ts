import { sb } from "./supabase";

export type MatchupWinrate = { n: number; wins: number; winrate: number };

export async function getMatchupWinrate(args: {
  champ: string;
  opp: string;
  role?: string | null;
  queueId?: number | null;
  patch?: string | null;       // "15.13" if you want exact
  patch_major?: string | null; // "15" if you want major
  use_major?: boolean;         // default true
}): Promise<MatchupWinrate> {
  const { champ, opp, role = null, queueId = null, patch = null, patch_major = null, use_major = true } = args;

  const { data, error } = await sb.rpc("champ_vs_opp_winrate_rpc", {
    _champ: champ,
    _opp: opp,
    _role: role,
    _queue: queueId,
    _patch: patch,
    _patch_major: patch_major,
    _use_major: use_major
  });

  if (error) throw error;
  const row = (data as any[] | null)?.[0];
  return {
    n: Number(row?.n ?? 0),
    wins: Number(row?.wins ?? 0),
    winrate: Number(row?.winrate ?? 0) // 0..1
  };
}
