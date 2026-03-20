// ─────────────────────────────────────────────────────────────────────────────
// YouTube URL utilities — web (M4)
// Pure functions — no side effects, no React deps.
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/,
  /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
];

/**
 * Extracts the 11-character YouTube video ID from any known YouTube URL format.
 * Returns null if the URL is not a recognised YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Returns the highest-quality available thumbnail URL for a YouTube video.
 * Falls back to hqdefault which is always present.
 * Returns null if the URL is not a recognised YouTube URL.
 */
export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Returns a YouTube embed URL with autoplay enabled.
 * Returns null if the URL is not a recognised YouTube URL.
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
}

/**
 * Returns true if the given URL is a YouTube URL.
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
