import type {
  TimerData,
  TimerLayout,
  TimerMeta,
  TimerPosition,
} from '../../../types/templates';
import type { BlockEditorProps } from '../../blocks/BlockEditorRegistry';

// ─────────────────────────────────────────────────────────────────────────────
// L1: Template Config — layout, position, style only
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_META: TimerMeta = {
  layout: 'bar',
  position: 'bottom',
  visible: true,
  bgColor: '#1a1a1a',
  textColor: '#ffffff',
  width: '380px',
};

const BAR_POSITIONS: TimerPosition[] = ['top', 'bottom'];
const POPUP_POSITIONS: TimerPosition[] = ['bottom-left', 'bottom-right'];

export function TimerTemplateConfig({ block, onChange }: BlockEditorProps) {
  const data = block.data as unknown as TimerData;
  const meta: TimerMeta = { ...DEFAULT_META, ...data.meta };

  function updateMeta(patch: Partial<TimerMeta>) {
    onChange({ ...data, meta: { ...meta, ...patch } });
  }

  const positions = meta.layout === 'bar' ? BAR_POSITIONS : POPUP_POSITIONS;

  return (
    <div className="space-y-5 p-4">
      <p className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 rounded px-3 py-2">
        Template layer — configure layout &amp; position only.
      </p>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Layout</legend>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Display type</span>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.layout}
            onChange={(e) => {
              const layout = e.target.value as TimerLayout;
              const defaultPos = layout === 'bar' ? 'bottom' : 'bottom-right';
              updateMeta({ layout, position: defaultPos as TimerPosition });
            }}
          >
            <option value="bar">Bar — full width (top or bottom)</option>
            <option value="popup">Popup card (bottom-left or bottom-right)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-gray-600">Position</span>
          <select
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            value={meta.position}
            onChange={(e) => updateMeta({ position: e.target.value as TimerPosition })}
          >
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        {meta.layout === 'popup' && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Popup width</span>
            <input
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              value={meta.width}
              onChange={(e) => updateMeta({ width: e.target.value })}
              placeholder="380px"
            />
          </label>
        )}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={meta.visible}
            onChange={(e) => updateMeta({ visible: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm">Visible by default</span>
        </label>
      </fieldset>

      <fieldset className="border border-gray-200 rounded p-3 space-y-3">
        <legend className="text-xs font-bold text-gray-700 px-1">Colours</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.bgColor}
                onChange={(e) => updateMeta({ bgColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.bgColor}
                onChange={(e) => updateMeta({ bgColor: e.target.value })}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">Text</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={meta.textColor}
                onChange={(e) => updateMeta({ textColor: e.target.value })}
                className="h-8 w-12 cursor-pointer rounded border"
              />
              <input
                className="flex-1 rounded border border-gray-300 px-2 py-2 text-xs"
                value={meta.textColor}
                onChange={(e) => updateMeta({ textColor: e.target.value })}
              />
            </div>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
