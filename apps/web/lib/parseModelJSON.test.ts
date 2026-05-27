import { describe, it, expect } from "vitest";
import { parseModelJSON } from "./parseModelJSON";

describe("parseModelJSON", () => {
  // ── Branch 1: plain JSON (no fences) ────────────────────────────────────
  it("parses a plain JSON string directly", () => {
    const result = parseModelJSON<{ foo: string }>('{"foo":"bar"}');
    expect(result).toEqual({ foo: "bar" });
  });

  it("trims whitespace around plain JSON", () => {
    const result = parseModelJSON<{ n: number }>('  { "n": 42 }  ');
    expect(result).toEqual({ n: 42 });
  });

  // ── Branch 2: markdown code fences ──────────────────────────────────────
  it("strips ```json ... ``` fences before parsing", () => {
    const raw = "```json\n{\"recommendation\":\"train\",\"sessionType\":\"easy\"}\n```";
    const result = parseModelJSON<{ recommendation: string; sessionType: string }>(raw);
    expect(result).toEqual({ recommendation: "train", sessionType: "easy" });
  });

  it("strips plain ``` ... ``` fences (without json tag)", () => {
    const raw = "```\n{\"ok\":true}\n```";
    const result = parseModelJSON<{ ok: boolean }>(raw);
    expect(result).toEqual({ ok: true });
  });

  it("handles extra text before the fence", () => {
    const raw = "Here is the output:\n```json\n{\"x\":1}\n```";
    const result = parseModelJSON<{ x: number }>(raw);
    expect(result).toEqual({ x: 1 });
  });

  // ── Branch 3: fallback extraction (indexOf / lastIndexOf) ────────────────
  it("extracts first {...} block when direct parse fails", () => {
    // Model adds trailing text after the JSON object
    const raw = '{"title":"test","body":"ok"} some trailing explanation';
    const result = parseModelJSON<{ title: string; body: string }>(raw);
    expect(result).toEqual({ title: "test", body: "ok" });
  });

  it("extracts {...} block when model adds a preamble", () => {
    const raw = 'Sure! Here is the JSON: {"value":7}';
    const result = parseModelJSON<{ value: number }>(raw);
    expect(result).toEqual({ value: 7 });
  });

  // ── Branch 4: throw when no valid JSON can be found ──────────────────────
  it("throws SyntaxError when no JSON object is present", () => {
    expect(() => parseModelJSON("no json here")).toThrow(SyntaxError);
    expect(() => parseModelJSON("no json here")).toThrow(
      "No valid JSON object found in model response",
    );
  });

  it("throws SyntaxError for a string with braces but invalid JSON", () => {
    expect(() => parseModelJSON("{not valid json}")).toThrow(SyntaxError);
  });

  it("includes up to 200 chars of the raw input in the error message", () => {
    const raw = "definitely not json";
    expect(() => parseModelJSON(raw)).toThrow(raw);
  });
});
