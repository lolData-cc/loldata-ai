import type { PlayerRow } from "./db-cohort";
import type { CohortStats, ItemFreq } from "./db-cohort";

export function buildComparison(me: PlayerRow, cohort: CohortStats, topItems: ItemFreq[]) {
  const kdaMe = me.deaths === 0 ? me.kills + me.assists : (me.kills + me.assists) / me.deaths;
  const kdaAvg = cohort.avg_d === 0 ? (cohort.avg_k + cohort.avg_a) : (cohort.avg_k + cohort.avg_a) / cohort.avg_d;

  const deltas = {
    kills: me.kills - cohort.avg_k,
    deaths: me.deaths - cohort.avg_d,
    assists: me.assists - cohort.avg_a,
    gold: me.gold_earned - cohort.avg_gold,
    dmg: me.total_damage_to_champions - cohort.avg_dmg,
    vision: me.vision_score - cohort.avg_vision,
    kda: kdaMe - kdaAvg,
  };

  const myItems = [me.item0,me.item1,me.item2,me.item3,me.item4,me.item5,me.item6].filter(x=>x && x>0);
  const topItemIds = topItems.map(t=>t.item_id);
  const missingCore = topItemIds.filter(id => !myItems.includes(id)).slice(0,3);

  return {
    kdaMe: +kdaMe.toFixed(2),
    kdaAvg: +kdaAvg.toFixed(2),
    deltas: Object.fromEntries(Object.entries(deltas).map(([k,v])=>[k, +Number(v).toFixed(1)])) as typeof deltas,
    cohort: {
      n: cohort.n,
      winrate: +(cohort.winrate*100).toFixed(1),
      avg: {
        k:+cohort.avg_k.toFixed(1), d:+cohort.avg_d.toFixed(1), a:+cohort.avg_a.toFixed(1),
        gold:+cohort.avg_gold.toFixed(0),
        dmg:+cohort.avg_dmg.toFixed(0),
        vision:+cohort.avg_vision.toFixed(1),
        p50_dmg:+cohort.p50_dmg.toFixed(0), p90_dmg:+cohort.p90_dmg.toFixed(0),
        p50_vision:+cohort.p50_vision.toFixed(1), p90_vision:+cohort.p90_vision.toFixed(1),
      },
      topItems: topItems.map(t=>({ item: t.item_id, freq: +(+t.freq*100).toFixed(1) }))
    },
    my: {
      champ: me.champion_name,
      role: me.role_norm,
      win: me.win,
      gold: me.gold_earned,
      dmg: me.total_damage_to_champions,
      vision: me.vision_score,
      items: myItems
    },
    missingCore
  };
}
