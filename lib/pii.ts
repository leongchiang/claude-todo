export type PiiType = "email" | "phone" | "nric" | "credit_card";

export type PiiResult = { found: true; type: PiiType } | { found: false };

// Order matters: most-specific patterns first so credit-card numbers don't
// get reported as phone numbers etc.
const PATTERNS: ReadonlyArray<readonly [PiiType, RegExp]> = [
  // 13–19 digit card numbers in common 4-4-4-4 / 4-4-4-3 / unspaced forms.
  ["credit_card", /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{3,4}\b/],
  // Singapore NRIC / FIN: leading [STFGM] + 7 digits + check letter.
  ["nric", /\b[STFGM]\d{7}[A-Z]\b/i],
  // International phone with leading +country code; tolerates spaces or dashes.
  ["phone", /\+\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4}/],
  ["email", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i],
];

export function detectPii(text: string | null | undefined): PiiResult {
  if (!text) return { found: false };
  for (const [type, regex] of PATTERNS) {
    if (regex.test(text)) return { found: true, type };
  }
  return { found: false };
}
