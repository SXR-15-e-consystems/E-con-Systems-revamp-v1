if (!process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
export const REVALIDATE_SECONDS = Number(process.env.REVALIDATE_SECONDS ?? '60');

/**
 * Centralized z-index scale for consistent layering
 * Based on a scale of 10 to allow for intermediate values if needed
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  header: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

/**
 * Form validation limits
 */
export const FORM_LIMITS = {
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_COMPANY_LENGTH: 200,
  MAX_REQUIREMENT_LENGTH: 2000,
} as const;

/**
 * Content display limits
 */
export const CONTENT_LIMITS = {
  MAX_RICHTEXT_LENGTH: 50_000,
  MAX_FAQ_ITEMS: 30,
  MAX_TESTIMONIALS: 20,
  MAX_PRODUCT_GRID_ITEMS: 50,
  MAX_ALT_TEXT_LENGTH: 300,
} as const;
