/**
 * AI model registry for PACE.
 *
 * Uses the Vercel AI SDK v6 provider adapters for a unified interface
 * across Gemini, OpenAI, and Anthropic.
 *
 * Usage in routes:
 *   const { model } = getModel(user.preferredModel);
 *   const result = streamText({ model, system, messages, temperature: 0.5 });
 *   const { text } = await generateText({ model, system, messages });
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import type { ModelInfo } from "./provider";

// ── All supported models (order = fallback priority) ────────────────────────

export const ALL_MODELS: ModelInfo[] = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    available: !!process.env.GEMINI_API_KEY,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    available: !!process.env.OPENAI_API_KEY,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    available: !!process.env.OPENAI_API_KEY,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    available: !!process.env.ANTHROPIC_API_KEY,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    available: !!process.env.ANTHROPIC_API_KEY,
  },
];

// ── Lazy singleton provider clients (one per family, instantiated on demand) ─

let googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;
let openaiProvider: ReturnType<typeof createOpenAI> | null = null;
let anthropicProvider: ReturnType<typeof createAnthropic> | null = null;

function googleClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  googleProvider ??= createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  return googleProvider;
}

function openaiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  openaiProvider ??= createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiProvider;
}

function anthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  anthropicProvider ??= createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicProvider;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the AI SDK LanguageModel for a given model ID, or null if the
 * required env var is not set.
 */
export function getLanguageModel(modelId: string): LanguageModel | null {
  const info = ALL_MODELS.find((m) => m.id === modelId);
  if (!info?.available) return null;

  if (info.provider === "gemini") {
    const client = googleClient();
    return client ? client(modelId) : null;
  }
  if (info.provider === "openai") {
    const client = openaiClient();
    return client ? client(modelId) : null;
  }
  if (info.provider === "anthropic") {
    const client = anthropicClient();
    return client ? client(modelId) : null;
  }
  return null;
}

/**
 * Resolves the LanguageModel to use for a user request.
 *
 * Priority:
 *   1. preferredModelId (if set and its API key is present)
 *   2. First available model in ALL_MODELS order (Gemini → OpenAI → Anthropic)
 *
 * Throws only if NO provider env var is set at all.
 */
export function getModel(preferredModelId?: string | null): {
  model: LanguageModel;
  info: ModelInfo;
} {
  if (preferredModelId) {
    const model = getLanguageModel(preferredModelId);
    if (model) {
      const info = ALL_MODELS.find((m) => m.id === preferredModelId)!;
      return { model, info };
    }
  }

  for (const info of ALL_MODELS) {
    const model = getLanguageModel(info.id);
    if (model) return { model, info };
  }

  throw new Error(
    "No AI provider available. Set at least GEMINI_API_KEY in environment variables.",
  );
}

/** All models the user can select from (includes unavailable ones for display) */
export function getAllModels(): ModelInfo[] {
  return ALL_MODELS;
}

/** Only models with their API key configured */
export function getAvailableModels(): ModelInfo[] {
  return ALL_MODELS.filter((m) => m.available);
}
