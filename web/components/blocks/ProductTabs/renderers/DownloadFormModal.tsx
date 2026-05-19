'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'FR', name: 'France' },
  { code: 'CN', name: 'China' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'DK', name: 'Denmark' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'RU', name: 'Russia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' },
  { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AM', name: 'Armenia' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BZ', name: 'Belize' },
  { code: 'BJ', name: 'Benin' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' },
  { code: 'BN', name: 'Brunei' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' },
  { code: 'CD', name: 'Congo (DRC)' },
  { code: 'CG', name: 'Congo (Republic)' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'CI', name: "CÃ´te d'Ivoire" },
  { code: 'HR', name: 'Croatia' },
  { code: 'CU', name: 'Cuba' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GR', name: 'Greece' },
  { code: 'GD', name: 'Grenada' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' },
  { code: 'HN', name: 'Honduras' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'JM', name: 'Jamaica' },
  { code: 'JO', name: 'Jordan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' },
  { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' },
  { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' },
  { code: 'MR', name: 'Mauritania' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'FM', name: 'Micronesia' },
  { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' },
  { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MA', name: 'Morocco' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' },
  { code: 'NP', name: 'Nepal' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PW', name: 'Palau' },
  { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines' },
  { code: 'WS', name: 'Samoa' },
  { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'SÃ£o TomÃ© and PrÃ­ncipe' },
  { code: 'SN', name: 'Senegal' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'SL', name: 'Sierra Leone' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'SO', name: 'Somalia' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SR', name: 'Suriname' },
  { code: 'SY', name: 'Syria' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'TG', name: 'Togo' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'Other', name: 'Other' },
];

const REASON_MESSAGES: Record<string, string> = {
  free_email:          'Please use your company/work email. Free providers (Gmail, Yahoo, etc.) are not accepted.',
  blocked_domain:      'This email domain is not accepted. Please use a valid company email.',
  email_unverifiable:  'We could not verify this email address. Please enter a valid company email.',
  zerobounce_invalid:  'This email address could not be verified. Please enter a valid company email.',
  zerobounce_unknown:  'We could not verify this email address. Please use a valid company email.',
};

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SelectedDocument {
  name: string;
  url: string;
}

interface DownloadFormModalProps {
  open: boolean;
  onClose: () => void;
  documents: SelectedDocument[];
  productName?: string;
  /** @deprecated recaptchaSiteKey is no longer used */
  recaptchaSiteKey?: string;
}

type Step = 'idle' | 'validating' | 'submitting' | 'done' | 'blocked';

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function inp(err?: string) {
  return [
    'w-full border rounded px-2.5 py-1.5 text-xs outline-none transition-colors',
    err
      ? 'border-red-400 focus:border-red-500 bg-red-50'
      : 'border-gray-300 focus:border-[#0066cc] bg-white',
  ].join(' ');
}



// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function DownloadFormModal({
  open,
  onClose,
  documents,
  productName = '',
}: DownloadFormModalProps) {
  const [name, setName]               = useState('');
  const [company, setCompany]         = useState('');
  const [email, setEmail]             = useState('');
  const [country, setCountry]         = useState('US');
  const [stateName, setStateName]     = useState('');
  const [phone, setPhone]             = useState('');
  const [howDidYouHear, setKnowecon]  = useState('');
  const [newsletter, setNewsletter]   = useState(true);
  const [termsAccepted, setTerms]     = useState(false);

  const [step, setStep]               = useState<Step>('idle');
  const [error, setError]             = useState('');
  const [fieldErrors, setFE]          = useState<Record<string, string>>({});
  const [isEU, setIsEU]               = useState(false);

  const incorpidRef = useRef('');

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Detect EU visitor for GDPR newsletter toggle
  useEffect(() => {
    if (!open) return;
    fetch(`${API_BASE_URL}/public/geo-country`)
      .then((r) => r.json())
      .then((d: { countryCode?: string }) => {
        if (d.countryCode && EU_COUNTRIES.has(d.countryCode)) {
          setIsEU(true);
          setNewsletter(false);
        }
      })
      .catch(() => {});
  }, [open]);

  const handleClose = useCallback(() => {
    setName(''); setCompany(''); setEmail('');
    setCountry('US'); setStateName(''); setPhone('');
    setKnowecon(''); setNewsletter(true); setTerms(false);
    setStep('idle'); setError(''); setFE({});
    incorpidRef.current = '';
    setIsEU(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  function validateFields(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2)
      errs.name = 'Full name is required.';
    if (!company.trim())
      errs.company = 'Company name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = 'Valid work email is required.';
    if (country === 'US' && !stateName)
      errs.state = 'State is required for US.';
    if (!termsAccepted)
      errs.terms = 'You must accept the Terms & Conditions.';
    setFE(errs);
    return Object.keys(errs).length === 0;
  }

  async function validateEmailStep(): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/public/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    const data = await res.json() as { valid: boolean; reason?: string; incorpid?: string };

    if (!data.valid) {
      const reason = data.reason ?? 'email_unverifiable';
      const domain = email.split('@')[1] ?? '';
      // Log blocked attempt â€” fire and forget
      fetch(`${API_BASE_URL}/public/downloads/log-blocked`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, company,
          email: email.trim().toLowerCase(),
          domain,
          status: reason,
          country,
          state: stateName,
          phone,
          productName,
        }),
      }).catch(() => {});

      if (data.incorpid) incorpidRef.current = data.incorpid;
      setError(REASON_MESSAGES[reason] ?? REASON_MESSAGES.email_unverifiable);
      return false;
    }

    if (data.incorpid) incorpidRef.current = data.incorpid;
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validateFields()) return;

    setStep('validating');
    const emailOk = await validateEmailStep().catch(() => {
      setError('Network error during email validation. Please try again.');
      return false;
    });
    if (!emailOk) { setStep('idle'); return; }

    setStep('submitting');
    try {
      const res = await fetch(`${API_BASE_URL}/public/downloads/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim().toLowerCase(),
          country,
          state: stateName,
          phone: phone.trim(),
          howDidYouHear: howDidYouHear.trim(),
          newsletter,
          termsAccepted,
          productName,
          incorpid: incorpidRef.current || '',
          documents: documents.map((d) => ({ name: d.name, url: d.url })),
        }),
      });
      const data = await res.json() as { detail?: { error?: { message?: string } }; message?: string };
      if (res.status === 429) { setStep('blocked'); return; }
      if (!res.ok) {
        setError(data.detail?.error?.message ?? 'Something went wrong. Please try again.');
        setStep('idle');
        return;
      }
      setStep('done');
    } catch {
      setError('Network error. Please try again.');
      setStep('idle');
    }
  }

  const isLoading = step === 'validating' || step === 'submitting';
  const loadingLabel = step === 'validating' ? 'Validating email...' : 'Submitting...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Download request form"
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-[520px] mx-4 z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white px-5 py-3 rounded-t-lg flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-sm">
            {productName ? ('Download - ' + productName) : 'Download Document'}
          </h3>
          <button onClick={handleClose} aria-label="Close" className="text-white/70 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Success / Blocked */}
          {(step === 'done' || step === 'blocked') && (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-[#28a745]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <p className="font-semibold text-[#1e3a5f] text-base mb-1">
                {step === 'blocked' ? 'Already sent!' : 'Download link sent!'}
              </p>
              <p className="text-sm text-gray-500 mb-5">
                {step === 'blocked'
                  ? 'The download details have already been sent to your registered email.'
                  : <>Check your inbox at <strong>{email}</strong></>}
              </p>
              <button onClick={handleClose}
                className="bg-[#28a745] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-[#218838] transition-colors">
                Close
              </button>
            </div>
          )}

          {/* Form */}
          {step !== 'done' && step !== 'blocked' && (
            <form onSubmit={handleSubmit} noValidate className="p-5">
              <p className="text-xs text-gray-500 mb-4">
                Fill in your details to receive the download links by email. Fields marked <span className="text-red-500">*</span> are required.
              </p>

              {/* Row 1: Name | Company */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col">
                  <input type="text" value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inp(fieldErrors.name)}
                    placeholder="Full Name *"
                    maxLength={100} autoComplete="name" />
                  {fieldErrors.name && <p className="text-red-500 text-[10px] mt-0.5 leading-tight">{fieldErrors.name}</p>}
                </div>
                <div className="flex flex-col">
                  <input type="text" value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inp(fieldErrors.company)}
                    placeholder="Company *"
                    maxLength={200} autoComplete="organization" />
                  {fieldErrors.company && <p className="text-red-500 text-[10px] mt-0.5 leading-tight">{fieldErrors.company}</p>}
                </div>
              </div>

              {/* Row 2: Work Email | Phone */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col">
                  <input type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inp(fieldErrors.email)}
                    placeholder="Work Email *"
                    maxLength={200} autoComplete="email" />
                  {fieldErrors.email && <p className="text-red-500 text-[10px] mt-0.5 leading-tight">{fieldErrors.email}</p>}
                </div>
                <div className="flex flex-col">
                  <input type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-() ]/g, ''))}
                    className={inp()}
                    placeholder="Phone"
                    maxLength={30} autoComplete="tel" />
                </div>
              </div>

              {/* Row 3: Country | State (US) or How did you hear (non-US) */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="flex flex-col">
                  <select value={country}
                    onChange={(e) => { setCountry(e.target.value); setStateName(""); }}
                    className={inp()}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {country === "US" ? (
                  <div className="flex flex-col">
                    <select value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className={inp(fieldErrors.state)}>
                      <option value="">State *</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {fieldErrors.state && <p className="text-red-500 text-[10px] mt-0.5 leading-tight">{fieldErrors.state}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <input type="text" value={howDidYouHear}
                      onChange={(e) => setKnowecon(e.target.value)}
                      className={inp()}
                      placeholder="How did you hear about us?"
                      maxLength={300} />
                  </div>
                )}
              </div>

              {/* How did you hear — only shown separately for US (non-US already has it in row 3) */}
              {country === "US" && (
                <div className="mb-3">
                  <input type="text" value={howDidYouHear}
                    onChange={(e) => setKnowecon(e.target.value)}
                    className={inp()}
                    placeholder="How did you hear about us?"
                    maxLength={300} />
                </div>
              )}
              {/* Newsletter â€” EU: explicit opt-in checkbox; non-EU: auto opt-in notice */}
              <div className="mb-2">
                {isEU ? (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className="mt-0.5 accent-[#28a745] shrink-0" />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      I agree to receive e-con Systems newsletters and product updates by email.
                    </span>
                  </label>
                ) : (
                  <p className="text-xs text-gray-500 leading-relaxed">
                    You will receive e-con Systems newsletters and product updates. You can unsubscribe at any time.
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="mb-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 accent-[#28a745] shrink-0" />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    I agree to the{' '}
                    <a href="https://www.e-consystems.com/privacy-policy.asp"
                       target="_blank" rel="noreferrer"
                       className="text-[#0066cc] underline hover:text-[#004499]">
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a href="https://www.e-consystems.com/terms-conditions.asp"
                       target="_blank" rel="noreferrer"
                       className="text-[#0066cc] underline hover:text-[#004499]">
                      Terms &amp; Conditions
                    </a>.{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="text-red-500 text-[11px] mt-0.5 ml-5">{fieldErrors.terms}</p>
                )}
              </div>

              {/* Global error */}
              {error && (
                <div className="mb-3 text-red-700 text-xs bg-red-50 border border-red-200 rounded px-3 py-2 leading-relaxed">
                  {error}
                </div>
              )}

              <button type="submit" disabled={isLoading}
                className="w-full bg-[#28a745] hover:bg-[#218838] disabled:opacity-60 text-white
                           font-semibold py-2.5 rounded text-sm transition-colors flex items-center justify-center gap-2">
                {isLoading && (
                  <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {isLoading ? loadingLabel : 'Download Now'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


