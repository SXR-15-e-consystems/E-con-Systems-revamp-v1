import { sanitizeUrl } from '@/lib/security';
import type { OrderTableTabContent } from '@/types/templates';

interface Props {
  data: OrderTableTabContent;
}

export function OrderTableRenderer({ data }: Props) {
  const rows = data.rows ?? [];

  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No samples available.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm border-collapse min-w-[500px]">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-3 px-2 font-bold text-slate-900">Part No</th>
            <th className="text-left py-3 px-2 font-bold text-slate-900">Kit Contents</th>
            <th className="text-left py-3 px-2 font-bold text-slate-900 whitespace-nowrap">
              Sample Price
              <br />
              <span className="text-xs font-normal text-slate-500">(1 Unit)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const safeUrl = sanitizeUrl(row.contact_url);
            return (
              <tr key={`order-row-${ri}`} className="border-b border-slate-100">
                <td className="py-4 px-2 align-top">
                  <span className="text-blue-600 font-medium text-xs break-all leading-snug">
                    {row.part_no}
                  </span>
                </td>
                <td className="py-4 px-2 align-top">
                  <ul className="space-y-1">
                    {row.kit_contents.map((item, ki) => (
                      <li
                        key={`kit-${ri}-${ki}`}
                        className="flex text-sm text-slate-600 leading-snug"
                      >
                        <span className="mr-1.5 flex-shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="py-4 px-2 align-top">
                  <div className="font-bold text-slate-900 text-base mb-2">{row.price}</div>
                  {safeUrl ? (
                    <a
                      href={safeUrl}
                      className="inline-flex items-center gap-1.5 rounded bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-green-700 transition-colors"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                        />
                      </svg>
                      Contact Us
                    </a>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
