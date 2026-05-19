import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';

/**
 * GET /api/download/domain-check?domain=company.com
 *
 * Mirrors domainchecker.asp `validateDomain()` function:
 *   "1" → domain is in InvalidDomain (blocked) — reject
 *   "2" → domain is in ValidDomain (known corporate) — pass, skip ZeroBounce
 *   "3" → unknown domain — proceed to validate-email (ZeroBounce pipeline)
 *
 * Note: Competitor domain routing is handled server-side in the main
 * download handler only — the front-end domain check does not filter competitors.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain')?.toLowerCase().trim();

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ result: '3' });
  }

  try {
    const pool = await getPool();

    // Check if domain is blocked (InvalidDomain table)
    const invalidRes = await pool
      .request()
      .input('Domain', sql.NVarChar(200), domain)
      .query(`SELECT TOP 1 1 AS found FROM InvalidDomain WHERE InvalidDomainName = @Domain AND IsBlocked = '1'`);
    if (invalidRes.recordset?.length > 0) {
      return NextResponse.json({ result: '1' }); // BLOCKED
    }

    // Check if domain is a known trusted corporate domain (ValidDomain table)
    const validRes = await pool
      .request()
      .input('Domain', sql.NVarChar(200), domain)
      .query(`SELECT TOP 1 1 AS found FROM ValidDomain WHERE ValidDomainName = @Domain`);
    if (validRes.recordset?.length > 0) {
      return NextResponse.json({ result: '2' }); // KNOWN GOOD → pass directly
    }
  } catch {
    // DB unavailable — return unknown so front-end proceeds to full validation
  }

  return NextResponse.json({ result: '3' }); // Unknown — needs ZeroBounce
}

