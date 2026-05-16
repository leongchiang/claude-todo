export class ValidationError extends Error {
  override name = "ValidationError";
  readonly issues?: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>;

  constructor(
    message: string,
    issues?: ReadonlyArray<{ path: ReadonlyArray<string | number>; message: string }>,
  ) {
    super(message);
    if (issues !== undefined) this.issues = issues;
  }
}

export class NotFoundError extends Error {
  override name = "NotFoundError";
}
