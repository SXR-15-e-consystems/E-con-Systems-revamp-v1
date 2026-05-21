import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { fetchPage, updatePage } from '../api/endpoints';
import { TaxonomyPanel } from '../components/TaxonomyPanel';
import { getBlockEditor } from '../components/blocks/BlockEditorRegistry';
import { getBlockPreview } from '../components/previews/BlockPreviewRegistry';
import { sanitizeHtml } from '../utils/sanitize';
import type { BlockEnvelope, BlockType, LocaleVariant, PageStatus } from '../types';
import { apiClient, PUBLIC_SITE_URL } from '../api/client';
import type { Template } from '../types/template';

const SUPPORTED_BLOCKS: BlockType[] = ['Hero', 'RichText'];

export function PageEditorPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading: pageLoading, isError: pageError } = useQuery({
    queryKey: ['page', slug],
    queryFn: () => fetchPage(slug),
    enabled: slug.length > 0,
  });

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ['template', page?.template_id],
    queryFn: async () => {
      const { data } = await apiClient.get<Template>(`/cms/templates/${page?.template_id}`);
      return data;
    },
    enabled: !!page?.template_id,
  });

  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [blocks, setBlocks] = useState<BlockEnvelope[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  // SEO fields
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogType, setOgType] = useState('website');
  const [twitterCard, setTwitterCard] = useState('summary_large_image');
  const [twitterSite, setTwitterSite] = useState('');
  const [schemaJson, setSchemaJson] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  // JS injection fields
  const [customJsHead, setCustomJsHead] = useState('');
  const [customJsBody, setCustomJsBody] = useState('');
  // Collapsible panel state
  const [seoOpen, setSeoOpen] = useState(false);
  const [scriptsOpen, setScriptsOpen] = useState(false);
  // Locale / translations
  const LOCALE_TABS = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'jp', label: 'JP', name: 'Japanese' },
    { code: 'ko', label: 'KO', name: 'Korean' },
    { code: 'de', label: 'DE', name: 'German' },
  ] as const;
  type LocaleCode = 'jp' | 'ko' | 'de';
  interface LocaleEditorContent {
    title: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
  }
  const EMPTY_LOCALE: LocaleEditorContent = { title: '', metaDescription: '', ogTitle: '', ogDescription: '' };
  const [activeLocale, setActiveLocale] = useState<string>('en');
  const [localeContents, setLocaleContents] = useState<Record<string, LocaleEditorContent>>({
    jp: { ...EMPTY_LOCALE },
    ko: { ...EMPTY_LOCALE },
    de: { ...EMPTY_LOCALE },
  });
  const [translationsOpen, setTranslationsOpen] = useState(false);

  // Use refs to always have latest values in the mutation (fixes stale closure CMS-BUG-002)
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const productNameRef = useRef(productName);
  productNameRef.current = productName;
  const titleRef = useRef(title);
  titleRef.current = title;
  const metaDescriptionRef = useRef(metaDescription);
  metaDescriptionRef.current = metaDescription;
  const ogTitleRef = useRef(ogTitle);
  ogTitleRef.current = ogTitle;
  const ogDescriptionRef = useRef(ogDescription);
  ogDescriptionRef.current = ogDescription;
  const ogTypeRef = useRef(ogType);
  ogTypeRef.current = ogType;
  const twitterCardRef = useRef(twitterCard);
  twitterCardRef.current = twitterCard;
  const twitterSiteRef = useRef(twitterSite);
  twitterSiteRef.current = twitterSite;
  const schemaJsonRef = useRef(schemaJson);
  schemaJsonRef.current = schemaJson;
  const canonicalUrlRef = useRef(canonicalUrl);
  canonicalUrlRef.current = canonicalUrl;
  const customJsHeadRef = useRef(customJsHead);
  customJsHeadRef.current = customJsHead;
  const customJsBodyRef = useRef(customJsBody);
  customJsBodyRef.current = customJsBody;
  const localeContentsRef = useRef(localeContents);
  localeContentsRef.current = localeContents;

  // Initialize form state from server data in useEffect (fixes CMS-BUG-001: state update during render)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (page && !initializedRef.current) {
      initializedRef.current = true;
      setTitle(page.title);
      setMetaDescription(page.meta_description);
      setProductName(page.product_name ?? '');
      setStatus(page.status);
      setBlocks(page.blocks);
      setOgTitle(page.og_title ?? '');
      setOgDescription(page.og_description ?? '');
      setOgType(page.og_type ?? 'website');
      setTwitterCard(page.twitter_card ?? 'summary_large_image');
      setTwitterSite(page.twitter_site ?? '');
      setSchemaJson(page.schema_json ?? '');
      setCanonicalUrl(page.canonical_url ?? '');
      setCustomJsHead(page.custom_js_head ?? '');
      setCustomJsBody(page.custom_js_body ?? '');
      // Initialize locale variant contents from saved page data
      const savedLocales = page.locales ?? {};
      setLocaleContents({
        jp: {
          title: (savedLocales.jp as LocaleVariant | undefined)?.title ?? '',
          metaDescription: (savedLocales.jp as LocaleVariant | undefined)?.meta_description ?? '',
          ogTitle: (savedLocales.jp as LocaleVariant | undefined)?.og_title ?? '',
          ogDescription: (savedLocales.jp as LocaleVariant | undefined)?.og_description ?? '',
        },
        ko: {
          title: (savedLocales.ko as LocaleVariant | undefined)?.title ?? '',
          metaDescription: (savedLocales.ko as LocaleVariant | undefined)?.meta_description ?? '',
          ogTitle: (savedLocales.ko as LocaleVariant | undefined)?.og_title ?? '',
          ogDescription: (savedLocales.ko as LocaleVariant | undefined)?.og_description ?? '',
        },
        de: {
          title: (savedLocales.de as LocaleVariant | undefined)?.title ?? '',
          metaDescription: (savedLocales.de as LocaleVariant | undefined)?.meta_description ?? '',
          ogTitle: (savedLocales.de as LocaleVariant | undefined)?.og_title ?? '',
          ogDescription: (savedLocales.de as LocaleVariant | undefined)?.og_description ?? '',
        },
      });
    }
  }, [page]);

  const saveMutation = useMutation({
    mutationFn: (nextStatus: PageStatus) => {
      const currentBlocks = blocksRef.current;
      const normalizedBlocks = currentBlocks.map((block, index) => ({
        ...block,
        order: index,
        data:
          block.type === 'RichText' && typeof block.data.html === 'string'
            ? { ...block.data, html: sanitizeHtml(block.data.html) }
            : block.data,
        // Preserve per-block locale overrides (empty object = no translations yet)
        locales: block.locales ?? {},
      }));
      return updatePage(slug, {
        title: titleRef.current,
        meta_description: metaDescriptionRef.current,
        product_name: productNameRef.current,
        status: nextStatus,
        blocks: normalizedBlocks,
        og_title: ogTitleRef.current,
        og_description: ogDescriptionRef.current,
        og_type: ogTypeRef.current,
        twitter_card: twitterCardRef.current,
        twitter_site: twitterSiteRef.current,
        schema_json: schemaJsonRef.current,
        canonical_url: canonicalUrlRef.current || undefined,
        custom_js_head: customJsHeadRef.current,
        custom_js_body: customJsBodyRef.current,
        locales: {
          jp: {
            title: localeContentsRef.current.jp?.title ?? '',
            meta_description: localeContentsRef.current.jp?.metaDescription ?? '',
            og_title: localeContentsRef.current.jp?.ogTitle ?? '',
            og_description: localeContentsRef.current.jp?.ogDescription ?? '',
          },
          ko: {
            title: localeContentsRef.current.ko?.title ?? '',
            meta_description: localeContentsRef.current.ko?.metaDescription ?? '',
            og_title: localeContentsRef.current.ko?.ogTitle ?? '',
            og_description: localeContentsRef.current.ko?.ogDescription ?? '',
          },
          de: {
            title: localeContentsRef.current.de?.title ?? '',
            meta_description: localeContentsRef.current.de?.metaDescription ?? '',
            og_title: localeContentsRef.current.de?.ogTitle ?? '',
            og_description: localeContentsRef.current.de?.ogDescription ?? '',
          },
        },
      });
    },
    onSuccess: async (updatedPage) => {
      setStatus(updatedPage.status);
      setBlocks(updatedPage.blocks);
      await queryClient.invalidateQueries({ queryKey: ['pages'] });
      await queryClient.invalidateQueries({ queryKey: ['page', slug] });
    },
  });

  const addBlock = (type: BlockType) => {
    const baseData =
      type === 'Hero'
        ? { title: '', subtitle: '', image_url: '', cta_text: '', cta_link: '' }
        : { html: '' };
    setBlocks((prev) => [
      ...prev,
      { block_id: uuidv4(), type, order: prev.length, visible: true, data: baseData },
    ]);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((b, i) => ({ ...b, order: i }));
    });
  };

  if (pageLoading || (page?.template_id && templateLoading)) {
    return <main className="flex h-screen items-center justify-center text-slate-500">Loading page…</main>;
  }
  if (pageError || !page) {
    return <main className="flex h-screen items-center justify-center text-red-600">Failed to load page.</main>;
  }

  const isTemplatePage = !!page.template_id;
  const editingBlock = editingBlockId ? blocks.find(b => b.block_id === editingBlockId) : null;
  const editingComponentDef = editingBlock && template
    ? template.components.find(c => c.component_id === editingBlock.component_id)
    : null;
  const ActiveEditor = editingBlock ? getBlockEditor(editingBlock.type) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  TEMPLATE-BASED PAGE EDITOR (Split-Screen: Live Canvas + Property Panel)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isTemplatePage && template) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
        {/* ─── Top Toolbar ─── */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm z-30">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={() => navigate('/')} type="button"
            >
              ← Back
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[260px]">{title || page.slug}</h1>
              <span className="text-[10px] text-slate-400 font-mono">/{page.slug}</span>
            </div>
            <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
              {template.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {saveMutation.isError && <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Save Failed</span>}
            {saveMutation.isSuccess && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">✓ Saved</span>}
            <a
              className="text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
              href={`${PUBLIC_SITE_URL}/${page.slug}`} target="_blank" rel="noreferrer"
            >Preview ↗</a>
            <div className="h-5 w-px bg-slate-200" />
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              onClick={() => saveMutation.mutate('draft')} type="button" disabled={saveMutation.isPending}
            >Save Draft</button>
            <button
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              onClick={() => saveMutation.mutate('published')} type="button" disabled={saveMutation.isPending}
            >Publish</button>
          </div>
        </header>

        {/* ─── Main Workspace ─── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: Live Canvas ── */}
          <div
            className="flex-1 overflow-auto p-6"
            onClick={() => setEditingBlockId(null)}
          >
            <div className="mx-auto w-full max-w-[1440px]">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 rounded-t-xl bg-slate-700 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-4 flex-1 rounded-md bg-slate-800/80 px-4 py-1.5 text-xs text-slate-300 font-mono border border-slate-600/40">
                  {PUBLIC_SITE_URL.replace(/^https?:\/\//, '')}/{page.slug}
                </div>
              </div>

              {/* Grid Canvas */}
              <div className="rounded-b-xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${template.grid.columns}, 1fr)`,
                    gridAutoRows: `${template.grid.row_height}px`,
                    gap: `${template.grid.gap}px`,
                    padding: `${template.grid.gap}px`,
                  }}
                >
                  {blocks.map((block) => {
                    const compDef = template.components.find(c => c.component_id === block.component_id);
                    if (!compDef) return null;

                    const Preview = getBlockPreview(block.type);
                    const isSelected = editingBlockId === block.block_id;

                    // Merge template styling into block data.
                    // New components store config under nested `meta`; merge template
                    // flat meta INTO that nested key so previews render correctly.
                    const blockData = (block.data || {}) as Record<string, unknown>;
                    const tmplMeta = compDef.meta || {};
                    const hasNested = blockData.meta && typeof blockData.meta === 'object' && !Array.isArray(blockData.meta);
                    const mergedData = hasNested
                      ? { ...blockData, meta: { ...tmplMeta, ...(blockData.meta as Record<string, unknown>) } }
                      : { ...tmplMeta, ...blockData };

                    return (
                      <div
                        key={block.block_id}
                        onClick={(e) => { e.stopPropagation(); setEditingBlockId(block.block_id); }}
                        className={`
                          relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200
                          ${isSelected
                            ? 'ring-4 ring-blue-500/40 border-2 border-blue-500 shadow-2xl scale-[1.005] z-10'
                            : 'border border-slate-200 hover:border-blue-300 hover:shadow-lg'
                          }
                        `}
                        style={{
                          gridColumn: `${compDef.grid_placement.col_start} / ${compDef.grid_placement.col_end}`,
                          gridRow: `${compDef.grid_placement.row_start} / ${compDef.grid_placement.row_end}`,
                        }}
                      >
                        {/* Live preview renderer */}
                        <Preview data={mergedData} />

                        {/* Component label badge */}
                        <div className={`absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm
                          ${isSelected ? 'bg-blue-600 text-white' : 'bg-black/60 text-white/90'}
                        `}>
                          {compDef.label || compDef.type}
                        </div>

                        {/* Edit indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Properties Panel ── */}
          <div
            className="w-[380px] flex-shrink-0 border-l border-slate-200 bg-white flex flex-col shadow-2xl z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {editingBlock && ActiveEditor ? (
              /* ── Block Content Editor ── */
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
                  <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Properties</h2>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      {editingComponentDef?.label || editingBlock.type}
                    </h3>
                    {activeLocale !== 'en' && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        🌐 {LOCALE_TABS.find(l => l.code === activeLocale)?.label} — Translating
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setBlocks(prev => prev.map(b =>
                        b.block_id === editingBlock.block_id
                          ? { ...b, content_status: 'filled' }
                          : b
                      ));
                      setEditingBlockId(null);
                    }}
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition-colors"
                  >
                    ✓ Done
                  </button>
                </div>
                {activeLocale !== 'en' && (
                  <div className="shrink-0 bg-blue-50 border-b border-blue-100 px-5 py-2">
                    <p className="text-[11px] text-blue-700">
                      Editing <strong>{LOCALE_TABS.find(l => l.code === activeLocale)?.name}</strong> translation. Fields left blank fall back to English.
                    </p>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-5">
                  <ActiveEditor
                    block={{
                      ...editingBlock,
                      // When translating, show merged EN+locale data so the editor
                      // pre-fills with existing translations (blank = EN fallback)
                      data: activeLocale === 'en'
                        ? editingBlock.data
                        : { ...editingBlock.data, ...(editingBlock.locales?.[activeLocale] ?? {}) },
                    }}
                    onChange={(newData: Record<string, unknown>) => {
                      if (activeLocale === 'en') {
                        // EN: write directly to block.data (existing behaviour)
                        setBlocks(prev => prev.map(b =>
                          b.block_id === editingBlock.block_id
                            ? { ...b, data: { ...b.data, ...newData } }
                            : b
                        ));
                      } else {
                        // Non-EN: write to block.locales[activeLocale] only
                        setBlocks(prev => prev.map(b =>
                          b.block_id === editingBlock.block_id
                            ? {
                                ...b,
                                locales: {
                                  ...b.locales,
                                  [activeLocale]: {
                                    ...(b.locales?.[activeLocale] ?? {}),
                                    ...newData,
                                  },
                                },
                              }
                            : b
                        ));
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              /* ── Page Settings ── */
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Properties</h2>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">Page Settings</h3>
                  {/* ── Language Selector ── */}
                  <div className="flex mt-3 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                    {LOCALE_TABS.map((loc) => (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => setActiveLocale(loc.code)}
                        title={loc.name}
                        className={`flex-1 py-1.5 text-[11px] font-bold transition-colors ${
                          activeLocale === loc.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {activeLocale !== 'en' && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
                      <p className="text-xs font-semibold text-blue-800">
                        🌐 {LOCALE_TABS.find(l => l.code === activeLocale)?.name} — Translations
                      </p>
                      <p className="text-[11px] text-blue-600">Fields left blank fall back to English automatically. Block content uses English for all languages.</p>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">Title</span>
                        <input
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={localeContents[activeLocale]?.title ?? ''}
                          onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], title: e.target.value } }))}
                          placeholder={`${LOCALE_TABS.find(l => l.code === activeLocale)?.name} title (leave blank for EN)`}
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">Meta Description</span>
                        <textarea
                          className="min-h-[70px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={localeContents[activeLocale]?.metaDescription ?? ''}
                          onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], metaDescription: e.target.value } }))}
                          placeholder="Leave blank for EN"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">OG Title</span>
                        <input
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={localeContents[activeLocale]?.ogTitle ?? ''}
                          onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ogTitle: e.target.value } }))}
                          placeholder="Leave blank for EN"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">OG Description</span>
                        <textarea
                          className="min-h-[60px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={localeContents[activeLocale]?.ogDescription ?? ''}
                          onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ogDescription: e.target.value } }))}
                          placeholder="Leave blank for EN"
                        />
                      </label>
                    </div>
                  )}
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-600">Page Title</span>
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-600">Meta Description</span>
                    <textarea
                      className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-600">Product Name</span>
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. See3CAM_CU27"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-600">Status</span>
                    <select
                      className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm cursor-not-allowed opacity-80"
                      value={status} disabled
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">Use the header buttons to change status.</p>
                  </label>

                  {/* ── SEO & Social (collapsible) ── */}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
                      onClick={() => setSeoOpen((v) => !v)}
                    >
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">SEO &amp; Social</span>
                      <span className="text-slate-400 text-sm">{seoOpen ? '▲' : '▼'}</span>
                    </button>
                    {seoOpen && (
                      <div className="px-4 py-4 space-y-4 bg-white">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">OG Title <span className="font-normal text-slate-400">(overrides page title for sharing)</span></span>
                          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Leave blank to use page title" />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">OG Description <span className="font-normal text-slate-400">(for social sharing)</span></span>
                          <textarea className="min-h-[70px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Leave blank to use meta description" />
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-slate-600">OG Type</span>
                            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={ogType} onChange={(e) => setOgType(e.target.value)}>
                              <option value="website">website</option>
                              <option value="article">article</option>
                              <option value="product">product</option>
                            </select>
                          </label>
                          <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-slate-600">Twitter Card</span>
                            <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={twitterCard} onChange={(e) => setTwitterCard(e.target.value)}>
                              <option value="summary_large_image">summary_large_image</option>
                              <option value="summary">summary</option>
                            </select>
                          </label>
                        </div>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Twitter @site handle</span>
                          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={twitterSite} onChange={(e) => setTwitterSite(e.target.value)} placeholder="@econsystems" />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Canonical URL <span className="font-normal text-slate-400">(leave blank for default)</span></span>
                          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://e-consystems.com/..." />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Schema / JSON-LD <span className="font-normal text-slate-400">(structured data for Google)</span></span>
                          <textarea className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Product"\n}'} />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* ── Scripts (collapsible) ── */}
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
                      onClick={() => setScriptsOpen((v) => !v)}
                    >
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scripts / Tracking</span>
                      <span className="text-slate-400 text-sm">{scriptsOpen ? '▲' : '▼'}</span>
                    </button>
                    {scriptsOpen && (
                      <div className="px-4 py-4 space-y-4 bg-white">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Head Scripts <span className="font-normal text-slate-400">(injected before page renders)</span></span>
                          <textarea className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={customJsHead} onChange={(e) => setCustomJsHead(e.target.value)} placeholder="<!-- e.g. Google Tag Manager snippet -->" />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-semibold text-slate-600">Body Scripts <span className="font-normal text-slate-400">(injected after page renders)</span></span>
                          <textarea className="min-h-[100px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={customJsBody} onChange={(e) => setCustomJsBody(e.target.value)} placeholder="<!-- e.g. analytics or chat widget -->" />
                        </label>
                        {(template?.custom_js_head || template?.custom_js_body) && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-bold text-amber-800 mb-2">Template Scripts (read-only, applied to all pages using this template)</p>
                            {template.custom_js_head && (
                              <div className="mb-2">
                                <p className="text-[10px] font-semibold text-amber-700 mb-1">Head:</p>
                                <pre className="text-[10px] text-amber-900 whitespace-pre-wrap break-all overflow-auto max-h-24 bg-amber-100 rounded p-2 font-mono">{template.custom_js_head}</pre>
                              </div>
                            )}
                            {template.custom_js_body && (
                              <div>
                                <p className="text-[10px] font-semibold text-amber-700 mb-1">Body:</p>
                                <pre className="text-[10px] text-amber-900 whitespace-pre-wrap break-all overflow-auto max-h-24 bg-amber-100 rounded p-2 font-mono">{template.custom_js_body}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── URL & Categorisation (collapsible) ── */}
                  <TaxonomyPanel
                    pageSlug={slug}
                    productName={productName}
                    pageId={page.id}
                  />

                  <div className="mt-6 rounded-lg bg-blue-50 p-4 border border-blue-100">
                    <h4 className="font-bold text-blue-800 text-xs mb-1">💡 How to edit blocks</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Click any block on the live preview canvas to edit its content (images, text, links, CTA buttons) right here in this panel.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LEGACY PAGE EDITOR (Stacked Forms — for pages without templates)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <button className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50" onClick={() => navigate('/')} type="button">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Editing: {page.slug}</h1>
        <div className="ml-auto flex items-center gap-2">
          <a className="text-sm font-semibold text-blue-600 hover:underline" href={`${PUBLIC_SITE_URL}/${page.slug}`} target="_blank" rel="noreferrer">Preview ↗</a>
          <div className="h-5 w-px bg-slate-300 mx-1" />
          <button
            className="rounded border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => saveMutation.mutate('draft')} type="button" disabled={saveMutation.isPending}
          >{saveMutation.isPending ? 'Saving…' : 'Save Draft'}</button>
          <button
            className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            onClick={() => saveMutation.mutate('published')} type="button" disabled={saveMutation.isPending}
          >Publish Page</button>
        </div>
      </div>

      {saveMutation.isError && <p className="text-sm rounded bg-red-50 text-red-600 px-4 py-3 border border-red-200">Failed to save page.</p>}
      {saveMutation.isSuccess && <p className="text-sm rounded bg-emerald-50 text-emerald-700 px-4 py-3 border border-emerald-200">Saved successfully.</p>}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800">Page Settings</h2>
          {/* ── Language Selector ── */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            {LOCALE_TABS.map((loc) => (
              <button
                key={loc.code}
                type="button"
                onClick={() => setActiveLocale(loc.code)}
                title={loc.name}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  activeLocale === loc.code
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
        {activeLocale !== 'en' ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm font-semibold text-blue-800">🌐 {LOCALE_TABS.find(l => l.code === activeLocale)?.name} — Translations</p>
              <p className="text-xs text-blue-600 mt-1">Fields left blank fall back to English automatically. Block content uses English for all languages.</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Title</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={localeContents[activeLocale]?.title ?? ''}
                onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], title: e.target.value } }))}
                placeholder={`${LOCALE_TABS.find(l => l.code === activeLocale)?.name} title (leave blank for EN)`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Meta Description</span>
              <textarea
                className="min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={localeContents[activeLocale]?.metaDescription ?? ''}
                onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], metaDescription: e.target.value } }))}
                placeholder="Leave blank for EN"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">OG Title</span>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={localeContents[activeLocale]?.ogTitle ?? ''}
                onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ogTitle: e.target.value } }))}
                placeholder="Leave blank for EN"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">OG Description</span>
              <textarea
                className="min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={localeContents[activeLocale]?.ogDescription ?? ''}
                onChange={(e) => setLocaleContents((prev) => ({ ...prev, [activeLocale]: { ...prev[activeLocale], ogDescription: e.target.value } }))}
                placeholder="Leave blank for EN"
              />
            </label>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Title <span className="text-red-500">*</span></span>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Meta Description</span>
            <textarea className="min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Product Name</span>
            <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. See3CAM_CU27" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Status</span>
            <select className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm" value={status} disabled onChange={(e) => setStatus(e.target.value as PageStatus)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
        )} {/* end EN */}
      </section>

      {/* ── SEO & Social (Legacy editor) ── */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 text-left border-b border-slate-100"
          onClick={() => setSeoOpen((v) => !v)}
        >
          <h2 className="text-base font-bold text-slate-800">SEO &amp; Social</h2>
          <span className="text-slate-400">{seoOpen ? '▲' : '▼'}</span>
        </button>
        {seoOpen && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">OG Title <span className="font-normal text-slate-500 text-xs">(overrides page title for social sharing)</span></span>
              <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Leave blank to use page title" />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">OG Description <span className="font-normal text-slate-500 text-xs">(for social sharing)</span></span>
              <textarea className="min-h-[80px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} placeholder="Leave blank to use meta description" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">OG Type</span>
              <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={ogType} onChange={(e) => setOgType(e.target.value)}>
                <option value="website">website</option>
                <option value="article">article</option>
                <option value="product">product</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Twitter Card</span>
              <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={twitterCard} onChange={(e) => setTwitterCard(e.target.value)}>
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Twitter @site handle</span>
              <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={twitterSite} onChange={(e) => setTwitterSite(e.target.value)} placeholder="@econsystems" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Canonical URL</span>
              <input className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://e-consystems.com/..." />
            </label>
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">Schema / JSON-LD <span className="font-normal text-slate-500 text-xs">(structured data for Google &amp; AI)</span></span>
              <textarea className="min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none" value={schemaJson} onChange={(e) => setSchemaJson(e.target.value)} placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Product"\n}'} />
            </label>
          </div>
        )}
      </section>

      {/* ── Scripts / Tracking (Legacy editor) ── */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 text-left border-b border-slate-100"
          onClick={() => setScriptsOpen((v) => !v)}
        >
          <h2 className="text-base font-bold text-slate-800">Scripts / Tracking</h2>
          <span className="text-slate-400">{scriptsOpen ? '▲' : '▼'}</span>
        </button>
        {scriptsOpen && (
          <div className="p-6 grid grid-cols-1 gap-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Head Scripts <span className="font-normal text-slate-500 text-xs">(injected before page renders)</span></span>
              <textarea className="min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none" value={customJsHead} onChange={(e) => setCustomJsHead(e.target.value)} placeholder="<!-- e.g. Google Tag Manager snippet -->" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700">Body Scripts <span className="font-normal text-slate-500 text-xs">(injected after page renders)</span></span>
              <textarea className="min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none" value={customJsBody} onChange={(e) => setCustomJsBody(e.target.value)} placeholder="<!-- e.g. analytics or chat widget -->" />
            </label>
          </div>
        )}
      </section>

      {/* ── URL & Categorisation (Legacy editor) ── */}
      <TaxonomyPanel pageSlug={slug} productName={productName} pageId={page.id} />

      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Legacy Blocks</h2>
            <div className="flex gap-2">
              {SUPPORTED_BLOCKS.map((blockType) => (
                <button key={blockType} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200" onClick={() => addBlock(blockType)} type="button">+ {blockType}</button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {blocks.map((block, index) => {
              const Editor = getBlockEditor(block.type);
              return (
                <article key={block.block_id} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm mr-2">{index + 1}. {block.type}</h3>
                    <div className="flex overflow-hidden rounded border border-slate-300 shadow-sm">
                      <button className="bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 border-r border-slate-300" onClick={() => moveBlock(index, -1)} type="button">Up</button>
                      <button className="bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100" onClick={() => moveBlock(index, 1)} type="button">Down</button>
                    </div>
                    <button className="rounded border border-slate-300 bg-white shadow-sm px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => setBlocks((prev) => prev.map((item, idx) => idx === index ? { ...item, visible: !item.visible } : item))} type="button">
                      {block.visible ? 'Hide' : 'Show'}
                    </button>
                    <button className="ml-auto rounded border border-red-200 bg-white px-3 py-1 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50" onClick={() => setBlocks((prev) => prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx })))} type="button">Delete</button>
                  </div>
                  {Editor ? (
                    <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
                      <Editor block={block} onChange={(updatedData: any) => setBlocks((prev) => prev.map((item, idx) => idx === index ? { ...item, data: updatedData } : item))} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">Editor not implemented for this block type yet.</p>
                  )}
                </article>
              );
            })}
            {blocks.length === 0 && (
              <div className="py-12 text-center text-sm font-medium text-slate-500">No blocks added yet.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
