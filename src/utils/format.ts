import { User } from '@/types/ProejctsType';

export function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

export function avatarColor(seed: string) {
  const colors = [
    'bg-primary text-primary-foreground',
    'bg-success text-success-foreground',
    'bg-warning text-warning-foreground',
    'bg-info text-info-foreground',
    'bg-danger text-danger-foreground',
    'bg-primary-hover text-primary-foreground',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export function userById(users: User[], id: string) { return users.find((u) => u.id === id); }

export function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relativeTime(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
