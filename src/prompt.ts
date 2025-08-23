export function buildPrompt(pack: any) {
  return `
You are a professional League of Legends coach. Produce an analysis that is STRICTLY grounded in the provided PACK.

Rules (very important):
- Write in ENGLISH.
- DO NOT invent facts. Use ONLY what's in PACK.
- Always EXPLAIN WHY for each suggestion, referencing (a) cohort deltas and (b) ENEMY COMP synergies/threats.
- Be specific: avoid generic lines like "improve KDA".
- Item recommendations must include WHEN to buy and WHY vs enemy comp or cohort gaps.
- Output VALID JSON ONLY with the following schema:
- Provide EXACTLY 5 suggestions (not fewer, not more).
{
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": [{
    "title": string,
    "rationale": string,
    "timeframe": "early"|"mid"|"late",
    "priority": "high"|"medium"|"low",
    "expected_impact": string,
    "references": string[]
  }],
  "item_recommendations": [{
    "item_id": number,
    "when": "first"|"second"|"third"|"situational",
    "reason": string,
    "vs_tags": string[]
  }],
  "notes": string[]
}

PACK (numbers are real; cite them):
${JSON.stringify(pack)}
`;
}
