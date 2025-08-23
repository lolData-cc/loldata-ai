// src/chat-fallback.ts
type TopItem = { item: number; freq: number };

function bullet(lines: string[]) {
  return lines.filter(Boolean).map(s => `- ${s}`).join("\n");
}

function formatTopItems(items: TopItem[], max = 6) {
  if (!items?.length) return "No cohort item data available.";
  const top = items.slice(0, max).map(i => `Item ${i.item} (~${i.freq}% pick)`).join(", ");
  return `Common items: ${top}.`;
}

export function fallbackAnswer(input: {
  question: string;
  topic: string;
  champion?: string|null;
  opponent?: string|null;
  role?: string|null;
  cohort?: { n:number; winrate:number };
  top_items?: TopItem[];
  enemy_tags?: string[];
}) {
  const champ = input.champion ?? "your champion";
  const role = input.role ? input.role.toLowerCase() : "role";
  const vs = input.opponent ? ` vs ${input.opponent}` : "";
  const tags = input.enemy_tags?.length ? ` (enemy tags: ${input.enemy_tags.join(", ")})` : "";
  const cohortNote = input.cohort?.n
    ? `Based on your cohort (n=${input.cohort.n}, winrate ${input.cohort.winrate}%), here’s a practical baseline.`
    : `No cohort found for this query — recommendations are based on general coaching principles.`;

  if (input.topic === "build") {
    return [
      `${champ} ${role}${vs}${tags}: build guidance`,
      cohortNote,
      bullet([
        `Start with a safe early component that supports your first clear and early skirmishes.`,
        input.top_items?.length ? formatTopItems(input.top_items) : "",
        `Buy **situational defenses** against the main threat (e.g., armor vs heavy AD, MR vs burst AP).`,
        `Spike your **second item** around first big objectives; adjust if enemy comp scales faster.`,
        `Swap to **Oracle Lens** if you need to deny vision before objectives.`
      ])
    ].join("\n\n");
  }

  if (input.topic === "runes") {
    return [
      `${champ} ${role}${vs}${tags}: rune guidance`,
      cohortNote,
      bullet([
        `Primary tree should align with your early win condition (gank/duel/clear speed).`,
        `Secondary tree supplies your main weakness (tenacity vs CC, sustain vs poke, haste for uptime).`,
        `Shard choices adapt to matchup: defensive vs burst/poke, offensive if you control tempo.`,
        `If unsure, pick a **stable page**: one that keeps your first two clears safe and skirmishes reliable.`
      ])
    ].join("\n\n");
  }

  if (input.topic === "release_date") {
    return `I don’t have a static record for this champion’s release date yet. If you’d like, seed the "champions_static" table and I’ll answer precisely next time.`;
  }

  // generic/meta/matchup/item/ability etc.
  return [
    `Answering your question:`,
    cohortNote,
    bullet([
      `Frame your plan around early win conditions and objective timers.`,
      `Manage vision proactively: ward on push windows; deny before objectives.`,
      `Adapt itemization to enemy threats${tags ? tags : ""}.`,
      `Trade on cooldown advantages and wave states; avoid coin‑flip fights.`
    ])
  ].join("\n\n");
}
