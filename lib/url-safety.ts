/**
 * Shared URL validation and sanitization helpers to block javascript:/data:/vbscript:
 * payloads as well as protocol-relative open redirects (`//evil.com`).
 */

/**
 * Validates URLs used for images, avatars, thumbnails, and internal/external redirects.
 * Allows single-slash relative paths (`/uploads/...`) or explicit `http://` / `https://` URLs.
 * Explicitly rejects protocol-relative URLs (`//...`) and control characters.
 */
export function isSafeMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
  }
  return /^https?:\/\//i.test(trimmed);
}

/**
 * Validates hyperlink destinations for CMS-driven navigation, footer, and service links.
 * Allows single-slash paths, in-page anchors (`#...`), `http(s)://`, `mailto:`, and `tel:`.
 */
export function isSafeHref(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  if (trimmed.startsWith("#")) return true;
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\");
  }
  return /^(?:https?:\/\/|mailto:|tel:)/i.test(trimmed);
}

/**
 * Returns a sanitized href suitable for rendering in `<a href>` / `<Link href>`,
 * falling back to `fallback` (default `"#"`) if the input uses a disallowed scheme.
 */
export function sanitizeHref(url: string | null | undefined, fallback = "#"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  return isSafeHref(trimmed) ? trimmed : fallback;
}

