export interface ValidationIssue {
  path: ReadonlyArray<PropertyKey>;
  message: string;
}

export class ValidationError extends Error {
  override name = "ValidationError";
  readonly issues?: ReadonlyArray<ValidationIssue>;

  constructor(message: string, issues?: ReadonlyArray<ValidationIssue>) {
    super(message);
    if (issues !== undefined) this.issues = issues;
  }
}

export class NotFoundError extends Error {
  override name = "NotFoundError";
}

export class PiiRejectedError extends Error {
  override name = "PiiRejectedError";
  readonly piiType: string;

  constructor(piiType: string) {
    super(`task content rejected — contains ${piiType}`);
    this.piiType = piiType;
  }
}

/** ANTHROPIC_API_KEY missing or Claude API unreachable. Handler returns 503. */
export class AiUnavailableError extends Error {
  override name = "AiUnavailableError";
  readonly reason: string;
  constructor(reason: string, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

/** Per-user daily cost ceiling tripped. Handler returns 429. */
export class CostCeilingExceededError extends Error {
  override name = "CostCeilingExceededError";
  readonly current_micros: number;
  readonly ceiling_micros: number;
  constructor(currentMicros: number, ceilingMicros: number) {
    super(`daily AI cost ceiling exceeded: ${currentMicros} micros (cap ${ceilingMicros})`);
    this.current_micros = currentMicros;
    this.ceiling_micros = ceilingMicros;
  }
}

/** Model output couldn't be parsed against the expected schema. Handler returns 502. */
export class AiResponseParseError extends Error {
  override name = "AiResponseParseError";
}

/** Model output parsed but violated a domain invariant (e.g., duplicate rank). */
export class AiResponseInvalidError extends Error {
  override name = "AiResponseInvalidError";
}
