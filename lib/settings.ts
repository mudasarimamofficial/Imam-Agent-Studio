import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminConfig } from "./types";

const DEFAULTS: AdminConfig = {
  agent_concurrency_limit: 10,
  memory_retention_days: 30,
  routing_weight_gemini: 0.5,
  routing_weight_nvidia: 0.5,
};

/** Loads the authenticated user's settings row; falls back to defaults. */
export async function getUserSettings(supabase: SupabaseClient): Promise<AdminConfig> {
  const { data } = await supabase
    .from("settings")
    .select("agent_concurrency_limit, memory_retention_days, routing_weight_gemini, routing_weight_nvidia")
    .single<AdminConfig>();
  if (!data) return DEFAULTS;
  return {
    ...data,
    routing_weight_gemini: Number(data.routing_weight_gemini),
    routing_weight_nvidia: Number(data.routing_weight_nvidia),
  };
}
