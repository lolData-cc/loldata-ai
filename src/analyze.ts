// src/analyze.ts
import type { MatchPOV } from "./types";

export function basicAnalysis(ms: MatchPOV) {
  const durMin = Math.max(1, Math.round(ms.durationSec / 60));
  const me = ms.player;
  const opp = ms.opponent;
  const myTeam = ms.teamStats.find(t=>t.teamId === me.teamId)!;
  const enTeam = ms.teamStats.find(t=>t.teamId !== me.teamId)!;

  const kda = me.d === 0 ? me.k + me.a : (me.k + me.a) / me.d;
  const csPerMin = +(me.cs / durMin).toFixed(2);
  const visPerMin = +( (me.visionScore ?? 0) / durMin ).toFixed(2);
  const objMy = (myTeam.dragons + myTeam.heralds + myTeam.barons);
  const objEn = (enTeam.dragons + enTeam.heralds + enTeam.barons);

  const strengths:string[] = [];
  const weaknesses:string[] = [];
  const suggestions:string[] = [];

  // euristiche base
  if (kda >= 3) strengths.push(`Buon KDA (${kda.toFixed(2)}).`);
  if (csPerMin >= 6.5 && ['MID','ADC','TOP'].includes(me.role)) strengths.push(`CS buono per il ruolo (${csPerMin}/min).`);
  if (visPerMin >= 1.2) strengths.push(`Visione curata (${visPerMin}/min).`);
  if (objMy > objEn) strengths.push(`Controllo obiettivi positivi (${objMy} vs ${objEn}).`);

  if (kda < 2) weaknesses.push(`KDA basso (${kda.toFixed(2)}): valuta trade più selettivi e reset sicuri.`);
  if (['MID','ADC','TOP'].includes(me.role) && csPerMin < 5.5) weaknesses.push(`CS basso per il ruolo (${csPerMin}/min).`);
  if (visPerMin < 0.8) weaknesses.push(`Visione bassa (${visPerMin}/min): più ward/clear in momenti sicuri.`);
  if (objMy < objEn) weaknesses.push(`Obiettivi principali sfuggiti (${objMy} vs ${objEn}).`);

  // suggerimenti mirati
  suggestions.push(`Rivedi il **primo reset**: obiettivo tornare in lane entro il 4:00 con power spike iniziale se possibile.`);
  if (['ADC','MID','TOP'].includes(me.role) && csPerMin < 6) suggestions.push(`Allena wave management (slow → crash) per alzare il CS a ≥6/min entro i 12'.`);
  if (visPerMin < 1) suggestions.push(`Punta a ≥1.2 vision/min: posiziona ward profonde dopo push e usa controlli su obiettivi.`);
  if (opp && me.dmgChamp < (opp.dmgChamp * 0.7)) suggestions.push(`Danni bassi vs ${opp.champion}: cerca finestre di trade con priorità wave o chiama jungler per setup.`);
  if (myTeam.heralds === 0) suggestions.push(`Forzate **Herald #1** con prio corsie vicine (8:00–10:00) per placcature e pressione map control.`);

  const summary = `${me.champion} ${me.role} • patch ${ms.patch} • durata ${durMin}m — K/D/A ${me.k}/${me.d}/${me.a}, CS ${me.cs} (${csPerMin}/min), Vision ${visPerMin}/min. Obiettivi: ${objMy} vs ${objEn}.`;

  return { summary, strengths, weaknesses, suggestions, metrics: { kda:+kda.toFixed(2), csPerMin, visionPerMin: visPerMin, myObjectives: objMy, enemyObjectives: objEn } };
}
