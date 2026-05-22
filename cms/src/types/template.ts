// ─────────────────────────────────────────────────────────────────────────────
// Template builder types
// ─────────────────────────────────────────────────────────────────────────────

export interface GridPlacement {
  col_start: number;
  col_end: number;
  row_start: number;
  row_end: number;
}

export interface GridConfig {
  columns: number;
  row_height: number;
  gap: number;
  /** Optional full-bleed background colors keyed by original row_start number (as string). */
  row_backgrounds?: Record<string, string>;
  /**
   * When set (e.g. "1280px"), the whole grid is wrapped in a centered max-width container
   * so side-by-side columns don't stretch to fill ultra-wide viewports.
   * Row background sentinels still break out to full viewport width.
   * Leave undefined / empty for no constraint (current default behaviour).
   */
  content_max_width?: string;
}

export interface TemplateComponent {
  component_id: string;
  type: string;
  label: string;
  grid_placement: GridPlacement;
  meta: Record<string, unknown>;
  required: boolean;
  order: number;
  responsive_overrides?: {
    tablet?: GridPlacement;
    mobile?: GridPlacement;
  };
}

export type TemplateStatus = 'active' | 'archived';

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  grid: GridConfig;
  components: TemplateComponent[];
  status: TemplateStatus;
  custom_js_head?: string;
  custom_js_body?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  status: TemplateStatus;
  component_count: number;
  updated_at: string;
}

export interface TemplateCreate {
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  grid?: GridConfig;
  components?: TemplateComponent[];
  custom_js_head?: string;
  custom_js_body?: string;
}

export interface TemplateUpdate {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  grid?: GridConfig;
  components?: TemplateComponent[];
  status?: TemplateStatus;
  custom_js_head?: string;
  custom_js_body?: string;
}
