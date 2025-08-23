// src/retrieval.ts
import { embed } from "./embeddings";
import { kbSearch } from "./kb";
import type { MatchSummary } from "./types";

export async function retrieveForPlayer(ms: MatchSummary, topK=10) {
  const topics = ['build','laning','macro','vision','midgame','powerspike'];
  const opp = ms.opponent?.champion ? ` vs ${ms.opponent.champion}` : '';
  const q = [
    `patch:${ms.patch}`,
    `champ:${ms.player.champion}${opp}`,
    `role:${ms.player.role}`,
    ...topics.map(t=>`topic:${t}`)
  ].join(' ');

  const qvec = await embed(q);
  return kbSearch(qvec, topK, null);
}
