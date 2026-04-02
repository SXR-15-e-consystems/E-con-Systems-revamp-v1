import { useCallback, useMemo } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DimensionInput — reusable width/height control for template config editors.
// Provides preset options (max-content, auto, 100%) and custom units (px, em).
// ─────────────────────────────────────────────────────────────────────────────

type DimensionPreset = 'max-content' | 'auto' | '100%';
type DimensionUnit = 'px' | 'em';
type DimensionMode = DimensionPreset | DimensionUnit;

const PRESET_OPTIONS: { value: DimensionPreset; label: string }[] = [
  { value: 'max-content', label: 'Max Content' },
  { value: 'auto', label: 'Auto' },
  { value: '100%', label: '100%' },
];

const UNIT_OPTIONS: { value: DimensionUnit; label: string }[] = [
  { value: 'px', label: 'px' },
  { value: 'em', label: 'em' },
];

const ALL_MODES: { value: DimensionMode; label: string }[] = [
  ...PRESET_OPTIONS,
  ...UNIT_OPTIONS,
];

function isPreset(value: string): value is DimensionPreset {
  return value === 'max-content' || value === 'auto' || value === '100%';
}

function parseValue(raw: string): { mode: DimensionMode; numericValue: string } {
  const trimmed = (raw ?? '').trim();

  // Check presets first
  if (isPreset(trimmed)) {
    return { mode: trimmed, numericValue: '' };
  }

  // Try to parse numeric + unit
  const match = /^(\d+(?:\.\d+)?)\s*(px|em)$/.exec(trimmed);
  if (match) {
    return { mode: match[2] as DimensionUnit, numericValue: match[1] };
  }

  // Fallback: if it looks like a number with px
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return { mode: 'px', numericValue: trimmed };
  }

  // Default fallback
  return { mode: '100%', numericValue: '' };
}

interface DimensionInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function DimensionInput({ label: inputLabel, value, onChange }: DimensionInputProps) {
  const { mode, numericValue } = useMemo(() => parseValue(value), [value]);

  const isCustom = mode === 'px' || mode === 'em';

  const handleModeChange = useCallback(
    (newMode: string) => {
      const m = newMode as DimensionMode;
      if (isPreset(m)) {
        onChange(m);
      } else {
        // Switching to custom unit — keep existing numeric or default to empty
        const currentNum = numericValue || '';
        onChange(currentNum ? `${currentNum}${m}` : '');
      }
    },
    [onChange, numericValue],
  );

  const handleNumericChange = useCallback(
    (rawNum: string) => {
      const sanitized = rawNum.replace(/[^0-9.]/g, '');
      if (sanitized) {
        onChange(`${sanitized}${mode}`);
      } else {
        onChange('');
      }
    },
    [onChange, mode],
  );

  return (
    <div>
      <span className="block text-xs font-semibold text-gray-600 mb-1">{inputLabel}</span>
      <div className="flex gap-1.5">
        <select
          className="rounded border border-gray-300 px-2 py-2 text-sm flex-shrink-0"
          value={mode}
          onChange={(e) => handleModeChange(e.target.value)}
        >
          {ALL_MODES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {isCustom && (
          <input
            type="text"
            inputMode="decimal"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder={`e.g. 600`}
            value={numericValue}
            onChange={(e) => handleNumericChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
}
