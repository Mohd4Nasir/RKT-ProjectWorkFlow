import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ProjectStatus } from '@/types';
import { cn } from '@/lib/utils';

const map: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
  active:        { bg: 'bg-success',      text: 'text-success-foreground',  label: 'Active' },
  'on-hold':     { bg: 'bg-warning',      text: 'text-warning-foreground',  label: 'On Hold' },
  'in-progress': { bg: 'bg-info',         text: 'text-info-foreground',     label: 'In Progress' },
  delayed:       { bg: 'bg-danger',       text: 'text-danger-foreground',   label: 'Delayed' },
  completed:     { bg: 'bg-primary',      text: 'text-primary-foreground',  label: 'Completed' },
};

export function ProjectStatusPill({ status, className }: { status: ProjectStatus; className?: string }) {
  const s = map[status] || map.active;
  return (
    <span className={cn('inline-flex items-center justify-center px-2.5 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap', s.bg, s.text, className)}>
      {s.label}
    </span>
  );
}

export function StatusSelectCell({
  value,
  onChange,
}: {
  value: ProjectStatus;
  onChange: (v: ProjectStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ProjectStatus)}>
      <SelectTrigger className="h-8 px-2 border-transparent bg-transparent hover:bg-muted/50 focus:ring-1 focus:ring-primary/30 [&>svg]:opacity-40 [&>svg]:ml-1">
        <ProjectStatusPill status={value} />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(map) as ProjectStatus[]).map((k) => (
          <SelectItem key={k} value={k}>
            <ProjectStatusPill status={k} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
