import { cn } from '@/lib/utils';

export interface ProjectTab { id: string; label: string; }

interface Props {
  tabs: ProjectTab[];
  value: string;
  onChange: (v: string) => void;
}

export function ProjectTabs({ tabs, value, onChange }: Props) {
  return (
    <div className="flex items-center gap-6 -mb-px">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'pb-3 text-sm font-semibold transition-colors border-b-2',
            value === t.id
              ? 'text-primary border-primary'
              : 'text-muted-foreground border-transparent hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
