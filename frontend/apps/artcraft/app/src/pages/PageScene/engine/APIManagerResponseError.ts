/**
 * This is designed to surface user customer facing messages as errors.
 * Errors shouldn't be 404 or something confusing should be
 */
class APIManagerResponseError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "APIManagerResponseError";
  }
}

export { APIManagerResponseError };
