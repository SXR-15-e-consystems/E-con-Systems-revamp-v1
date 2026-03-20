import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Component definitions for the tray (all your existing TemplatesComps)
// ─────────────────────────────────────────────────────────────────────────────

export interface TrayComponentDef {
  type: BlockType;
  label: string;
  description: string;
  icon: string;      // emoji icon for visual identification
  category: 'content' | 'media' | 'interactive' | 'layout';
  defaultMeta: Record<string, unknown>;
  /** Default grid span for when dropped onto canvas */
  defaultSpan: { cols: number; rows: number };
}

export const TRAY_COMPONENTS: TrayComponentDef[] = [
  // ── Legacy components ──
  {
    type: 'Hero',
    label: 'Hero Section',
    description: 'Full-width hero banner with title, subtitle, image & CTA',
    icon: '🎯',
    category: 'content',
    defaultMeta: {},
    defaultSpan: { cols: 12, rows: 6 },
  },
  {
    type: 'RichText',
    label: 'Rich Text',
    description: 'Free-form HTML text content block',
    icon: '📝',
    category: 'content',
    defaultMeta: {},
    defaultSpan: { cols: 12, rows: 4 },
  },

  // ── TemplatesComps components ──
  {
    type: 'Banner',
    label: 'Banner',
    description: 'Image banner with optional slider, CTA overlay & variants',
    icon: '🖼️',
    category: 'media',
    defaultMeta: {
      width: '100%',
      height: '480px',
      bgColor: '#000000',
      variant: 'type2',
      sliderMode: false,
      autoplayInterval: 5000,
      ctaPosition: 'bottom-left',
      ctaStyle: { bgColor: '#e63329', textColor: '#ffffff', borderRadius: '4px', fontSize: '16px' },
    },
    defaultSpan: { cols: 12, rows: 8 },
  },
  {
    type: 'RelatedContent',
    label: 'Related Content',
    description: 'Card grid for blogs, videos, products, or case studies',
    icon: '📰',
    category: 'content',
    defaultMeta: {
      contentType: 'Blog',
      displayCount: 3,
      sliderMode: false,
      showTitle: true,
      showCTA: true,
      ctaLabel: 'Read More',
      cardStyle: { bgColor: '#ffffff', textColor: '#1a1a1a', borderRadius: '8px' },
      width: '100%',
    },
    defaultSpan: { cols: 12, rows: 6 },
  },
  {
    type: 'Timer',
    label: 'Countdown Timer',
    description: 'Countdown timer bar or popup with configurable position',
    icon: '⏱️',
    category: 'interactive',
    defaultMeta: {
      layout: 'bar',
      position: 'bottom',
      visible: true,
      bgColor: '#1a1a1a',
      textColor: '#ffffff',
      width: '380px',
    },
    defaultSpan: { cols: 12, rows: 2 },
  },
  {
    type: 'Form',
    label: 'Form',
    description: 'Contact, registration, or quote request form',
    icon: '📋',
    category: 'interactive',
    defaultMeta: {
      formType: 'contact',
      recaptchaSiteKey: '',
      tcLink: '/terms',
      bgColor: '#ffffff',
      width: '600px',
      submitLabel: 'Submit',
    },
    defaultSpan: { cols: 8, rows: 8 },
  },
  {
    type: 'CTAButton',
    label: 'CTA Button',
    description: 'Call-to-action button that opens a form modal',
    icon: '🔘',
    category: 'interactive',
    defaultMeta: {
      formType: 'contact',
      width: 'auto',
      position: 'inline',
      style: {
        bgColor: '#e63329',
        textColor: '#ffffff',
        borderRadius: '4px',
        fontSize: '16px',
        padding: '12px 24px',
      },
    },
    defaultSpan: { cols: 4, rows: 2 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Individual draggable tray item
// ─────────────────────────────────────────────────────────────────────────────

function TrayItem({ def }: { def: TrayComponentDef }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray-${def.type}`,
    data: { source: 'tray', componentDef: def },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-150
        hover:border-blue-400 hover:shadow-md hover:bg-blue-50/40
        ${isDragging ? 'opacity-40 scale-95 border-blue-500 shadow-lg' : ''}
      `}
    >
      <span className="mt-0.5 text-xl leading-none">{def.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{def.label}</p>
        <p className="mt-0.5 text-xs text-slate-500 leading-snug">{def.description}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Full component tray sidebar
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES: { key: TrayComponentDef['category']; label: string }[] = [
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'interactive', label: 'Interactive' },
  { key: 'layout', label: 'Layout' },
];

export function ComponentTray() {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
          Components
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">Drag onto canvas</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {CATEGORIES.map(({ key, label }) => {
          const items = TRAY_COMPONENTS.filter((c) => c.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <h3 className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {label}
              </h3>
              <div className="space-y-2">
                {items.map((def) => (
                  <TrayItem key={def.type} def={def} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
