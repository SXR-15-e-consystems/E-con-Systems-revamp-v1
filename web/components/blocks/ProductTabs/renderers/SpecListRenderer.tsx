import type { SpecListTabContent } from '@/types/templates';

interface Props {
  data: SpecListTabContent;
}

export function SpecListRenderer({ data }: Props) {
  const sections = data.sections ?? [];

  if (sections.length === 0) {
    return <p className="text-sm text-slate-400">No specifications available.</p>;
  }

  return (
    <div className="space-y-6">
      {sections.map((section, si) => (
        <div key={`spec-section-${si}`}>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{section.title}</h3>
          <ul className="space-y-1.5">
            {section.items.map((item, ii) => (
              <li key={`spec-item-${si}-${ii}`} className="flex text-sm leading-relaxed">
                <span className="text-slate-500 mr-1.5 flex-shrink-0">•</span>
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
