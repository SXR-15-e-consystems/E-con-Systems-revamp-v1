import { NextResponse } from 'next/server';
import { getPool, sql } from '@/lib/db';
import { dispatchDownloadEmails, type MailContext } from '@/lib/download-email';
import { headers } from 'next/headers';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map product name to PSI category (mirrors GetCategory() in ASP) */
function getCategory(productName: string): string {
  const p = productName.toUpperCase();
  if (/CUNX|CUXVR|CUOAGX|CUONX/.test(p)) return 'NVIDIA';
  if (/MOD|NILECAM|NILE3CAM|STURDECAM|NEDUCAM/.test(p)) return 'Camera Module';
  if (/SEE3CAM|FSCAM|TARA|USB/.test(p)) return 'USB';
  return 'Embedded Vision';
}

/** Sanitise a string value — trim, limit length, strip dangerous chars */
function safe(val: unknown, maxLen = 200): string {
  if (typeof val !== 'string') return 'N/A';
  const t = val.trim().slice(0, maxLen);
  // Strip characters that could be used for HTML/SQL injection in log output
  return t.replace(/[<>"]/g, '');
}

/** Look up a document record from the DB by key + product name */
async function selectDownloadDocument(
  pool: Awaited<ReturnType<typeof getPool>>,
  docKey: string,
  productName: string
): Promise<{ doc: string; doclink: string } | null> {
  try {
    const result = await pool
      .request()
      .input('docKey', sql.NVarChar(200), docKey)
      .input('productName', sql.NVarChar(300), productName)
      .query(
        `SELECT TOP 1 DocumentName AS doc, DocumentLink AS doclink
         FROM DownloadDocuments
         WHERE ProductKey = @docKey OR ProductName = @productName
         ORDER BY Id DESC`
      );
    return result.recordset[0] ?? null;
  } catch {
    return null;
  }
}

/** Check if the email/IP has exceeded the download limit via stored proc */
async function isBlockedForDownload(
  pool: Awaited<ReturnType<typeof getPool>>,
  email: string,
  docString: string,
  ip: string
): Promise<boolean> {
  try {
    const result = await pool
      .request()
      .input('Email', sql.NVarChar(200), email)
      .input('Ip', sql.NVarChar(50), ip)
      .input('DownloadDocument', sql.NVarChar(1000), docString)
      .execute('dbo.usp_CheckForDownloadEmails');
    const row = result.recordset?.[0];
    return row?.IsBlocked === true || row?.IsBlocked === 1;
  } catch {
    return false;
  }
}

/** Call lead automation stored proc, returns downloadId */
async function addLeadAutomation(
  pool: Awaited<ReturnType<typeof getPool>>,
  params: {
    email: string; productName: string; company: string; name: string;
    country: string; state: string; city: string; phone: string;
    newsletter: number; leadsource: string; knowecon: string;
    doclist: string;
  }
): Promise<string> {
  try {
    const category = getCategory(params.productName);
    const result = await pool
      .request()
      .input('email', sql.NVarChar(200), params.email)
      .input('productName', sql.NVarChar(300), params.productName)
      .input('companyName', sql.NVarChar(300), params.company)
      .input('lastName', sql.NVarChar(200), params.name)
      .input('country', sql.NVarChar(100), params.country)
      .input('state', sql.NVarChar(100), params.state)
      .input('city', sql.NVarChar(100), params.city)
      .input('contactNumber', sql.NVarChar(50), params.phone)
      .input('sendnewsletter', sql.Int, params.newsletter)
      .input('leadsource', sql.NVarChar(100), params.leadsource)
      .input('clientid', sql.NVarChar(200), '')
      .input('knowecon', sql.NVarChar(500), params.knowecon)
      .input('psicategory', sql.NVarChar(100), category)
      .input('documentList', sql.NVarChar(1000), params.doclist)
      .input('description', sql.NVarChar(500), null)
      .execute('dbo.usp_AddLeadAutomation');
    return String(result.recordset?.[0]?.DownloadId ?? result.returnValue ?? '0');
  } catch (err) {
    console.error('[download-api] addLeadAutomation error:', err);
    return '0';
  }
}

/** Log a blocked / invalid email attempt */
async function addBlockedUser(
  pool: Awaited<ReturnType<typeof getPool>>,
  params: {
    name: string; company: string; email: string; domain: string;
    status: string; country: string; state: string; city: string;
    phone: string; psi: string;
  }
) {
  try {
    await pool
      .request()
      .input('Name', sql.NVarChar(200), params.name)
      .input('Company', sql.NVarChar(300), params.company)
      .input('Email', sql.NVarChar(200), params.email)
      .input('Domain', sql.NVarChar(200), params.domain)
      .input('Status', sql.NVarChar(100), params.status)
      .input('Country', sql.NVarChar(100), params.country)
      .input('State', sql.NVarChar(100), params.state)
      .input('City', sql.NVarChar(100), params.city)
      .input('Phone', sql.NVarChar(50), params.phone)
      .input('PSI', sql.NVarChar(300), params.psi)
      .query(
        `INSERT INTO BlockedEmailUserDetails
           (Name, Company, Email, Domain, Status, Country, State, City, Phone, PSI)
         VALUES
           (@Name, @Company, @Email, @Domain, @Status, @Country, @State, @City, @Phone, @PSI)`
      );
  } catch (err) {
    console.error('[download-api] addBlockedUser error:', err);
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  const action = safe(body.action, 20);

  // ── BLOCKEDMAIL ───────────────────────────────────────────────────────────
  if (action === 'BLOCKEDMAIL') {
    const pool = await getPool().catch(() => null);
    if (pool) {
      await addBlockedUser(pool, {
        name:    safe(body.name, 200),
        company: safe(body.company, 300),
        email:   safe(body.email, 200),
        domain:  safe(body.domain, 200),
        status:  safe(body.status, 100),
        country: safe(body.country, 100),
        state:   safe(body.state, 100),
        city:    safe(body.city, 100),
        phone:   safe(body.phone, 50),
        psi:     safe(body.psi, 300),
      });
    }
    return NextResponse.json({ success: true });
  }

  // ── MAIL ──────────────────────────────────────────────────────────────────
  if (action !== 'MAIL') {
    return NextResponse.json({ message: 'Unknown action.' }, { status: 400 });
  }

  // Input validation
  const name    = safe(body.name, 100);
  const email   = safe(body.email, 200).toLowerCase();
  const company = safe(body.company, 300);
  const country = safe(body.country, 100) || 'US';
  const stateName = safe(body.state, 100);
  const phone   = safe(body.phone, 50);
  const knowecon = safe(body.knowecon, 500);
  const newsletter = body.newsletter === true || body.newsletter === 'Yes' ? 1 : 0;
  const incorpid = safe(body.incorpid, 500);
  const productName = safe(body.productName, 300);
  const docKeys: string[] = Array.isArray(body.docKeys)
    ? (body.docKeys as unknown[]).map((k) => safe(k as string, 200)).filter(Boolean)
    : [];

  if (name === 'N/A' || name.length < 2) {
    return NextResponse.json({ message: 'Valid name is required.' }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Valid email is required.' }, { status: 422 });
  }
  if (docKeys.length === 0) {
    return NextResponse.json({ message: 'No documents selected.' }, { status: 422 });
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';

  const pool = await getPool().catch((err) => {
    console.error('[download-api] DB connect error:', err);
    return null;
  });

  if (!pool) {
    return NextResponse.json({ message: 'Service temporarily unavailable.' }, { status: 503 });
  }

  // Gather document info
  const docString = docKeys.join(',');
  let papertype = '';     // HTML links with downloadId (for customer email)
  let econDocList = '';   // HTML links without downloadId (for internal email)
  let doclist = '';       // plain text list

  // We build document links after we get downloadId, so first compute doclist
  const docRecords: Array<{ doc: string; doclink: string }> = [];
  for (const key of docKeys) {
    const rec = await selectDownloadDocument(pool, key, productName);
    if (rec) docRecords.push(rec);
  }
  doclist = docRecords.map((r) => r.doc).join(',');

  // Lookup existing newsletter pref
  let dbnewsletter = newsletter;
  try {
    const prefResult = await pool
      .request()
      .input('Email', sql.NVarChar(200), email)
      .query(`SELECT ProductUpdatesYN, TechnicalUpdatesYN FROM UserPreferences WHERE Email = @Email`);
    const pref = prefResult.recordset?.[0];
    if (pref) {
      dbnewsletter = pref.ProductUpdatesYN || pref.TechnicalUpdatesYN ? 1 : newsletter;
    }
  } catch { /* ignore */ }

  const newsletterTxt = dbnewsletter
    ? "Send e-con's Newsletter and updates"
    : "e-con's Newsletter and updates are not Requested";

  // Skip lead automation for internal test emails (mirrors ASP logic)
  const emailDomain = email.split('@')[1] ?? '';
  const isInternalEmail = emailDomain === 'e-consystems.com';
  const trustedInternalEmails = [
    'venkatesan.p@e-consystems.com',
    'sathis.p@e-consystems.com',
    'yaminidevi@e-consystems.com',
  ];

  let downloadId = '0';
  if (!isInternalEmail || trustedInternalEmails.includes(email)) {
    downloadId = await addLeadAutomation(pool, {
      email, productName, company, name, country,
      state: stateName, city: 'N/A', phone,
      newsletter: dbnewsletter, leadsource: 'Web Download',
      knowecon, doclist,
    });
  }

  // Build document link HTML now that we have downloadId
  docRecords.forEach((rec, i) => {
    const idx = i + 1;
    papertype += `<br><strong><a href="${rec.doclink}&downloadId=${downloadId}&documentId=${idx}" target="_new" style="font-size:12px">${rec.doc}</a></strong>`;
    econDocList += `<br><strong><a href="${rec.doclink}" target="_new" style="font-size:12px">${rec.doc}</a></strong>`;
  });

  // Check rate-limit / block
  const blocked = await isBlockedForDownload(pool, email, docString, ip);

  const ctx: MailContext = {
    fromWho: email,
    fname: name,
    company,
    country,
    stateName,
    phone,
    newsletterTxt,
    incorpid,
    productName,
    papertype,
    econDocList,
    downloadId,
    isBlockedForDownload: blocked,
    emailid1: incorpid && incorpid !== 'N/A' ? incorpid : 'N/A',
  };

  try {
    await dispatchDownloadEmails(ctx);
  } catch (err) {
    console.error('[download-api] email dispatch error:', err);
    // We still return success — lead was saved; email failure is non-blocking
  }

  if (blocked) {
    return NextResponse.json(
      { message: 'Download technical document has been sent to your mail already.' },
      { status: 429 }
    );
  }

  return NextResponse.json({ success: true, downloadId });
}
