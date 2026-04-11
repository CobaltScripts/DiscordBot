export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

export function messageOrJsonToMessage(errorMessage: string): string {
  let message: string = errorMessage;
  try {
    const parsed = JSON.parse(message.substring(message.indexOf('{'))) as {
      error?: { message?: string };
    };
    message = parsed.error?.message || 'Quota Exceeded/API Error';
  } catch {
    message = message.split('\n')[0];
  }

  return message;
}
