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
}

export interface TemplateUpdate {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  category?: string;
  grid?: GridConfig;
  components?: TemplateComponent[];
  status?: TemplateStatus;
}
