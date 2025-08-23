// src/types.ts
export type Region = 'americas'|'europe'|'asia'|'sea';

export interface MatchAnalyzeRequest {
  matchId: string;
  puuid: string;
  region?: Region;
}

export interface PlayerView {
  puuid: string;
  summonerName?: string;
  champion: string;
  role: 'TOP'|'JUNGLE'|'MID'|'ADC'|'SUPPORT'|'UNKNOWN';
  teamId: 100|200;
  k: number; d: number; a: number;
  cs: number;
  gold: number;
  dmgChamp: number;
  visionScore: number;
  items: number[];
  spells: number[];
}

export interface MatchPOV {
  matchId: string;
  patch: string;
  durationSec: number;
  queueId: number;
  player: PlayerView;
  opponent?: PlayerView;
  teamStats: { teamId:100|200; dragons:number; heralds:number; barons:number; towers:number; }[];
}
