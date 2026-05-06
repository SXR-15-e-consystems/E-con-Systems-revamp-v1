'use client';

import Image from 'next/image';
import Link from 'next/link';

import { sanitizeUrl } from '@/lib/security';
import type {
  EvaluationSectionData,
  EvaluationSectionMeta,
  EvaluationSectionContent,
  EvaluationItem,
} from '@/types/templates';

// ─────────────────────────────────────────────────────────────────────────────
// L3: Public renderer — EvaluationSectionBlock
// "Evaluate [Product] with," heading + horizontal product cards
// ─────────────────────────────────────────────────────────────────────────────

interface EvaluationSectionBlockProps {
  data: Record<string, unknown>;
}

const DEFAULT_META: EvaluationSectionMeta = {
  bgColor: '#f3f4f6',
  headingColor: '#1f2937',
  nameColor: '#1f2937',
  badgeBgColor: '#059f46',
  badgeTextColor: '#ffffff',
  cardBgColor: '#f3f4f6',
  cardWidth: '180px',
  cardGap: '24px',
  headingSize: '1.125rem',
  nameSize: '0.875rem',
  imageHeight: '128px',
  sectionPadding: '32px 0',
};

function EvalCard({
  item,
  meta,
}: {
  item: EvaluationItem;
  meta: EvaluationSectionMeta;
}) {
  const href = sanitizeUrl(item.link);

  return (
    <Link
      href={href}
      className="group relative flex flex-col items-center rounded-lg p-4 transition hover:shadow-md es-eval-card"
      style={{ '--card-w': meta.cardWidth, backgroundColor: meta.cardBgColor } as React.CSSProperties}
    >
      {item.badge && (
        <span
          className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight whitespace-nowrap"
          style={{
            backgroundColor: meta.badgeBgColor,
            color: meta.badgeTextColor,
          }}
        >
          {item.badge}
        </span>
      )}

      <div
        className="relative mb-3 w-full"
        style={{ height: meta.imageHeight }}
      >
        <Image
          src={item.image_url}
          alt={item.image_alt}
          fill
          className="object-contain"
          sizes="180px"
        />
      </div>

      <span
        className="text-center font-semibold leading-snug group-hover:underline"
        style={{ color: meta.nameColor, fontSize: meta.nameSize }}
      >
        {item.name}
      </span>
    </Link>
  );
}

export function EvaluationSectionBlock({ data }: EvaluationSectionBlockProps) {
  const typed = data as unknown as EvaluationSectionData;
  const meta: EvaluationSectionMeta = { ...DEFAULT_META, ...typed.meta };
  const content: EvaluationSectionContent = {
    heading: typed.content?.heading ?? '',
    items: typed.content?.items ?? [],
  };

  if (content.items.length === 0) return null;

  return (
    <section
      className="w-full"
      style={{ backgroundColor: meta.bgColor, padding: meta.sectionPadding }}
    >
      <style>{`
        .es-eval-card {
          width: 100%;
          min-width: 0;
        }
        @media (min-width: 480px) {
          .es-eval-card {
            width: calc(50% - ${meta.cardGap});
          }
        }
        @media (min-width: 768px) {
          .es-eval-card {
            width: var(--card-w);
            min-width: var(--card-w);
          }
        }
      `}</style>
      {content.heading && (
        <h3
          className="mb-5 font-bold"
          style={{ color: meta.headingColor, fontSize: meta.headingSize }}
        >
          {content.heading}
        </h3>
      )}

      <div
        className="flex flex-wrap"
        style={{ gap: meta.cardGap }}
      >
        {content.items.map((item, idx) => (
          <EvalCard key={`${item.name}-${idx}`} item={item} meta={meta} />
        ))}
      </div>
    </section>
  );
}
