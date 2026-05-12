import { createClient } from "@/lib/supabase/server";

export type UnitOption = {
  id: string;
  name: string;
};

export async function getUnits(): Promise<UnitOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as UnitOption[];
}