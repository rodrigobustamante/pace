/**
 * Safely parses JSON from a language model response.
 *
 * Models sometimes wrap their output in markdown code fences
 * (```json ... ```) even when instructed not to. This function
 * strips those fences before parsing, and falls back to extracting
 * the first top-level JSON object if the raw string still isn't
 * parseable on its own.
 */
export function parseModelJSON<T>(raw: string): T {
  // 1. Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const cleaned = fenceMatch ? fenceMatch[1]!.trim() : raw.trim();

  // 2. Try parsing the cleaned string directly
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 3. Fall back: extract the first {...} block
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new SyntaxError(`No valid JSON object found in model response: ${raw.slice(0, 200)}`);
  }
}
