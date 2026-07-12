export function assertResourceOwnership(resourceUserId: string, sessionUserId: string) {
  if (resourceUserId !== sessionUserId) {
    throw new Error('Forbidden');
  }
}
