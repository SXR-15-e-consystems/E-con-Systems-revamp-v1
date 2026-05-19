import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 25),
  secure: false, // STARTTLS on port 25
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  tls: { rejectUnauthorized: false },
});

const FROM = process.env.SMTP_FROM ?? 'Sales <sales@e-consystems.com>';
const SALES = process.env.INTERNAL_EMAIL_SALES ?? 'sales@e-consystems.com';
const VENKAT = process.env.INTERNAL_EMAIL_VENKAT ?? 'venkatesan.p@e-consystems.com';
const SATHIS = process.env.INTERNAL_EMAIL_SATHIS ?? 'sathis.p@e-consystems.com';
const MARKETING = process.env.INTERNAL_EMAIL_MARKETING ?? 'marketing@e-consystems.com';

// Competitor domains that trigger alternate email routing
const COMPETITOR_DOMAINS = [
  'gracelabs.com',
  'leopardimaging.com',
  'pathpartnertech.com',
  'techmahindra.com',
  'phytec.de',
  'ids-imaging.com',
];

const INTERNAL_DOMAINS = ['e-consystems.com', 'solutionchamps.com', 'sureshm.com'];

// Countries that require the JP/UNI customer copy
const JP_UNI_COUNTRIES = ['JP', 'GB', 'NO'];

export interface MailContext {
  fromWho: string;       // submitter email
  fname: string;
  company: string;
  country: string;
  stateName: string;
  phone: string;
  newsletterTxt: string;
  incorpid: string;
  productName: string;
  papertype: string;     // HTML anchor links for user-facing email
  econDocList: string;   // HTML anchor links for internal email (no downloadId)
  downloadId: string | number;
  isBlockedForDownload: boolean;
  emailid1: string;      // ZeroBounce non-corporate flag: 'N/A' = clean, otherwise flagged
}

// ─── Internal notification body ─────────────────────────────────────────────

function buildInternalBody(ctx: MailContext, isBot = false): string {
  const rows = [
    ['Company Name', ctx.company],
    ['Name', ctx.fname],
    ['Email', ctx.fromWho],
    ['Country', ctx.country],
    ['State', ctx.stateName],
    ['Phone', ctx.phone],
    ['Specification', ctx.econDocList],
    ['Newsletter and Updates', ctx.newsletterTxt],
    ['Non-Corporate Ids', ctx.incorpid],
    ['Login', 'No'],
    ...(isBot ? [['Bot', 'Yes']] : []),
  ];
  const rowsHtml = rows
    .map(
      ([label, val]) =>
        `<tr><td height="30"><span style="font-size:11px">${label}</span></td><td height="30">${val}</td></tr>`
    )
    .join('');
  return `<HTML><HEAD></HEAD><BODY><table width="500" border="0" cellspacing="0" cellpadding="0">${rowsHtml}</table></BODY></HTML>`;
}

// ─── Customer confirmation body ─────────────────────────────────────────────

function buildCustomerBody(ctx: MailContext): string {
  const year = new Date().getFullYear();
  return `<html><head></head><body>
<table cellpadding="0" cellspacing="0" width="600" style="border:1px #6da6b1 solid;">
<tr><td align="center" valign="top">
<table border="0" cellpadding="0" cellspacing="0" width="600">
<tr><td valign="middle" bgcolor="#006786" align="center" height="60"
  style="color:#FEE6B7;font-size:25px;font-family:Arial,Verdana,Helvetica,sans-serif">
  e-con Systems<br/>
  <span style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
    Think Camera, Think e-con!!
  </span>
</td></tr>
<tr><td valign="top"><table border="0" cellpadding="12" cellspacing="0">
<tr><td><table width="100%" cellpadding="0" cellspacing="0"><tr><td><table>
<tr><td style="font-family:Trebuchet MS;font-size:12px">Dear ${ctx.fname},</td></tr>
<tr><td>&nbsp;</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  Thank you for visiting us at <a href="https://www.e-consystems.com">www.e-consystems.com</a>
  and showing interest in downloading the information.
</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">${ctx.papertype}</td></tr>
<tr><td>&nbsp;</td></tr>
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  <b>You can buy the products directly from our </b>
  <a href="https://www.e-consystems.com/webstore.asp" style="color:#00622c">ONLINE STORE</a>
</td></tr>
</table></td></tr></table></td></tr></table></td></tr>
<tr><td bgcolor="#006786" style="color:#FEE6B7;" height="22">
  &nbsp;&nbsp;<strong>About e-con Systems&reg;:</strong>
</td></tr>
<tr><td height="15"><table width="100%" cellpadding="15" cellspacing="0">
<tr><td style="font-family:Trebuchet MS;font-size:12px">
  e-con Systems&reg; is a leading OEM camera solution provider with 20+ years of experience
  and expertise in embedded vision.
</td></tr>
</table></td></tr>
<tr><td height="30" align="center" valign="middle" bgcolor="#006786"
  style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
  &copy; ${year} <a href="https://www.e-consystems.com"
  style="color:#FFFFFF;font-size:13px;font-family:Arial,Verdana,Helvetica,sans-serif">
  e-con Systems</a> &nbsp;All Rights Reserved.
</td></tr>
</table></td></tr>
</table>
<img src="https://www.e-consystems.com/get-img-url.asp?downloadId=${ctx.downloadId}"
  style="width:1px;height:1px;display:none;"/>
</body></html>`;
}

