import { randomUUID } from "node:crypto";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Anthropic from "@anthropic-ai/sdk";

import { AiUnavailableError, CostCeilingExceededError } from "../errors";
import { getDailyCostMicros, getDb, recordAiCost, todayUtc } from "../storage";

export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
export const DAILY_COST_CEILING_MICROS = 100_000; // USD 0.10 (per CLAUDE.md §5.3)

// Haiku 4.5 pricing: $1 input / $5 output per million tokens. 1 micro = $1e-6.
// Multiplying tokens directly by these gives whole-dollar micros.
const HAIKU_INPUT_MICROS_PER_TOKEN = 1;
const HAIKU_OUTPUT_MICROS_PER_TOKEN = 5;
const HAIKU_CACHE_WRITE_MULT = 1.25;
const HAIKU_CACHE_READ_MULT = 0.1;

const AUDIT_LOG_PATH = resolve(process.cwd(), "logs/ai_calls.jsonl");

// Lazy singleton so the module imports cheaply (next build evaluates this).
let _client: Anthropic | undefined;

/** Test-only: inject a mock client. */
export function _setAnthropicClientForTesting(
  client: Pick<Anthropic, "messages"> | undefined,
): void {
  _client = client as Anthropic | undefined;
}

function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiUnavailableError("missing_api_key", "ANTHROPIC_API_KEY is not set");
  }
  _client = new Anthropic({ apiKey, maxRetries: 1 });
  return _client;
}

export interface CompleteParams {
  /** Logical feature name for the audit log: "prioritize" | "summary" | etc. */
  feature: string;
  /** Internal `provider:subject` user id; the cost ledger keys on it. */
  userId: string;
  /**
   * Stable system content — persona, schema, examples, guardrails. This block
   * gets `cache_control: {type: "ephemeral"}` so subsequent calls with the
   * same prefix hit the cache. **Haiku 4.5's minimum cacheable prefix is
   * 4096 tokens** — shorter prompts won't cache even with the marker.
   */
  systemStable: string;
  /** Volatile content (task list, today's date) — small, never cached. */
  userMessage: string;
  maxTokens?: number;
  model?: string;
}

export interface CompleteResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  costMicros: number;
  latencyMs: number;
  requestId: string;
  model: string;
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

function calcCostMicros(usage: UsageLike): number {
  const writes = usage.cache_creation_input_tokens ?? 0;
  const reads = usage.cache_read_input_tokens ?? 0;
  // The SDK reports `input_tokens` as the non-cached remainder (per the
  // prompt-caching docs: `total = input + cache_creation + cache_read`).
  return Math.ceil(
    usage.input_tokens * HAIKU_INPUT_MICROS_PER_TOKEN +
      writes * HAIKU_INPUT_MICROS_PER_TOKEN * HAIKU_CACHE_WRITE_MULT +
      reads * HAIKU_INPUT_MICROS_PER_TOKEN * HAIKU_CACHE_READ_MULT +
      usage.output_tokens * HAIKU_OUTPUT_MICROS_PER_TOKEN,
  );
}

function estimateCostMicros(maxTokens: number): number {
  // Pessimistic: assume the model returns the full `max_tokens`. Don't try
  // to predict input tokens — they're a small constant next to output cost.
  return maxTokens * HAIKU_OUTPUT_MICROS_PER_TOKEN;
}

function defaultAuditLogger(entry: Record<string, unknown>): void {
  try {
    mkdirSync(dirname(AUDIT_LOG_PATH), { recursive: true });
    appendFileSync(AUDIT_LOG_PATH, `${JSON.stringify(entry)}\n`);
  } catch {
    // Audit-log failures must never break the AI call itself.
  }
}

let _auditLogger: ((entry: Record<string, unknown>) => void) | undefined;

/** Test-only: inject a logger that captures entries instead of writing to disk. */
export function _setAuditLoggerForTesting(
  fn: ((entry: Record<string, unknown>) => void) | undefined,
): void {
  _auditLogger = fn;
}

function emitAudit(entry: Record<string, unknown>): void {
  (_auditLogger ?? defaultAuditLogger)(entry);
}

interface ContentBlock {
  type: string;
  text?: string;
}

function extractText(content: ContentBlock[]): string {
  return content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
}

export async function complete(params: CompleteParams): Promise<CompleteResult> {
  const model = params.model ?? DEFAULT_MODEL;
  const maxTokens = params.maxTokens ?? 800;
  const db = getDb();
  const day = todayUtc();

  // 1. Cost ceiling pre-check (TC-AI-04).
  const currentMicros = getDailyCostMicros(db, params.userId, day);
  const estimate = estimateCostMicros(maxTokens);
  if (currentMicros + estimate > DAILY_COST_CEILING_MICROS) {
    throw new CostCeilingExceededError(currentMicros, DAILY_COST_CEILING_MICROS);
  }

  // 2. Call the SDK. Wrap typed errors so callers/handlers see a stable shape.
  const client = getAnthropicClient();
  const startedAt = Date.now();
  let response: Anthropic.Message;
  try {
    response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: [
        {
          type: "text",
          text: params.systemStable,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: params.userMessage }],
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      throw new AiUnavailableError("api_error", `Claude API error: ${e.message}`);
    }
    throw e;
  }
  const latencyMs = Date.now() - startedAt;

  // 3. Compute cost from usage + record atomically.
  const costMicros = calcCostMicros(response.usage);
  recordAiCost(db, params.userId, day, costMicros);

  // 4. Audit log — metadata only (CLAUDE.md §5.6). Never prompt/response bodies.
  const requestId = response.id ?? randomUUID();
  emitAudit({
    ts: new Date().toISOString(),
    model,
    feature: params.feature,
    user_id: params.userId,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    cached_tokens:
      (response.usage.cache_read_input_tokens ?? 0) +
      (response.usage.cache_creation_input_tokens ?? 0),
    cost_usd_est: costMicros / 1_000_000,
    latency_ms: latencyMs,
    request_id: requestId,
  });

  return {
    text: extractText(response.content as unknown as ContentBlock[]),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    costMicros,
    latencyMs,
    requestId,
    model,
  };
}
