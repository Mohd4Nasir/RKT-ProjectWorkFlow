// components/ui/ContextMenu.tsx
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  shortcut?: string;
  dividerAbove?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't go off screen
  const adjustedX = Math.min(x, window.innerWidth  - 240);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: adjustedY, left: adjustedX, zIndex: 9999 }}
      className="w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 overflow-hidden"
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.dividerAbove && (
            <div className="h-px bg-slate-100 my-1" />
          )}
          <button
            onClick={() => { item.onClick(); onClose(); }}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2 text-[13px] hover:bg-slate-50 transition-colors text-left',
              item.variant === 'danger' ? 'text-danger hover:bg-red-50' : 'text-heading'
            )}
          >
            <span className="flex items-center gap-2.5">
              {item.icon && (
                <span className={cn('flex-shrink-0', item.variant === 'danger' ? 'text-danger' : 'text-muted-foreground')}>
                  {item.icon}
                </span>
              )}
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                {item.shortcut}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}