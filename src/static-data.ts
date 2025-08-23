import { sb } from "./supabase";

export async function getChampionRelease(name: string) {
  const { data, error } = await sb
    .from("champions_static")
    .select("name, release_date, class, tags")
    .eq("name", name)
    .maybeSingle();
  if (error) throw error;
  return data; // may be null
}