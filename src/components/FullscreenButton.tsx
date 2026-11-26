import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Pseudo-fullscreen (fills the viewport, Esc exits). Apply FULLSCREEN_CLASS to the wrapper while `on`. */
export function useFullscreen() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOn(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [on]);

  return { on, toggle: () => setOn((v) => !v) };
}

export const FULLSCREEN_CLASS = 'fixed inset-0 z-50 bg-background p-3 sm:p-4 flex flex-col';

export function FullscreenButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const Icon = on ? Minimize2 : Maximize2;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggle}
      title={on ? 'Exit full screen (Esc)' : 'Full screen'}
      className="h-8 gap-1.5 text-xs"
    >
      <Icon className="h-3.5 w-3.5" />
      {on ? 'Exit full screen' : 'Full screen'}
    </Button>
  );
}
