import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { MOCK } from "../agents/mock.js";
import { config } from "../config.js";

// Klien dibuat saat dibutuhkan supaya mode demo tidak butuh API key.
let client: Anthropic | undefined;

export class AgentRefusedError extends Error {}

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/**
 * Satu panggilan agent: system prompt + input -> JSON tervalidasi Zod.
 * Structured outputs menjamin bentuk JSON, jadi agent tidak perlu "tanpa teks tambahan".
 * Streaming dipakai supaya output panjang (mis. script Luau DALOT) tidak kena timeout HTTP.
 */
export async function runAgent<S extends z.ZodType>(opts: {
  agent: keyof typeof MOCK;
  system: string;
  input: string;
  schema: S;
  effort?: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  if (config.demoMode) {
    await new Promise((r) => setTimeout(r, 300));
    return opts.schema.parse(MOCK[opts.agent]) as z.infer<S>;
  }
  client ??= new Anthropic();
  const stream = client.beta.messages.stream({
    model: config.model,
    max_tokens: opts.maxTokens ?? 32000,
    // Kalau model menolak karena kebijakan, server mencoba model cadangan default.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
    output_config: {
      effort: opts.effort ?? "high",
      format: betaZodOutputFormat(opts.schema),
    },
    messages: [{ role: "user", content: opts.input }],
  });
  const msg = await stream.finalMessage();

  if (msg.stop_reason === "refusal") {
    throw new AgentRefusedError(`Model menolak (${msg.stop_details?.category ?? "tanpa kategori"})`);
  }
  if (msg.stop_reason === "max_tokens") {
    throw new Error("Output agent terpotong (max_tokens). Naikkan maxTokens atau kecilkan tugas.");
  }
  if (msg.parsed_output == null) {
    throw new Error("Output agent tidak sesuai skema JSON.");
  }
  return msg.parsed_output as z.infer<S>;
}
