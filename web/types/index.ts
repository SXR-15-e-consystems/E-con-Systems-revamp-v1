export type BlockType =
  | 'Hero'
  | 'RichText'
  | 'ProductGrid'
  | 'ImageBanner'
  | 'VideoEmbed'
  | 'FAQ'
  | 'CTAStrip'
  | 'Testimonials';

export interface BlockEnvelope {
  block_id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
}

export interface HeroData {
  title: string;
  subtitle?: string;
  image_url: string;
  cta_text?: string;
  cta_link?: string;
}

export interface RichTextData {
  html: string;
}

export type PageStatus = 'draft' | 'published' | 'archived';

export interface PageResponse {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  og_image_url: string | null;
  status: PageStatus;
  blocks: BlockEnvelope[];
  created_by: string;
  created_at: string;
  updated_at: string;
}
