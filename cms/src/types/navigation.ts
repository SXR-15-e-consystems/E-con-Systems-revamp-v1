// ─────────────────────────────────────────────────────────────────────────────
// Navigation types — mirrors backend/app/models/navigation.py
// ─────────────────────────────────────────────────────────────────────────────

export type MenuType = "mega_tabbed" | "mega_columns" | "dropdown" | "nested" | "link";
export type LinkTarget = "_self" | "_blank";
export type NavigationStatus = "draft" | "published";

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

export interface NavigationConfig {
  header: HeaderConfig;
  menus: NavMenuEntry[];
  footer?: FooterConfig;
  status: NavigationStatus;
  updated_at: string;
  updated_by: string;
  /** Flat label-override map per locale. See backend navigation.py for key conventions. */
  locales?: Record<string, Record<string, string>>;
}

export interface NavigationUpdate {
  header?: HeaderConfig;
  menus?: NavMenuEntry[];
  footer?: FooterConfig;
  locales?: Record<string, Record<string, string>> | null;
}

export interface NavigationPublicResponse {
  header: HeaderConfig;
  menus: NavMenuEntry[];
  locales: Record<string, Record<string, string>>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const MENU_TYPE_LABELS: Record<MenuType, string> = {
  mega_tabbed: "Mega Menu (Tabs)",
  mega_columns: "Mega Menu (Columns)",
  dropdown: "Dropdown",
  nested: "Nested Dropdown",
  link: "Direct Link",
};

export function createEmptyMenuItem(): MenuItem {
  return { label: "", url: "", icon_url: null, target: "_self" };
}

export function createEmptyColumn(): MenuColumn {
  return {
    col_id: crypto.randomUUID(),
    title: "",
    icon_url: null,
    items: [],
  };
}

export function createEmptyTab(): MegaMenuTab {
  return {
    tab_id: crypto.randomUUID(),
    label: "New Tab",
    order: 0,
    is_default: false,
    columns: [],
    bottom_section: null,
  };
}

export function createEmptyMenuEntry(): NavMenuEntry {
  return {
    menu_id: crypto.randomUUID(),
    label: "New Menu",
    url: null,
    target: "_self",
    order: 0,
    visible: true,
    menu_type: "link",
    tabs: [],
    columns: [],
    children: [],
    promo_banner: null,
  };
}

export function createEmptyDropdownChild(): DropdownChild {
  return {
    item_id: crypto.randomUUID(),
    label: "",
    url: "",
    icon_url: null,
    target: "_self",
    children: [],
  };
}

export function createEmptyPromoBanner(): PromoBanner {
  return {
    enabled: false,
    image_url: null,
    title: "",
    description: "",
    cta_label: "",
    cta_url: "",
    cta_target: "_self",
  };
}

export function createDefaultHeader(): HeaderConfig {
  return {
    logo_url: "",
    phone: { number: "", label: "", visible: true },
    contact_link: { label: "Contact Us", url: "/contact", visible: true },
    country_flags: [],
    cta_button: {
      label: "Developers",
      url: "/developers",
      icon_url: null,
      bg_color: "#059f46",
      visible: true,
    },
    search_enabled: true,
    cart_enabled: true,
    account_enabled: true,
  };
}

// ─── Footer types ─────────────────────────────────────────────────────────────

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

export function createDefaultFooter(): FooterConfig {
  return {
    logo_url: "",
    logo_alt: "e-con Systems",
    logo_link: "/",
    tagline: "Think Vision. Think e-con.",
    columns: [],
    social_links: [],
    badges: [],
    subscribe: {
      enabled: true,
      heading: "Subscribe for latest updates",
      placeholder: "Email id*",
      button_label: "SUBSCRIBE",
      notification_email: "",
    },
    copyright_text: "Copyright \u00a9 {year} e-con Systems\u00ae",
    sitemap_link: "/sitemap",
    sitemap_label: "Site Map",
    border_color: "#006786",
  };
}
