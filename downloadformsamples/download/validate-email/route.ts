import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';

/**
 * POST /api/download/validate-email
 * Body: { email: string }
 *
 * Full server-side email validation pipeline matching domainchecker.asp logic:
 *
 * Step 1  – Free email check (gmail, yahoo, etc.)          → reject
 * Step 2  – InvalidDomain table (IsBlocked=1)              → reject
 * Step 3  – ValidDomain table (known corporate)            → pass (skip ZeroBounce)
 * Step 4  – Customer.GuestEmail (existing econshopping)    → pass (skip ZeroBounce)
 * Step 5  – AspNetUsers domain count > 0                   → pass (skip ZeroBounce)
 * Step 6  – ZeroBounce API                                 → valid/catch-all → pass,
 *                                                            invalid/free → reject
 *
 * Returns: { valid: boolean, reason?: string, incorpid?: string }
 */

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com',
  'aol.com', 'mail.com', 'protonmail.com', 'zoho.com', 'ymail.com', 'msn.com',
  'rediffmail.com', 'rocketmail.com', 'inbox.com', 'me.com', 'mac.com',
  'yahoo.co.in', 'yahoo.co.uk', 'yahoo.co.jp', 'yahoo.fr', 'yahoo.de',
  'hotmail.co.uk', 'hotmail.fr', 'windowslive.com', 'googlemail.com',
]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ valid: false, reason: 'Invalid request.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ valid: false, reason: 'Invalid email format.' });
  }

  const domain = email.split('@')[1] ?? '';

  // ── Step 1: Free email domain check ──────────────────────────────────────
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return NextResponse.json({ valid: false, reason: 'free_email' });
  }

  // ── Steps 2–5: DB checks ──────────────────────────────────────────────────
  try {
    const pool = await getPool();

    // Step 2: InvalidDomain (blocked/invalid corporate domains)
    const invalidRes = await pool
      .request()
      .input('Domain', sql.NVarChar(200), domain)
      .query(`SELECT TOP 1 1 AS found FROM InvalidDomain WHERE InvalidDomainName = @Domain AND IsBlocked = '1'`);
    if (invalidRes.recordset?.length > 0) {
      return NextResponse.json({ valid: false, reason: 'blocked_domain' });
    }

    // Step 3: ValidDomain (known trusted corporate domain → skip ZeroBounce)
    const validRes = await pool
      .request()
      .input('Domain', sql.NVarChar(200), domain)
      .query(`SELECT TOP 1 1 AS found FROM ValidDomain WHERE ValidDomainName = @Domain`);
    if (validRes.recordset?.length > 0) {
      return NextResponse.json({ valid: true });
    }

    // Step 4: Check if email is an existing guest customer (econshopping DB)
    try {
      const shoppingPool = await getShoppingPool();
      const guestRes = await shoppingPool
        .request()
        .input('Email', sql.NVarChar(200), email)
        .query(`SELECT TOP 1 1 AS found FROM Customer WHERE GuestEmail = @Email`);
      if (guestRes.recordset?.length > 0) {
        return NextResponse.json({ valid: true });
      }
    } catch { /* econshopping DB unavailable — continue */ }

    // Step 5: Count existing registered users with this domain in AspNetUsers
    if (domain !== 'e-consystems.com') {
      const countRes = await pool
        .request()
        .input('Domain', sql.NVarChar(200), `%@${domain}`)
        .query(`SELECT COUNT(Email) AS valuecount FROM AspNetUsers WHERE Email LIKE @Domain`);
      const count = countRes.recordset?.[0]?.valuecount ?? 0;
      if (count > 0) {
        return NextResponse.json({ valid: true });
      }
    } else {
      // e-consystems.com users always pass (except the test address)
      if (email !== 'venkatesan.p@e-consystems.com') {
        return NextResponse.json({ valid: true });
      }
    }
  } catch (dbErr) {
    console.error('[validate-email] DB error:', dbErr);
    // DB unavailable → fall through to ZeroBounce
  }

  // ── Step 6: ZeroBounce API ───────────────────────────────────────────────
  const zbApiKey = process.env.ZEROBOUNCE_API_KEY ?? '';
  if (!zbApiKey) {
    // No API key configured — cannot validate unknown email → reject to be safe
    return NextResponse.json({ valid: false, reason: 'email_unverifiable' });
  }

  try {
    const zbRes = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${encodeURIComponent(zbApiKey)}&email=${encodeURIComponent(email)}&ip_address=`,
      { cache: 'no-store' }
    );
    const zb = await zbRes.json() as {
      address?: string;
      status?: string;
      sub_status?: string;
      free_email?: boolean;
      domain?: string;
    };

    const status = zb.status ?? 'unknown';
    const subStatus = zb.sub_status ?? '';
    const isFreeEmail = zb.free_email === true;

    // Build incorpid marker for internal tracking
    const incorpid = `${email} | ${status}`;

    const isValid =
      (status === 'valid' || status === 'catch-all' || subStatus === 'role_based') &&
      !isFreeEmail;

    if (isValid) {
      return NextResponse.json({ valid: true });
    }

    // Failed ZeroBounce
    const reason = isFreeEmail ? 'free_email' : `zerobounce_${status}`;
    return NextResponse.json({ valid: false, reason, incorpid });
  } catch (zbErr) {
    console.error('[validate-email] ZeroBounce error:', zbErr);
    // ZeroBounce network error — reject unknown email to be safe
    return NextResponse.json({ valid: false, reason: 'email_unverifiable' });
  }
}

// ─── Separate pool for econshopping DB (ConStr1) ──────────────────────────────
import sql2 from 'mssql';

let shoppingPool: sql2.ConnectionPool | null = null;

async function getShoppingPool(): Promise<sql2.ConnectionPool> {
  if (!shoppingPool) {
    shoppingPool = await new sql2.ConnectionPool({
      server: process.env.DB_SERVER!,
      database: process.env.DB_SHOPPING_NAME ?? 'econshopping',
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      options: { encrypt: false, trustServerCertificate: true },
      pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
    }).connect();
  }
  return shoppingPool;
}
