/**
 * Trim large text inputs to keep token cost predictable.
 * We cap by characters to keep it simple and deterministic.
 */
export function clampText(input: string, maxChars: number): string {
  if (!input) return "";
  if (input.length <= maxChars) return input;
  // keep head + tail (often contains summary + citations)
  const head = input.slice(0, Math.floor(maxChars * 0.7));
  const tail = input.slice(-Math.floor(maxChars * 0.3));
  return head + "\n\n[...TRUNCATED...]\n\n" + tail;
}
