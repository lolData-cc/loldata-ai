// src/riot-to-row.ts
import type { PlayerRow } from "./db-cohort";
import { inferRegionFromMatchId, fetchMatch } from "./riot";


function normRole(pos: string | null | undefined): PlayerRow["role_norm"] {
  const t = String(pos ?? "").toUpperCase();
  if (t === "MIDDLE") return "MID";
  if (t === "BOTTOM") return "ADC";
  if (["TOP","JUNGLE","MID","ADC","SUPPORT"].includes(t)) return t as any;
  return "UNKNOWN";
}

function shortPatch(gameVersion: string | undefined): string {
  return String(gameVersion ?? "").split(".").slice(0,2).join(".");
}

export async function buildPlayerRowFromRiot(matchId: string, puuid: string): Promise<PlayerRow> {
  const dto = await fetchMatch(matchId, inferRegionFromMatchId(matchId));
  const info = dto.info ?? {};
  const parts = info.participants ?? [];
  const me = parts.find((p:any)=>p.puuid === puuid);
  if (!me) throw new Error("PUUID non presente nel match Riot");

  const items = [0,1,2,3,4,5,6].map(i=>me[`item${i}`] ?? 0);

  return {
    match_id: matchId,
    participant_id: me.participantId ?? 0,
    puuid,
    summoner_name: me.summonerName ?? null,
    team_id: me.teamId as 100|200,
    champion_id: me.championId ?? 0,
    champion_name: me.championName ?? "Unknown",
    role: me.teamPosition ?? null,
    lane: me.lane ?? null,
    role_norm: normRole(me.teamPosition),
    win: Boolean(me.win),
    kills: me.kills ?? 0,
    deaths: me.deaths ?? 0,
    assists: me.assists ?? 0,
    gold_earned: me.goldEarned ?? 0,
    total_damage_to_champions: me.totalDamageDealtToChampions ?? 0,
    vision_score: me.visionScore ?? 0,
    item0: items[0], item1: items[1], item2: items[2],
    item3: items[3], item4: items[4], item5: items[5], item6: items[6],
    queue_id: info.queueId ?? 0,
    patch: shortPatch(info.gameVersion),
  };
}
