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

export interface UserSecrets {
  gemini: string | null;
  nvidia: string | null;
  places: string | null;
}

/**
 * Loads the user's stored API keys (server-side only — never send these to the
 * client). Engines prefer these over process.env so a user can bring their own.
 */
export async function getUserSecrets(supabase: SupabaseClient): Promise<UserSecrets> {
  const { data } = await supabase
    .from("settings")
    .select("gemini_api_key, nvidia_api_key, google_places_api_key")
    .single<{ gemini_api_key: string | null; nvidia_api_key: string | null; google_places_api_key: string | null }>();
  return {
    gemini: data?.gemini_api_key?.trim() || null,
    nvidia: data?.nvidia_api_key?.trim() || null,
    places: data?.google_places_api_key?.trim() || null,
  };
}
