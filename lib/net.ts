/**
 * Network hardening: timeouts, bounded retries, and SSRF guards for every
 * outbound request the platform makes.
 */

export const DEFAULT_TIMEOUT_MS = 15_000;

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * fetch with an AbortController timeout and a single retry on 5xx,
 * timeout, or network failure. 4xx responses are returned as-is
 * (retrying a client error is pointless).
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = opts.retries ?? 1;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status >= 500 && attempt < retries) {
        lastError = new Error(`Upstream ${res.status}`);
        await backoff(attempt);
        continue;
      }
      return res;
    } catch (err: unknown) {
      lastError = err instanceof Error && err.name === "AbortError" ? new TimeoutError(timeoutMs) : err;
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

function backoff(attempt: number) {
  return new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
}

/** Wraps a promise with a timeout (for SDKs that don't expose AbortController). */
export function withTimeout<T>(promise: Promise<T>, ms: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,          // link-local / cloud metadata
  /^\[?::1\]?$/,
  /^\[?fc/i, /^\[?fd/i,   // IPv6 ULA
  /^\[?fe80/i,            // IPv6 link-local
  /\.local$/i,
  /\.internal$/i,
  /^metadata\./i,
];

/**
 * Validates a user-supplied URL for server-side fetching.
 * Hostname-pattern based: blocks the obvious internal/metadata targets.
 * (DNS-rebinding-grade SSRF defence belongs at the network layer.)
 */
export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error(`Invalid URL: ${raw.slice(0, 100)}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Blocked protocol: ${url.protocol}`);
  }
  if (PRIVATE_HOST_PATTERNS.some((p) => p.test(url.hostname))) {
    throw new Error(`Blocked host: ${url.hostname} (private/internal addresses are not allowed)`);
  }
  return url;
}
