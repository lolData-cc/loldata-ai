// src/riot.ts
export type Region = 'americas'|'europe'|'asia'|'sea';

const ROUTE_BY_PREFIX: Record<string, Region> = {
  EUW1:'europe', EUN1:'europe', TR1:'europe', RU:'europe',
  NA1:'americas', BR1:'americas', LA1:'americas', LA2:'americas', OC1:'americas',
  KR:'asia', JP1:'asia',
  PH2:'sea', SG2:'sea', TH2:'sea', TW2:'sea', VN2:'sea',
};

export function inferRegionFromMatchId(matchId: string): Region {
  const prefix = matchId.split('_')[0];
  return ROUTE_BY_PREFIX[prefix] ?? 'europe';
}

export async function fetchMatch(matchId: string, region?: Region) {
  const routing = region ?? inferRegionFromMatchId(matchId);
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const res = await fetch(url, { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY! } });
  if (!res.ok) throw new Error(`Riot API ${res.status}`);
  return res.json(); // raw match DTO
}
