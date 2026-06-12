import type { SupabaseClient } from "@supabase/supabase-js";

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class SystemLogger {
  log(level: LogLevel, module: string, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logStr = `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
    if (level === 'error') console.error(logStr, data || '');
    else if (level === 'warn') console.warn(logStr, data || '');
    else if (level === 'debug') console.debug(logStr, data || '');
    else console.log(logStr, data || '');
  }

  info(module: string, message: string, data?: unknown) { this.log('info', module, message, data); }
  warn(module: string, message: string, data?: unknown) { this.log('warn', module, message, data); }
  error(module: string, message: string, data?: unknown) { this.log('error', module, message, data); }
  debug(module: string, message: string, data?: unknown) { this.log('debug', module, message, data); }
}

export const logger = new SystemLogger();

/**
 * Persist a log entry to the user's `logs` table. Fire-and-forget safe:
 * failures are reported to the console, never thrown.
 */
export async function persistLog(
  supabase: SupabaseClient,
  userId: string,
  level: LogLevel,
  module: string,
  message: string,
  data?: Record<string, unknown>
) {
  logger.log(level, module, message, data);
  const { error } = await supabase.from("logs").insert({
    user_id: userId,
    level,
    module,
    message,
    data: data ?? null,
  });
  if (error) console.error("Failed to persist log:", error.message);
}
