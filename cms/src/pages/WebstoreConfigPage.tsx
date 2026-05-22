import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  fetchWebstoreConfig,
  saveWebstoreConfig,
  type WebstoreConfig,
  type WebstoreCountryEntry,
  type WebstoreDistributor,
} from '../api/endpoints';

const EMPTY_DISTRIBUTOR: WebstoreDistributor = {
  name: '', email: '', phone: '', website: '', message: '',
};

const EMPTY_COUNTRY: WebstoreCountryEntry = {
  country_code: '',
  purchase_mode: 'buy',
  cart_url: '',
  distributor: { ...EMPTY_DISTRIBUTOR },
};

export function WebstoreConfigPage() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['webstore-config'],
    queryFn: fetchWebstoreConfig,
  });

  const [defaultCartUrl, setDefaultCartUrl] = useState('');
  const [countries, setCountries] = useState<WebstoreCountryEntry[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setDefaultCartUrl(config.default_cart_url || '');
      setCountries(config.countries || []);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => saveWebstoreConfig({ default_cart_url: defaultCartUrl, countries }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webstore-config'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const addCountry = () => {
    setCountries((prev) => [...prev, { ...EMPTY_COUNTRY, distributor: { ...EMPTY_DISTRIBUTOR } }]);
    setExpandedIdx(countries.length);
  };

  const removeCountry = (idx: number) => {
    setCountries((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  const updateCountry = (idx: number, partial: Partial<WebstoreCountryEntry>) => {
    setCountries((prev) => prev.map((c, i) => i === idx ? { ...c, ...partial } : c));
  };

  const updateDistributor = (idx: number, partial: Partial<WebstoreDistributor>) => {
    setCountries((prev) => prev.map((c, i) =>
      i === idx ? { ...c, distributor: { ...c.distributor, ...partial } } : c
    ));
  };

  if (isLoading) return <main className="flex h-screen items-center justify-center text-slate-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Webstore Configuration</h1>
          <p className="mt-1 text-sm text-slate-500">Configure the default cart URL and per-country distributor settings.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md">✓ Saved</span>}
          {saveMutation.isError && <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1.5 rounded-md">Save failed</span>}
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Default Cart URL */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Default Cart URL</h2>
        <p className="text-xs text-slate-500 mb-3">
          Used for all countries in "buy" mode. Product code is appended as <code className="bg-slate-100 px-1 rounded font-mono">?ProductName=&#123;part_no&#125;&amp;quantity=1</code>
        </p>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          value={defaultCartUrl}
          onChange={(e) => setDefaultCartUrl(e.target.value)}
          placeholder="http://www.sandbox.e-consystems.com/auth/webstore/Index"
        />
      </div>

      {/* Country Entries */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Country Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">Countries not listed default to "buy" mode with the default cart URL.</p>
          </div>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            onClick={addCountry}
          >+ Add Country</button>
        </div>

        {countries.length === 0 && (
          <p className="px-6 py-8 text-sm text-center text-slate-400">No country overrides yet. All countries default to "buy" mode.</p>
        )}

        {countries.map((entry, idx) => (
          <div key={idx} className="border-b border-slate-100 last:border-0">
            {/* Entry header */}
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 text-left"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-block min-w-[40px] rounded bg-slate-100 px-2 py-0.5 text-xs font-bold font-mono text-slate-700">
                  {entry.country_code || '???'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${entry.purchase_mode === 'buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {entry.purchase_mode === 'buy' ? '🛒 Buy' : '📞 Contact'}
                </span>
                {entry.purchase_mode === 'contact' && entry.distributor.name && (
                  <span className="text-xs text-slate-500">{entry.distributor.name}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-red-400 hover:text-red-600 text-xs px-1"
                  onClick={(e) => { e.stopPropagation(); removeCountry(idx); }}
                >Remove</button>
                <span className="text-slate-400 text-sm">{expandedIdx === idx ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded fields */}
            {expandedIdx === idx && (
              <div className="px-6 pb-6 pt-2 space-y-4 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">Country Code <span className="text-red-400">*</span></span>
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none"
                      value={entry.country_code}
                      onChange={(e) => updateCountry(idx, { country_code: e.target.value.toUpperCase().slice(0, 3) })}
                      placeholder="IN"
                      maxLength={3}
                    />
                    <span className="text-[10px] text-slate-400">ISO 3166 alpha-2 (e.g. IN, DE, JP, KR)</span>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">Purchase Mode</span>
                    <select
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                      value={entry.purchase_mode}
                      onChange={(e) => updateCountry(idx, { purchase_mode: e.target.value as 'buy' | 'contact' })}
                    >
                      <option value="buy">🛒 Buy — redirect to cart</option>
                      <option value="contact">📞 Contact — show distributor info</option>
                    </select>
                  </label>
                </div>

                {entry.purchase_mode === 'buy' && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">Cart URL Override <span className="font-normal text-slate-400">(leave blank to use default)</span></span>
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-emerald-500 focus:outline-none"
                      value={entry.cart_url}
                      onChange={(e) => updateCountry(idx, { cart_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </label>
                )}

                {entry.purchase_mode === 'contact' && (
                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <h3 className="text-xs font-bold text-amber-800">Distributor Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">Company Name</span>
                        <input className="rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none" value={entry.distributor.name} onChange={(e) => updateDistributor(idx, { name: e.target.value })} placeholder="ABC Trading Ltd" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">Email</span>
                        <input type="email" className="rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none" value={entry.distributor.email} onChange={(e) => updateDistributor(idx, { email: e.target.value })} placeholder="sales@distributor.com" />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">Phone</span>
                        <input className="rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none" value={entry.distributor.phone} onChange={(e) => updateDistributor(idx, { phone: e.target.value })} placeholder="+1-800-..." />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">Website</span>
                        <input className="rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none" value={entry.distributor.website} onChange={(e) => updateDistributor(idx, { website: e.target.value })} placeholder="https://distributor.com" />
                      </label>
                    </div>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-slate-600">Custom Message <span className="font-normal text-slate-400">(shown to users in the modal)</span></span>
                      <textarea
                        className="min-h-[72px] rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-amber-500 focus:outline-none"
                        value={entry.distributor.message}
                        onChange={(e) => updateDistributor(idx, { message: e.target.value })}
                        placeholder="For orders in India, please contact our authorized distributor..."
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
