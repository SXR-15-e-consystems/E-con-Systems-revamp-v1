// ─────────────────────────────────────────────────────────────────────────────
// DimensionInput — reusable width/height control for template config editors.
// Free-text input accepting any valid CSS value (100%, 10px, 2em, 1rem,
// auto, max-content, calc(...), etc.) with quick-pick preset buttons.
// ─────────────────────────────────────────────────────────────────────────────

const PRESETS = ['auto', 'max-content', '100%', '50%'] as const;

interface DimensionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DimensionInput({ label: inputLabel, value, onChange }: DimensionInputProps) {
  return (
    <div>
      <span className="block text-xs font-semibold text-gray-600 mb-1">{inputLabel}</span>
      <input
        type="text"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        placeholder="e.g. 100%, 600px, 2rem, auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex flex-wrap gap-1 mt-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
              value === preset
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-400'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
