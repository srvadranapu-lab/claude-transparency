// Centralized AI service layer.
//
// SECURITY NOTE: This module calls OpenRouter directly from the browser using a
// `VITE_`-prefixed key, which means the key ships inside the client bundle and
// is visible to anyone using the deployed site. This is acceptable for a
// prototype, but for production usage you should move this call behind a
// server-side endpoint (e.g. a Vercel/Edge Function, or Lovable Cloud edge
// function) and keep the key as a server-only secret.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";
const DEFAULT_MAX_TOKENS = 2000;
const HARD_MAX_TOKENS = 4000;

const SYSTEM_PROMPT = `You are Claude, a helpful AI assistant. When the user asks any question, respond ONLY with a valid JSON object and nothing else — no preamble, no markdown, no backticks. The JSON must have exactly these five keys:

{
  "answer": "A clear, helpful, conversational answer to the question. 3 to 5 sentences. Plain prose, no bullet points, no headers.",
  "assumptions": "What assumptions you made about the user's context, location, intent, or situation that shaped this answer. Be honest about what you assumed.",
  "confidence_gap": "Where your confidence is lower — what depends on facts you don't have, what has high variance, or what the user should not take as certain.",
  "verify_before_acting": "Specific things the user should verify, check, or confirm before acting on this answer. Concrete and actionable.",
  "fork_considered": "The alternative interpretation or framing you considered but did not take, and why you chose the approach you did instead."
}

Always return valid JSON. Never return anything outside the JSON object.`;

export interface ReasoningResponse {
  answer: string;
  assumptions: string;
  confidence_gap: string;
  verify_before_acting: string;
  fork_considered: string;
}

const isDev = (import.meta as any).env?.DEV === true;

function getApiKey(): string {
  const key = (import.meta as any).env?.VITE_OPENROUTER_API_KEY as string | undefined;
  if (!key) {
    const msg =
      "[AI] Missing VITE_OPENROUTER_API_KEY. Add it to your local .env file " +
      "(see .env.example) and configure it in your deployment environment " +
      "(e.g. Vercel → Project Settings → Environment Variables).";
    console.error(msg);
    throw new Error(msg);
  }
  return key;
}

function extractJson(text: string): unknown {
  // Try direct parse first, then fall back to the first {...} block.
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Response did not contain JSON");
    return JSON.parse(match[0]);
  }
}

function validateReasoning(obj: unknown): ReasoningResponse {
  if (!obj || typeof obj !== "object") throw new Error("Parsed response is not an object");
  const o = obj as Record<string, unknown>;
  const required = ["answer", "assumptions", "confidence_gap", "verify_before_acting", "fork_considered"] as const;
  for (const k of required) {
    if (typeof o[k] !== "string" || !(o[k] as string).trim()) {
      throw new Error(`Missing/invalid field: ${k}`);
    }
  }
  return {
    answer: o.answer as string,
    assumptions: o.assumptions as string,
    confidence_gap: o.confidence_gap as string,
    verify_before_acting: o.verify_before_acting as string,
    fork_considered: o.fork_considered as string,
  };
}

export async function generateReasoning(
  userMessage: string,
  opts: { model?: string; maxTokens?: number } = {}
): Promise<ReasoningResponse> {
  const apiKey = getApiKey();
  const model = opts.model ?? DEFAULT_MODEL;
  const maxTokens = Math.min(opts.maxTokens ?? DEFAULT_MAX_TOKENS, HARD_MAX_TOKENS);

  if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
    throw new Error("generateReasoning: userMessage is required");
  }

  const payload = {
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  };

  if (isDev) {
    console.debug("[AI] →", { url: OPENROUTER_URL, model, maxTokens, userMessage });
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
        "X-Title": "Reasoning Transparency Layer",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    console.error("[AI] Network error calling OpenRouter:", networkErr);
    throw new Error("Network error calling OpenRouter. Check your connection.");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "<unreadable body>");
    console.error(`[AI] OpenRouter HTTP ${response.status}:`, body);
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    console.error("[AI] Failed to parse OpenRouter JSON envelope:", err);
    throw new Error("OpenRouter returned an unparseable response");
  }

  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    console.error("[AI] Unexpected OpenRouter response shape:", data);
    throw new Error("OpenRouter response is missing choices[0].message.content");
  }

  if (isDev) console.debug("[AI] ← raw content:", content);

  let parsed: unknown;
  try {
    parsed = extractJson(content);
  } catch (err) {
    console.error("[AI] Failed to parse model JSON. Raw content:", content, err);
    throw new Error("Model did not return valid JSON");
  }

  try {
    return validateReasoning(parsed);
  } catch (err) {
    console.error("[AI] Response failed schema validation:", parsed, err);
    throw err instanceof Error ? err : new Error(String(err));
  }
}
