import { cn } from '@/lib/utils';

type IconType = React.ComponentType<{ className?: string }>;

/** Titled content card used across dashboard / report style pages. */
export function SectionCard({
  title, subtitle, icon: Icon, action, children, className, flush,
}: {
  title: string;
  subtitle?: string;
  icon?: IconType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn('card-elevated', className)}>
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <span className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="font-display font-bold text-[15px] truncate">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={flush ? 'pb-1' : 'px-5 pb-5'}>{children}</div>
    </section>
  );
}

export function EmptyBlock({ icon: Icon, text }: { icon: IconType; text: string }) {
  return (
    <div className="py-10 px-4 text-center">
      <span className="mx-auto mb-3 h-11 w-11 rounded-xl bg-muted grid place-items-center text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">{text}</p>
    </div>
  );
}

export function SkeletonBlock({ h }: { h: number }) {
  return <div className="rounded-lg bg-muted animate-pulse" style={{ height: h }} />;
}
