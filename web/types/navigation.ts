// ─────────────────────────────────────────────────────────────────────────────
// Navigation types — mirrors backend/app/models/navigation.py
// Used by SiteHeader and mega menu components for API-driven navigation.
// ─────────────────────────────────────────────────────────────────────────────

export type MenuType = "mega_tabbed" | "mega_columns" | "dropdown" | "nested" | "link";
export type LinkTarget = "_self" | "_blank";

export interface MenuItem {
  label: string;
  url: string;
  icon_url: string | null;
  target: LinkTarget;
}

export interface MenuColumn {
  col_id: string;
  title: string;
  icon_url: string | null;
  items: MenuItem[];
}

export interface BottomSection {
  enabled: boolean;
  title: string;
  items: MenuItem[];
}

export interface MegaMenuTab {
  tab_id: string;
  label: string;
  order: number;
  is_default: boolean;
  columns: MenuColumn[];
  bottom_section: BottomSection | null;
}

export interface PromoBanner {
  enabled: boolean;
  image_url: string | null;
  title: string;
  description: string;
  cta_label: string;
  cta_url: string;
  cta_target: LinkTarget;
}

export interface DropdownChild {
  item_id: string;
  label: string;
  url: string;
  icon_url: string | null;
  target: LinkTarget;
  children: DropdownChild[];
}

export interface NavMenuEntry {
  menu_id: string;
  label: string;
  url: string | null;
  target: LinkTarget;
  order: number;
  visible: boolean;
  menu_type: MenuType;
  tabs: MegaMenuTab[];
  columns: MenuColumn[];
  children: DropdownChild[];
  promo_banner: PromoBanner | null;
}

export interface PhoneConfig {
  number: string;
  label: string;
  visible: boolean;
}

export interface ContactLinkConfig {
  label: string;
  url: string;
  visible: boolean;
}

export interface CountryFlag {
  code: string;
  label: string;
  image_url: string;
  url: string;
  locale_prefix: string;
  is_default: boolean;
}

export interface CtaButtonConfig {
  label: string;
  url: string;
  icon_url: string | null;
  bg_color: string;
  visible: boolean;
}

export interface HeaderConfig {
  logo_url: string;
  phone: PhoneConfig;
  contact_link: ContactLinkConfig;
  country_flags: CountryFlag[];
  cta_button: CtaButtonConfig;
  search_enabled: boolean;
  cart_enabled: boolean;
  account_enabled: boolean;
}

export interface NavigationPublicResponse {
  header: HeaderConfig;
  footer: FooterConfig;
  menus: NavMenuEntry[];
  locales: Record<string, Record<string, string>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer types — mirrors backend/app/models/navigation.py FooterConfig
// ─────────────────────────────────────────────────────────────────────────────

export interface FooterLinkItem {
  label: string;
  url: string;
  target: LinkTarget;
}

export interface FooterColumn {
  col_id: string;
  title: string;
  items: FooterLinkItem[];
}

export interface FooterSocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface FooterBadge {
  badge_id: string;
  image_url: string;
  alt_text: string;
  link_url: string;
}

export interface FooterSubscribeConfig {
  enabled: boolean;
  heading: string;
  placeholder: string;
  button_label: string;
  notification_email: string;
}

export interface FooterConfig {
  logo_url: string;
  logo_alt: string;
  logo_link: string;
  tagline: string;
  columns: FooterColumn[];
  social_links: FooterSocialLink[];
  badges: FooterBadge[];
  subscribe: FooterSubscribeConfig;
  copyright_text: string;
  sitemap_link: string;
  sitemap_label: string;
  border_color: string;
}
