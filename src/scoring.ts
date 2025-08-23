type Deltas = { kills:number; deaths:number; assists:number; gold:number; dmg:number; vision:number; kda:number };

function clamp01(x:number){ return Math.max(0, Math.min(1, x)); }
function zScore(delta:number, scale:number){ return delta / (scale || 1); } // simple normalization

export function scoreFromDeltas(d: Deltas) {
  // Tune scales to your dataset (roughly 1 stdev equivalents):
  const s = {
    kda: 1.0, dmg: 2500, vision: 2.0, gold: 1200, deaths: 1.0,
  };

  // Convert deltas to [0..1] contributions
  const dmgC   = clamp01( 0.5 + 0.25 * zScore(d.dmg, s.dmg) );         // ± two stdevs ~ [0..1]
  const visC   = clamp01( 0.5 + 0.25 * zScore(d.vision, s.vision) );
  const kdaC   = clamp01( 0.5 + 0.25 * zScore(d.kda, s.kda) );
  const goldC  = clamp01( 0.5 + 0.2  * zScore(d.gold, s.gold) );
  const survC  = clamp01( 0.5 - 0.25 * zScore(d.deaths, s.deaths) );   // fewer deaths = higher

  // Map to sub-scores 0..100
  const damage = Math.round(dmgC * 100);
  const vision = Math.round(visC * 100);
  const mechanics = Math.round(kdaC * 100);
  const macro = Math.round(((goldC + vision)/2) * 100);
  const survivability = Math.round(survC * 100);

  // Weighted overall
  const overall = Math.round(
    0.30 * damage +
    0.20 * vision +
    0.25 * mechanics +
    0.15 * macro +
    0.10 * survivability
  );

  const badges:string[] = [];
  if (vision >= 75 && damage < 50) badges.push("Vision Leader");
  if (damage >= 75 && survivability < 50) badges.push("Risky Carry");
  if (survivability >= 75 && mechanics >= 70) badges.push("Reliable Frontline");

  return {
    overall,
    dimensions: { mechanics, macro, vision, damage, survivability },
    badges
  };
}
