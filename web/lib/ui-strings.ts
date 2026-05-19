// ─────────────────────────────────────────────────────────────────────────────
// UI Strings — site-wide static label translations
//
// Strings are stored in MongoDB under navigation.locales[locale].ui_*
// Managed by the admin via Navigation CMS → "UI Strings" section.
// Falls back to English defaults when a key is missing.
//
// Usage in a block component:
//   const t = getUiStrings(data.__ui as UiStrings | undefined);
//   <span>{t.selectAll}</span>
// ─────────────────────────────────────────────────────────────────────────────

export interface UiStrings {
  // DocumentDownload
  selectAll: string;
  deselectAll: string;

  // RelatedBlogsGrid
  knowMore: string;

  // VariantsTable
  noVariants: string;
  actionsHeader: string;

  // Form / Newsletter
  required: string;
  invalidEmail: string;
  formSuccess: string;
  formError: string;

  // ProductTabsV2 / ProductTabsBlock
  noTabContent: string;

  // SamplePrice / ProductHero price labels
  samplePrice: string;
  volumePrice: string;

  // Timer countdown units
  timerDays: string;
  timerHours: string;
  timerMinutes: string;
  timerSeconds: string;
}

/** English defaults — always correct without any CMS data. */
export const EN_DEFAULTS: UiStrings = {
  selectAll:    'Select All',
  deselectAll:  'Deselect All',
  knowMore:     'Know More',
  noVariants:   'No variants available.',
  actionsHeader:'Actions',
  required:     'Required',
  invalidEmail: 'Invalid email address',
  formSuccess:  'Thank you! We will be in touch shortly.',
  formError:    'Something went wrong. Please try again.',
  noTabContent: 'No content available for this tab.',
  samplePrice:  'Sample Price',
  volumePrice:  'Volume Price',
  timerDays:    'DD',
  timerHours:   'HH',
  timerMinutes: 'MM',
  timerSeconds: 'SS',
};

/** Flat key → UiStrings field map (matches keys stored in nav.locales[locale]) */
const KEY_MAP: Record<string, keyof UiStrings> = {
  ui_select_all:    'selectAll',
  ui_deselect_all:  'deselectAll',
  ui_know_more:     'knowMore',
  ui_no_variants:   'noVariants',
  ui_actions:       'actionsHeader',
  ui_required:      'required',
  ui_invalid_email: 'invalidEmail',
  ui_form_success:  'formSuccess',
  ui_form_error:    'formError',
  ui_no_tab_content:'noTabContent',
  ui_sample_price:  'samplePrice',
  ui_volume_price:  'volumePrice',
  ui_timer_days:    'timerDays',
  ui_timer_hours:   'timerHours',
  ui_timer_minutes: 'timerMinutes',
  ui_timer_seconds: 'timerSeconds',
};

/**
 * Build a UiStrings object from a nav locale flat map.
 * Falls back to EN_DEFAULTS for any key not present or blank.
 */
export function buildUiStrings(localeFlat?: Record<string, string>): UiStrings {
  if (!localeFlat) return { ...EN_DEFAULTS };
  const result: Record<string, string> = { ...(EN_DEFAULTS as unknown as Record<string, string>) };
  for (const [flatKey, field] of Object.entries(KEY_MAP)) {
    const val = localeFlat[flatKey];
    if (val && val.trim()) result[field] = val.trim();
  }
  return result as unknown as UiStrings;
}

/**
 * Convenience helper used inside block components.
 * Accepts the raw __ui value injected via block data.
 */
export function getUiStrings(raw?: UiStrings | null): UiStrings {
  if (!raw || typeof raw !== 'object') return { ...EN_DEFAULTS };
  // Merge with defaults so any missing keys are always filled
  return { ...EN_DEFAULTS, ...raw };
}
