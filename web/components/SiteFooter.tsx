import { headers } from 'next/headers';
import { fetchNavigation } from '@/lib/api';
import { FooterClient } from './FooterClient';
import type { FooterConfig } from '@/types/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Server component — fetches navigation config and passes footer to FooterClient.
// Falls back to sensible defaults if the API is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_FOOTER: FooterConfig = {
  logo_url: 'https://d2u56hfpsewfc3.cloudfront.net/images/e-con-twenty-plus-years-logo-register.svg',
  logo_alt: 'e-con Systems',
  logo_link: '/',
  tagline: 'Think Vision. Think e-con.',
  columns: [
    {
      col_id: 'camera-products',
      title: 'Camera Products',
      items: [
        { label: 'Camera Selector', url: '/camera-selector', target: '_self' },
        { label: 'USB 3.0 Cameras', url: '/usb-30-cameras', target: '_self' },
        { label: 'Camera Modules', url: '/camera-modules', target: '_self' },
        { label: 'Industrial Cameras', url: '/industrial-cameras', target: '_self' },
        { label: 'Board Cameras', url: '/board-cameras', target: '_self' },
        { label: 'USB 2.0 Cameras', url: '/usb-20-cameras', target: '_self' },
        { label: 'GMSL Cameras', url: '/gmsl-cameras', target: '_self' },
        { label: 'OEM & Custom Cameras', url: '/oem-custom-cameras', target: '_self' },
      ],
    },
    {
      col_id: 'resources',
      title: 'Resources',
      items: [
        { label: 'Online Store', url: 'https://www.e-consystems.com/webstore.asp', target: '_blank' },
        { label: 'View Cart', url: 'https://www.e-consystems.com/cart.asp', target: '_blank' },
        { label: 'Track Orders', url: 'https://www.e-consystems.com/track-orders.asp', target: '_blank' },
        { label: 'Blog', url: '/blog', target: '_self' },
        { label: 'Articles', url: '/articles', target: '_self' },
        { label: 'FOV Calculator', url: '/fov-calculator', target: '_self' },
        { label: 'Webinars', url: '/webinars', target: '_self' },
        { label: 'RMA Policy', url: '/rma-policy', target: '_self' },
        { label: 'Warranty', url: '/warranty', target: '_self' },
        { label: 'Product Compliance', url: '/product-compliance', target: '_self' },
        { label: 'FAQ', url: '/faq', target: '_self' },
      ],
    },
    {
      col_id: 'company',
      title: 'Company',
      items: [
        { label: 'About Us', url: '/about-us', target: '_self' },
        { label: 'News', url: '/news', target: '_self' },
        { label: 'Tradeshows & Events', url: '/tradeshows-events', target: '_self' },
        { label: 'Videos', url: '/videos', target: '_self' },
        { label: 'Press Releases', url: '/press-releases', target: '_self' },
        { label: 'Our Partners', url: '/partners', target: '_self' },
        { label: 'Testimonials', url: '/testimonials', target: '_self' },
        { label: 'Locations', url: '/locations', target: '_self' },
        { label: 'Careers', url: '/careers', target: '_self' },
      ],
    },
    {
      col_id: 'help',
      title: 'Help',
      items: [
        { label: 'Contact Us', url: '/contact', target: '_self' },
        { label: 'Support Center', url: '/support', target: '_self' },
        { label: 'Get Quote', url: '/get-quote', target: '_self' },
        { label: 'Create Tickets', url: '/create-ticket', target: '_self' },
        { label: 'Privacy Policy', url: '/privacy-policy', target: '_self' },
        { label: 'Terms and Conditions', url: '/terms-conditions', target: '_self' },
        { label: 'Employee login', url: 'https://portal.e-consystems.com', target: '_blank' },
      ],
    },
  ],
  social_links: [
    { platform: 'twitter', url: 'https://twitter.com/econsystems', label: 'X / Twitter' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/company/e-con-systems', label: 'LinkedIn' },
    { platform: 'youtube', url: 'https://www.youtube.com/user/econsystems', label: 'YouTube' },
    { platform: 'facebook', url: 'https://www.facebook.com/econsystems', label: 'Facebook' },
    { platform: 'instagram', url: 'https://www.instagram.com/econsystems', label: 'Instagram' },
  ],
  badges: [
    {
      badge_id: 'iso',
      image_url: 'https://d2u56hfpsewfc3.cloudfront.net/images/iso-9001-2015-certified.png',
      alt_text: 'ISO 9001:2015 Certified',
      link_url: '',
    },
    {
      badge_id: 'warranty',
      image_url: 'https://d2u56hfpsewfc3.cloudfront.net/images/3-year-warranty.png',
      alt_text: '3 Year Warranty',
      link_url: '',
    },
    {
      badge_id: 'ndaa',
      image_url: 'https://d2u56hfpsewfc3.cloudfront.net/images/ndaa-compliant.png',
      alt_text: 'NDAA Compliant',
      link_url: '',
    },
  ],
  subscribe: {
    enabled: true,
    heading: 'Subscribe for latest updates',
    placeholder: 'Email id*',
    button_label: 'SUBSCRIBE',
    notification_email: '',
  },
  copyright_text: `Copyright © ${new Date().getFullYear()} e-con Systems®`,
  sitemap_link: '/sitemap',
  sitemap_label: 'Site Map',
  border_color: '#006786',
};

export async function SiteFooter() {
  const reqHeaders = await headers();
  const locale = reqHeaders.get('x-locale') || 'en';

  let footer = FALLBACK_FOOTER;

  try {
    const nav = await fetchNavigation(locale);
    if (nav?.footer) {
      footer = nav.footer;
    }
  } catch {
    // API unreachable — use fallback silently
  }

  return <FooterClient footer={footer} />;
}
