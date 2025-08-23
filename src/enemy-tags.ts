export function enemyTagsFromNames(enemy: string[]): string[] {
  const tanks = new Set(["Sejuani","Ornn","Sion","Zac","Malphite","Rammus","Cho'Gath","Maokai","Shen","Nautilus","Dr. Mundo","Poppy"]);
  const poke  = new Set(["Xerath","Ziggs","Jayce","Varus","Zoe","Caitlyn","Lux","Vel'Koz","Ezreal"]);
  const burst = new Set(["LeBlanc","Zed","Kassadin","Fizz","Rengar","Kha'Zix","Akali","Talon"]);
  const adJg  = new Set(["Lee Sin","Xin Zhao","Graves","Kindred","Kayn","Olaf","Nidalee","Vi"]);

  const tags = new Set<string>();
  for (const c of enemy) {
    if (tanks.has(c)) tags.add("vs tanks");
    if (poke.has(c)) tags.add("vs poke");
    if (burst.has(c)) tags.add("vs burst");
    if (adJg.has(c)) tags.add("vs AD jungler");
  }
  return tags.size ? Array.from(tags) : ["vs general comp"];
}
