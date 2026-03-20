'use client';

import { useEffect, useRef } from 'react';

import { FormBlock } from '@/components/TemplatesComps/Form/FormBlock';
import { useModal } from '@/hooks/useModal';
import type { CTAButtonData, CTAButtonMeta, CTAButtonPosition, FormData, FormMeta } from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — CTAButtonBlock
// Renders a button that opens the configured form type in a modal overlay.
// The FormBlock is fully autonomous inside the modal — no tight coupling.
// ─────────────────────────────────────────────────────────────────────────────

interface CTAButtonBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: CTAButtonMeta = {
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
};

// ── Form Modal ────────────────────────────────────────────────────────────────

function FormModal({
  formData,
  onClose,
}: {
  formData: Record<string, unknown>;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Contact form"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* FormBlock renders itself — fully self-contained */}
        <FormBlock data={formData} />
      </div>
    </div>
  );
}

// ── Position classes ──────────────────────────────────────────────────────────

function positionClass(position: CTAButtonPosition): string {
  const map: Record<CTAButtonPosition, string> = {
    inline: '',
    'fixed-bottom-right': 'fixed bottom-6 right-6 z-40',
    'fixed-bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
  };
  return map[position] ?? '';
}

// ── Main component ────────────────────────────────────────────────────────────

export function CTAButtonBlock({ data }: CTAButtonBlockProps) {
  const parsed = data as unknown as CTAButtonData;
  const meta: CTAButtonMeta = { ...DEFAULT_META, ...parsed.meta };
  const label = parsed.content?.label ?? 'Contact Us';

  const { isOpen, open, close } = useModal();

  // Build the FormBlock data envelope based on the formType in meta.
  // The formBlock data only needs meta.formType and default content —
  // the FormBlock component handles everything else.
  const formBlockData: FormData = {
    meta: {
      formType: meta.formType,
      recaptchaSiteKey: '',   // Consumers should configure via their own FormBlock block
      tcLink: '/terms',
      bgColor: '#ffffff',
      width: '100%',
      submitLabel:
        meta.formType === 'registration'
          ? 'Register Now'
          : meta.formType === 'get-quote'
          ? 'Get a Quote'
          : 'Send Message',
    } satisfies FormMeta,
    content: {
      successMessage: 'Thank you! We will be in touch shortly.',
      errorMessage: 'Something went wrong. Please try again.',
    },
  };

  return (
    <>
      <div className={positionClass(meta.position)} style={{ width: meta.width }}>
        <button
          type="button"
          onClick={open}
          style={{
            backgroundColor: meta.style.bgColor,
            color: meta.style.textColor,
            borderRadius: meta.style.borderRadius,
            fontSize: meta.style.fontSize,
            padding: meta.style.padding,
          }}
          className="font-semibold shadow transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          {label}
        </button>
      </div>

      {isOpen && (
        <FormModal
          formData={formBlockData as unknown as Record<string, unknown>}
          onClose={close}
        />
      )}
    </>
  );
}
