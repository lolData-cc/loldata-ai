// src/features.ts
import type { MatchPOV, PlayerView } from "./types";

function laneOf(p:any): PlayerView['role'] {
  const t = String(p.teamPosition ?? '').toUpperCase();
  if (t === 'MIDDLE') return 'MID';
  if (t === 'BOTTOM') return 'ADC';
  if (['TOP','JUNGLE','MID','ADC','SUPPORT'].includes(t)) return t as any;
  return 'UNKNOWN';
}

const itemsOf = (p:any) => [0,1,2,3,4,5,6].map(i=>p[`item${i}`]).filter((x:number)=>x && x!==0);

function toPlayer(p:any): PlayerView {
  return {
    puuid: p.puuid,
    summonerName: p.summonerName,
    champion: p.championName,
    role: laneOf(p),
    teamId: p.teamId as 100|200,
    k: p.kills ?? 0, d: p.deaths ?? 0, a: p.assists ?? 0,
    cs: (p.totalMinionsKilled ?? 0) + (p.neutralMinionsKilled ?? 0),
    gold: p.goldEarned ?? 0,
    dmgChamp: p.totalDamageDealtToChampions ?? 0,
    visionScore: p.visionScore ?? 0,
    items: itemsOf(p),
    spells: [p.summoner1Id, p.summoner2Id].filter(Boolean),
  };
}

export function toPOV(matchDto:any, puuid: string): MatchPOV {
  const info = matchDto?.info ?? {};
  const meta = matchDto?.metadata ?? {};
  const parts = info.participants ?? [];

  const meRaw = parts.find((p:any)=>p.puuid === puuid);
  if (!meRaw) throw new Error("PUUID non presente nel match");

  const me = toPlayer(meRaw);
  const opp = parts
    .filter((p:any)=>p.teamId !== me.teamId)
    .map(toPlayer)
    .find(p => p.role === me.role);

  const patch = String(info.gameVersion ?? '').split('.').slice(0,2).join('.');
  const teams = info.teams ?? [];
  const teamStats = teams.map((t:any)=>({
    teamId: t.teamId as 100|200,
    dragons: t.objectives?.dragon?.kills ?? 0,
    heralds: t.objectives?.riftHerald?.kills ?? 0,
    barons:  t.objectives?.baron?.kills ?? 0,
    towers:  t.objectives?.tower?.kills ?? 0,
  }));

  return {
    matchId: meta.matchId,
    patch,
    durationSec: info.gameDuration ?? 0,
    queueId: info.queueId ?? 0,
    player: me,
    opponent: opp,
    teamStats,
  };
}
