import { GoogleGenAI } from "@google/genai";
import { RouterInput, RouterOutput } from "../types";
import { fetchWithRetry, withTimeout, DEFAULT_TIMEOUT_MS, TimeoutError } from "../net";

export interface RoutingWeights {
  gemini: number;
  nvidia: number;
}

/** User-provided keys take precedence over environment keys. */
export interface ProviderKeys {
  gemini?: string | null;
  nvidia?: string | null;
}

const GEMINI_MODELS = { reasoning: 'gemini-2.5-pro', fast: 'gemini-2.5-flash' };
// NOTE: verify IDs with a real chat/completions call before changing — the
// NVIDIA catalog lists models (e.g. llama-3.1-405b) that 404 at inference time.
const NVIDIA_MODELS = { reasoning: 'meta/llama-3.3-70b-instruct', fast: 'meta/llama-3.1-70b-instruct' };

const REASONING_TASKS = ['reasoning', 'planning'];

/**
 * Routes an inference request to Gemini or NVIDIA.
 *
 * Provider choice = user-configured routing weight (settings table) plus a
 * task-type affinity bonus: reasoning/planning lean Gemini, fast_action/extraction
 * lean NVIDIA. The losing provider is the fallback. A provider with no API key
 * configured scores zero and is skipped.
 */
export async function routeAI(
  input: RouterInput,
  weights: RoutingWeights = { gemini: 0.5, nvidia: 0.5 },
  keys: ProviderKeys = {}
): Promise<RouterOutput> {
  const isReasoning = REASONING_TASKS.includes(input.taskType);

  const geminiKey = keys.gemini || process.env.GEMINI_API_KEY || '';
  const nvidiaKey = keys.nvidia || process.env.NVIDIA_API_KEY || '';
  const geminiAvailable = !!geminiKey;
  const nvidiaAvailable = !!nvidiaKey;
  if (!geminiAvailable && !nvidiaAvailable) {
    throw new Error("No AI provider configured: add a Gemini or NVIDIA key in Enterprise → API Keys, or set env vars");
  }

  const geminiScore = geminiAvailable ? weights.gemini + (isReasoning ? 0.25 : 0) : -1;
  const nvidiaScore = nvidiaAvailable ? weights.nvidia + (!isReasoning ? 0.25 : 0) : -1;

  const order: Array<'gemini' | 'nvidia'> =
    geminiScore >= nvidiaScore ? ['gemini', 'nvidia'] : ['nvidia', 'gemini'];

  const startTime = Date.now();
  let lastError: unknown = null;

  for (const provider of order) {
    if (provider === 'gemini' && !geminiAvailable) continue;
    if (provider === 'nvidia' && !nvidiaAvailable) continue;

    const model = provider === 'gemini'
      ? (isReasoning ? GEMINI_MODELS.reasoning : GEMINI_MODELS.fast)
      : (isReasoning ? NVIDIA_MODELS.reasoning : NVIDIA_MODELS.fast);

    try {
      const result = provider === 'gemini'
        ? await runGemini(input, model, geminiKey)
        : await runNvidia(input, model, nvidiaKey);

      return {
        model_used: model,
        task_type: input.taskType,
        result,
        confidence: 0.95,
        tokens_estimate: Math.ceil(result.length / 4),
        latency_ms: Date.now() - startTime,
      };
    } catch (err) {
      lastError = err;
      console.error(`${provider} failed${order.indexOf(provider) === 0 ? ', falling back' : ''}:`, err);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All AI providers failed");
}

async function runGemini(input: RouterInput, model: string, apiKey: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = input.messages.map(m => m.content).join('\n');

  // The SDK doesn't expose AbortController, so enforce the deadline with a
  // promise race and retry once on timeout/5xx-class failures.
  const call = () => withTimeout(
    ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction: input.systemInstruction }
    }),
    DEFAULT_TIMEOUT_MS
  );

  let response;
  try {
    response = await call();
  } catch (err: unknown) {
    const retryable = err instanceof TimeoutError ||
      (err instanceof Error && /\b5\d{2}\b|UNAVAILABLE|INTERNAL/i.test(err.message));
    if (!retryable) throw err;
    response = await call();
  }
  return response.text || '';
}

async function runNvidia(input: RouterInput, model: string, apiKey: string): Promise<string> {
  const baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  if (!apiKey) throw new Error("Missing NVIDIA_API_KEY");

  const messages = [];
  if (input.systemInstruction) {
    messages.push({ role: 'system', content: input.systemInstruction });
  }
  messages.push(...input.messages);

  const res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 1024,
      top_p: 0.7,
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NVIDIA API Error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
