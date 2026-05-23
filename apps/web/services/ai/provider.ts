/**
 * Shared types for PACE's multi-model AI support.
 * Actual model wiring lives in registry.ts.
 */

export type AIProviderFamily = "gemini" | "openai" | "anthropic";

export interface ModelInfo {
  id: string;
  /** Human-readable name displayed in the settings UI */
  name: string;
  provider: AIProviderFamily;
  /**
   * Whether the required env var is present.
   * Checked at module evaluation time (server-side only).
   */
  available: boolean;
}
