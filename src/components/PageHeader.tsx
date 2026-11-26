import { ReactNode } from 'react';
import { Wip } from '@/components/Wip';

interface Props { title: string; subtitle?: string; actions?: ReactNode; /** true, or a hint explaining what is dummy */ wip?: boolean | string; }

export function PageHeader({ title, subtitle, actions, wip }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl md:text-[28px] font-bold tracking-tight text-foreground">
          {title}
          {wip && <Wip hint={typeof wip === 'string' ? wip : undefined} className="ml-2 -translate-y-1 text-[10px]" />}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
