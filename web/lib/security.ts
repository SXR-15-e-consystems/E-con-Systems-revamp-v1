import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML to prevent XSS attacks.
 * Uses DOMPurify with strict configuration.
 * 
 * @param html - Raw HTML string from backend
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'class', 'id', 'style',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[/])/i,
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Validates and sanitizes a URL to prevent XSS and injection attacks.
 * Blocks javascript:, data:, and other dangerous protocols.
 * 
 * @param url - URL to validate
 * @param allowRelative - Whether to allow relative URLs (default: true)
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string | undefined | null, allowRelative = true): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();
  
  // Allow relative URLs
  if (allowRelative && trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }
  
  // Only allow http and https protocols
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    console.warn(`Blocked unsafe URL protocol: ${trimmedUrl}`);
    return '';
  }
  
  try {
    const parsed = new URL(trimmedUrl);
    // Double-check protocol (defense in depth)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn(`Blocked unsafe URL protocol: ${parsed.protocol}`);
      return '';
    }
    return trimmedUrl;
  } catch (error) {
    console.warn(`Invalid URL: ${trimmedUrl}`);
    return '';
  }
}

/**
 * Sanitizes a CSS background image URL for inline styles.
 * Prevents CSS injection attacks.
 * 
 * @param url - Image URL
 * @returns Sanitized URL or empty string
 */
export function sanitizeCssUrl(url: string | undefined | null): string {
  const sanitized = sanitizeUrl(url, false);
  if (!sanitized) return '';
  
  // Remove any characters that could break out of url()
  return sanitized.replace(/[()'"\\]/g, '');
}

/**
 * Validates form submission endpoint to prevent path traversal.
 * Only allows alphanumeric, dash, and underscore characters.
 * 
 * @param formType - Form type identifier
 * @returns Sanitized form type or null if invalid
 */
export function sanitizeFormType(formType: string | undefined | null): string | null {
  if (!formType) return null;
  
  const sanitized = formType.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  
  if (sanitized !== formType) {
    console.warn(`Invalid form type sanitized: "${formType}" -> "${sanitized}"`);
  }
  
  if (!sanitized || sanitized.length > 50) {
    return null;
  }
  
  return sanitized;
}
