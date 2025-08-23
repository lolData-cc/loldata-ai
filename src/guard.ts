import { AnalysisZ, SuggestionZ } from "./analysis-schema";
import { askLLM, SUGG_COUNT } from "./llm";

type Pack = {
  player: { champ: string; role: string; win: boolean };
  deltas: { kills:number; deaths:number; assists:number; gold:number; dmg:number; vision:number; kda:number };
  cohort: { n:number; winrate:number; avg:any; };
  top_items: Array<{ item:number; freq:number }>;
  enemy_comp: string[];
};

function enemyTags(enemy: string[]): string[] {
  const tanks = ["Sejuani","Ornn","Sion","Zac","Malphite","Rammus","Cho'Gath","Maokai","Shen","Nautilus"];
  const poke  = ["Xerath","Ziggs","Jayce","Varus","Zoe","Caitlyn"];
  const burst = ["LeBlanc","Zed","Kassadin","Fizz","Rengar","Khazix"];
  const tags: string[] = [];
  if (enemy.some(c => tanks.includes(c))) tags.push("vs tanks");
  if (enemy.some(c => poke.includes(c)))  tags.push("vs poke");
  if (enemy.some(c => burst.includes(c))) tags.push("vs burst");
  return tags.length ? tags : ["vs general comp"];
}

function makeRuleSuggestions(pack: Pack) {
  const s: Array<z.infer<typeof SuggestionZ>> = [];
  const { champ, role } = pack.player;
  const eTags = enemyTags(pack.enemy_comp);
  const d = pack.deltas;

  // Damage gap
  if (d.dmg < -2000) {
    s.push({
      title: "Close the damage gap with earlier spike",
      rationale: `You are ${Math.abs(Math.round(d.dmg))} below cohort avg damage. Prioritize an earlier damage spike (fight timings after wave crash) to convert farm into DPS.`,
      timeframe: "mid",
      priority: "high",
      expected_impact: "Higher mid‑game DPS and objective threat",
      references: [`cohort:dmg ${d.dmg}`, `role:${role}`],
    });
  }

  // Vision gap
  if (d.vision < -1) {
    s.push({
      title: "Raise vision pace with planned ward cycles",
      rationale: `Vision is ${Math.abs(d.vision).toFixed(1)}/min below cohort. Ward on push windows and contest vision before objectives to reduce deaths and force better fights.`,
      timeframe: "mid",
      priority: "medium",
      expected_impact: "+ vision/min, fewer face‑checks",
      references: [`cohort:vision ${d.vision}`],
    });
  }

  // Deaths high
  if (d.deaths > 0.8) {
    s.push({
      title: "Tighten death discipline around spikes",
      rationale: `Deaths are +${d.deaths.toFixed(1)} vs cohort. Sync recalls with wave state and jungler path; avoid taking fights without cooldowns/summs.`,
      timeframe: "early",
      priority: "high",
      expected_impact: "Less gold bleed, better KDA windows",
      references: [`cohort:deaths ${d.deaths}`],
    });
  }

  // Role‑specific CS/Gold
  if (["TOP","MID","ADC"].includes(role) && d.gold < -800) {
    s.push({
      title: "Stabilize lane economy (crash → reset)",
      rationale: `Gold is ${Math.abs(Math.round(d.gold))} behind the cohort. Aim for slow push → crash → reset timings to secure component buys on time.`,
      timeframe: "early",
      priority: "medium",
      expected_impact: "+CS consistency, earlier component spikes",
      references: [`cohort:gold ${d.gold}`],
    });
  }

  // Enemy comp tags
  s.push({
    title: "Adapt fights to enemy comp",
    rationale: `Enemy comp: ${pack.enemy_comp.join(", ")}. Adjust angles and objectives according to threats (${eTags.join(", ")}).`,
    timeframe: "mid",
    priority: "low",
    expected_impact: "Cleaner engages and better target selection",
    references: [`enemy:${eTags.join("|")}`],
  });

  // Ensure exactly SUGG_COUNT by trimming or adding generic-but-specific
  return s.slice(0, SUGG_COUNT);
}

export async function ensureAnalysisOrRepair(llmRaw: any, pack: Pack) {
  // First pass
  let parsed = AnalysisZ.safeParse(llmRaw);
  if (parsed.success && parsed.data.suggestions.length >= 3) return parsed.data;

  // Repair prompt (one retry)
  const errors = parsed.success ? [] : parsed.error.issues;
  const fixPrompt = `
You returned an invalid JSON for the coaching analysis. FIX IT.
Rules:
- Return a VALID JSON ONLY (no prose outside JSON).
- Provide EXACTLY ${SUGG_COUNT} suggestions with full fields.
- Keep all reasoning grounded on PACK.

ERRORS:
${JSON.stringify(errors, null, 2)}

BROKEN_JSON:
${JSON.stringify(llmRaw)}

PACK:
${JSON.stringify(pack)}
`;
  const repaired = await askLLM(fixPrompt);
  parsed = AnalysisZ.safeParse(repaired);
  if (parsed.success && parsed.data.suggestions.length >= 3) return parsed.data;

  // Final fallback: synthesize suggestions; ensure arrays exist
  const fallbackSuggestions = makeRuleSuggestions(pack);
  return {
    summary: typeof llmRaw?.summary === "string" ? llmRaw.summary : "Grounded analysis based on cohort deltas.",
    strengths: Array.isArray(llmRaw?.strengths) ? llmRaw.strengths : [],
    weaknesses: Array.isArray(llmRaw?.weaknesses) ? llmRaw.weaknesses : [],
    suggestions: fallbackSuggestions,
    item_recommendations: Array.isArray(llmRaw?.item_recommendations) ? llmRaw.item_recommendations : [],
    notes: ["Auto‑repaired to meet schema; some items are rule‑based."]
  };
}
