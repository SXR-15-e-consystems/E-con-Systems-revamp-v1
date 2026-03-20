import type { BlockType } from '../../types';
import type { TrayComponentDef } from '../canvas/ComponentTray';
import { TRAY_COMPONENTS } from '../canvas/ComponentTray';

interface PlaceholderOverlayProps {
  type: BlockType;
  label?: string;
  isFilled: boolean;
  onEdit: () => void;
}

export function PlaceholderOverlay({ type, label, isFilled, onEdit }: PlaceholderOverlayProps) {
  const def: TrayComponentDef | undefined = TRAY_COMPONENTS.find(
    (c) => c.type === type,
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className={`
        group relative flex h-full min-h-[140px] w-full cursor-pointer flex-col items-center justify-center
        rounded-xl border-2 transition-all duration-200
        ${isFilled
          ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md'
          : 'border-dashed border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md'
        }
      `}
    >
      {/* Icon & Label */}
      <div className="flex flex-col items-center text-center transition-transform group-hover:-translate-y-1">
        <span className="mb-2 text-3xl opacity-80 transition-opacity group-hover:opacity-100">
          {isFilled ? '✅' : (def?.icon ?? '📦')}
        </span>
        <h3 className={`text-sm font-bold ${isFilled ? 'text-emerald-700' : 'text-slate-700'}`}>
          {label || def?.label || type}
        </h3>
        <p className={`mt-1 max-w-[200px] text-xs leading-tight ${isFilled ? 'text-emerald-600/70' : 'text-slate-500'}`}>
          {isFilled ? 'Content added. Click to edit.' : (def?.description ?? 'Click to add content')}
        </p>
      </div>

      {/* Floating Action Button */}
      <div
        className={`
          absolute shadow-lg transition-all duration-200
          flex h-10 w-10 items-center justify-center rounded-full text-white
          ${isFilled
            ? 'top-4 right-4 bg-slate-800 opacity-0 group-hover:opacity-100 hover:bg-slate-700 hover:scale-110'
            : 'bottom-4 bg-blue-600 hover:bg-blue-500 hover:scale-110 group-hover:-translate-y-2'
          }
        `}
      >
        {isFilled ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ) : (
          <span className="text-xl leading-none mb-0.5">+</span>
        )}
      </div>

      {/* Required badge */}
      {!isFilled && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Required
        </div>
      )}
    </div>
  );
}
