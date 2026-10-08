/** Public URL for a stored thumbnail name. Safe to use in client components. */
export function thumbnailUrl(name: string | null | undefined) {
  return name ? `/media/${encodeURIComponent(name)}` : null;
}
