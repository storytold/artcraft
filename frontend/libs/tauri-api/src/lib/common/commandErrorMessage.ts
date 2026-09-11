export function commandErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const command = error as {
      error_message?: string;
      error_details?: { error_message?: string };
      message?: string;
    };
    return (
      command.error_message ??
      command.error_details?.error_message ??
      command.message ??
      fallback
    );
  }
  return typeof error === "string" ? error : fallback;
}
