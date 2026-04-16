import type { ComplianceTableTabContent } from '@/types/templates';

interface Props {
  data: ComplianceTableTabContent;
}

export function ComplianceTableRenderer({ data }: Props) {
  const categories = data.categories ?? [];

  if (categories.length === 0) {
    return <p className="text-sm text-slate-400">No standards information available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-3 px-2 font-bold text-slate-900 w-14">S.No</th>
            <th className="text-left py-3 px-2 font-bold text-slate-900">Certification</th>
            <th className="text-left py-3 px-2 font-bold text-slate-900">Test Specifications</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, ci) => (
            <>{/* Fragment with key on the category header row */}
              {/* Category header row */}
              <tr key={`cat-header-${ci}`} className="bg-slate-50">
                <td
                  colSpan={3}
                  className="py-2.5 px-2 font-bold text-sm text-slate-900 text-center border-b border-slate-200"
                >
                  {category.title}
                </td>
              </tr>
              {/* Data rows */}
              {category.rows.map((row, ri) => (
                <tr key={`cat-${ci}-row-${ri}`} className="border-b border-slate-100">
                  <td className="py-3 px-2 align-top text-slate-500 text-center">{row.sno}</td>
                  <td className="py-3 px-2 align-top text-slate-700 font-medium">{row.certification}</td>
                  <td className="py-3 px-2 align-top text-slate-600 whitespace-pre-line">{row.test_spec}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