// ─── Competitor email body ───────────────────────────────────────────────────

function buildCompetitorBody(ctx: MailContext): string {
  return `<html><head></head><body>
<table><tr><td style="font-family:Trebuchet MS;font-size:12px">
  ${ctx.productName} documents download by ${ctx.fromWho}
</td></tr></table></body></html>`;
}

// ─── Send helpers ────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string, bcc?: string) {
  await transporter.sendMail({ from: FROM, to, subject, html, bcc });
}

// receivedmail – internal notification to sales
async function sendReceivedMail(ctx: MailContext) {
  const subject = `Received email from ${ctx.productName} documents download`;
  const body = buildInternalBody(ctx);
  await send(SALES, subject, body, VENKAT);
}

// JpUNICustomereMailCopy – copy to Venkat for JP/UNI countries
async function sendJpUniCopy(ctx: MailContext) {
  const subject = `Received email from ${ctx.productName} documents download`;
  const body = buildInternalBody(ctx);
  await send(VENKAT, subject, body);
}

// econdownloaddetailblock – error/failure alert
async function sendDetailBlock(ctx: MailContext, usaBlock = false) {
  const subject = usaBlock
    ? `Received email from ${ctx.productName} documents download (USA and AK Mail Block)`
    : `Received email from ${ctx.productName} documents download`;
  const body = buildInternalBody(ctx);
  await send(`${VENKAT}, ${SATHIS}`, subject, body);
}

// competitoremail – competitor alert
async function sendCompetitorEmail(ctx: MailContext) {
  const subject = `Download from competitor`;
  const body = buildCompetitorBody(ctx);
  await send(VENKAT, subject, body, MARKETING);
}

// SendLocal – internal-only competitor notification (no customer copy)
async function sendLocal(ctx: MailContext, isUsaAk = false) {
  const subject = isUsaAk
    ? `Download from USA and AK Block Mail`
    : `Download from competitor`;
  const body = buildCompetitorBody(ctx);
  await transporter.sendMail({ from: SALES, to: ctx.fromWho, subject, html: body });
}

// customeremail – confirmation to the person who downloaded
async function sendCustomerEmail(ctx: MailContext) {
  const subject = 'Download as requested, from e-con Systems';
  const body = buildCustomerBody(ctx);
  await send(ctx.fromWho, subject, body);
}

// econdownloadmailblock – sent to internal email (blocked user scenario: e-con/internal emails)
async function sendDownloadMailBlock(ctx: MailContext) {
  const subject = 'Download as requested, from e-con Systems';
  const body = buildCustomerBody(ctx);
  await send(ctx.fromWho, subject, body);
}

// ─── Main dispatch ───────────────────────────────────────────────────────────

/**
 * Dispatches the correct set of emails based on domain, country, and block status.
 * Mirrors the ASP logic exactly.
 */
export async function dispatchDownloadEmails(ctx: MailContext): Promise<void> {
  if (ctx.isBlockedForDownload) {
    // Already downloaded too many times — do not send
    return;
  }

  const emailDomain = ctx.fromWho.split('@')[1] ?? '';
  const isInternal = INTERNAL_DOMAINS.includes(emailDomain);
  const isCompetitor = COMPETITOR_DOMAINS.includes(emailDomain);
  const isBot = ctx.emailid1 !== 'N/A';
  const isUsaAk = ctx.country === 'US' && ctx.stateName === 'AK';
  const isJpUni = JP_UNI_COUNTRIES.includes(ctx.country);

  if (isBot) {
    // Bot detected — send detail block to internal team
    await sendDetailBlock(ctx);
    return;
  }

  // Send internal notification first
  if (isJpUni) {
    if (isInternal) {
      await sendDetailBlock(ctx);
    } else if (isCompetitor) {
      await sendCompetitorEmail(ctx);
    } else {
      await sendReceivedMail(ctx);
      await sendJpUniCopy(ctx);
    }
  } else if (isUsaAk) {
    if (isInternal) {
      await sendDetailBlock(ctx, true);
    } else if (isCompetitor) {
      await sendLocal(ctx, false);
    } else {
      await sendDetailBlock(ctx, true);
    }
  } else {
    if (isInternal) {
      await sendDetailBlock(ctx);
    } else if (isCompetitor) {
      await sendCompetitorEmail(ctx);
    } else {
      await sendReceivedMail(ctx);
    }
  }

  // Customer-facing email
  if (!isBot) {
    if (isUsaAk) {
      if (isInternal) {
        await sendDownloadMailBlock(ctx);
      } else if (isCompetitor) {
        await sendLocal(ctx, false);
      } else {
        await sendLocal(ctx, true);
      }
    } else {
      if (isInternal) {
        await sendDownloadMailBlock(ctx);
      } else if (isCompetitor) {
        await sendLocal(ctx, false);
      } else {
        await sendCustomerEmail(ctx);
      }
    }
  }
}
