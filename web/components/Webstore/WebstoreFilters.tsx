'use client';

interface Props {
  categories: string[];
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  searchText: string;
  onSearchChange: (text: string) => void;
  availabilityFilter: 'all' | 'buy' | 'contact';
  onAvailabilityChange: (v: 'all' | 'buy' | 'contact') => void;
  totalVisible: number;
  totalAll: number;
}

export function WebstoreFilters({
  categories,
  selectedCategories,
  onToggleCategory,
  searchText,
  onSearchChange,
  availabilityFilter,
  onAvailabilityChange,
  totalVisible,
  totalAll,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Search</label>
        <div className="relative">
          <input
            type="search"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => onToggleCategory(cat)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 group-hover:text-slate-900">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Availability filter */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Availability</label>
        <div className="space-y-2">
          {([['all', 'All Products'], ['buy', 'Buy Now'], ['contact', 'Contact Sales']] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="availability"
                value={val}
                checked={availabilityFilter === val}
                onChange={() => onAvailabilityChange(val)}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Product count */}
      <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
        Showing <strong className="text-slate-700">{totalVisible}</strong> of <strong className="text-slate-700">{totalAll}</strong> products
      </p>
    </div>
  );
}
