import { cn } from '@/lib/utils';
import { initials, avatarColor } from '@/utils/format';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
export function UserAvatar({ name, size = 'md', className }: Props) {
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' };
  return (
    <div
      className={cn(
        'rounded-full grid place-items-center font-semibold ring-2 ring-card',
        sizes[size],
        avatarColor(name),
        className
      )}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const visible = names.slice(0, max);
  const extra = names.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((n) => (
        <UserAvatar key={n} name={n} size="sm" />
      ))}
      {extra > 0 && (
        <div className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-semibold bg-muted text-muted-foreground ring-2 ring-card">
          +{extra}
        </div>
      )}
    </div>
  );
}
