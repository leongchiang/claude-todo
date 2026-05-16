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
