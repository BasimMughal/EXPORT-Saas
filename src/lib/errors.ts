export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
