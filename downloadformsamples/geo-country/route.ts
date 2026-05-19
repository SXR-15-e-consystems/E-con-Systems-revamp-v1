import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * GET /api/geo-country
 * Returns the visitor's ISO 3166-1 alpha-2 country code based on the
 * CF-IPCountry header (Cloudflare) or x-vercel-ip-country (Vercel).
 * Used by the download form for GDPR/EU consent detection.
 */
export async function GET() {
  const headersList = await headers();
  const countryCode =
    headersList.get('cf-ipcountry') ??
    headersList.get('x-vercel-ip-country') ??
    null;

  return NextResponse.json({ countryCode: countryCode?.toUpperCase() ?? null });
}
