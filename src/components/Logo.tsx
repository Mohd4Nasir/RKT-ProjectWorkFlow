import { cn } from '@/lib/utils';

/** WorkSphere mark — same artwork as /favicon.svg */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9', className)} role="img" aria-label="WorkSphere">
      <defs>
        <linearGradient id="ws-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#001858" />
          <stop offset="1" stopColor="#3a4cbe" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#ws-logo-g)" />
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <circle cx="32" cy="32" r="16" strokeWidth="3.5" />
        <ellipse cx="32" cy="32" rx="7" ry="16" strokeWidth="2.5" />
        <line x1="16" y1="32" x2="48" y2="32" strokeWidth="2.5" />
      </g>
      <circle cx="47" cy="17" r="8" fill="#0a2478" />
      <circle cx="47" cy="17" r="6" fill="#ff4d8d" />
    </svg>
  );
}
