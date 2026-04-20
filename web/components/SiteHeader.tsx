import { fetchNavigation } from '@/lib/api';
import { HeaderClient } from './HeaderClient';
import type { HeaderConfig, NavMenuEntry } from '@/types/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Server component — fetches navigation config and renders HeaderClient.
// Falls back to sensible defaults if the API is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_HEADER: HeaderConfig = {
  logo_url: 'https://d2u56hfpsewfc3.cloudfront.net/images/e-con-twenty-plus-years-logo-register.svg',
  phone: { number: '+14087667503', label: '+1 408 766 7503', visible: true },
  contact_link: { label: 'Contact Us', url: '/contact', visible: true },
  country_flags: [
    { code: 'us', label: 'US', image_url: 'https://flagcdn.com/w40/us.png', url: '#', locale_prefix: '', is_default: true },
  ],
  cta_button: {
    label: 'Developers',
    url: '/developers',
    icon_url: null,
    bg_color: '#059f46',
    visible: true,
  },
  search_enabled: true,
  cart_enabled: true,
  account_enabled: true,
};

const FALLBACK_MENUS: NavMenuEntry[] = [
  { menu_id: 'f1', label: 'Camera Products', url: '#', target: '_self', order: 0, visible: true, menu_type: 'link', tabs: [], columns: [], children: [], promo_banner: null },
  { menu_id: 'f2', label: 'Markets', url: '#', target: '_self', order: 1, visible: true, menu_type: 'link', tabs: [], columns: [], children: [], promo_banner: null },
  { menu_id: 'f3', label: 'Explore', url: '#', target: '_self', order: 2, visible: true, menu_type: 'link', tabs: [], columns: [], children: [], promo_banner: null },
  { menu_id: 'f4', label: 'Resources', url: '#', target: '_self', order: 3, visible: true, menu_type: 'link', tabs: [], columns: [], children: [], promo_banner: null },
  { menu_id: 'f5', label: 'About Us', url: '#', target: '_self', order: 4, visible: true, menu_type: 'link', tabs: [], columns: [], children: [], promo_banner: null },
];

export async function SiteHeader() {
  let header = FALLBACK_HEADER;
  let menus: NavMenuEntry[] = FALLBACK_MENUS;

  try {
    const nav = await fetchNavigation();
    if (nav) {
      header = nav.header;
      menus = nav.menus;
    }
  } catch {
    // API unavailable — use fallbacks silently
  }

  return <HeaderClient header={header} menus={menus} />;
}
