export function mayUsePinnedBootstrap(error: unknown, isCi: boolean): boolean {
  if (!isCi) return true;
  return error instanceof Error && /\bHTTP 404\b/.test(error.message);
}
