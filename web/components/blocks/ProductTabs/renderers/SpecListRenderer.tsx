import { sanitizeHtml } from '@/lib/security';
import type { SpecListTabContent } from '@/types/templates';

interface Props {
  data: SpecListTabContent;
}

export function SpecListRenderer({ data }: Props) {
  const sections = data.sections ?? [];
  const html = data.html ?? '';
  const safeHtml = html ? sanitizeHtml(html) : '';

  if (sections.length === 0 && !safeHtml) {
    return <p className="text-sm text-slate-400">No specifications available.</p>;
  }

  return (
    <div className="space-y-6">
      {/* HTML content with green tick list style */}
      {safeHtml && (
        <div
          className="prose prose-sm max-w-none text-slate-700
            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700
            [&_a]:text-blue-600 [&_a]:underline [&_a]:text-sm
            [&_ul]:list-none [&_ul]:pl-0 [&_ul]:space-y-1.5
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-sm
            [&_ul>li:not(.nobullet)]:relative [&_ul>li:not(.nobullet)]:pl-6 [&_ul>li:not(.nobullet)]:text-sm [&_ul>li:not(.nobullet)]:leading-relaxed [&_ul>li:not(.nobullet)]:text-slate-700
            [&_ul>li:not(.nobullet)]:before:content-['\2713'] [&_ul>li:not(.nobullet)]:before:absolute [&_ul>li:not(.nobullet)]:before:left-0
            [&_ul>li:not(.nobullet)]:before:text-green-600 [&_ul>li:not(.nobullet)]:before:font-bold
            prose-headings:text-slate-900 prose-headings:font-bold
            prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      )}

      {/* Structured spec sections with green ticks */}
      {sections.map((section, si) => (
        <div key={`spec-section-${si}`}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{section.title}</h3>
          <ul className="space-y-1.5">
            {section.items.map((item, ii) => (
              <li key={`spec-item-${si}-${ii}`} className="flex text-sm leading-relaxed">
                <span className="text-green-600 mr-2 flex-shrink-0 font-bold">✓</span>
                {item.label ? (
                  <span>
                    <span className="font-medium text-slate-700">{item.label}:</span>{' '}
                    <span className="text-slate-600">{item.value}</span>
                  </span>
                ) : (
                  <span className="text-slate-600">{item.value}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
