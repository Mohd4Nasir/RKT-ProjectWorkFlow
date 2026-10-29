import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProjectTab } from './ProjectTabs';

interface Props {
  title: string;
  subtitle?: string;
  /** Kept for backwards compatibility — tabs are no longer rendered here. */
  tabs?: ProjectTab[];
  value?: string;
  onChange?: (v: string) => void;
}

export function ProjectsHeader({ title, subtitle }: Props) {
  return (
    <div className="space-y-1.5">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground">
          <Home className="h-3 w-3" /> Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{title.trim()}</span>
      </nav>
      <h1 className="text-2xl font-display font-bold tracking-tight">{title.trim()}</h1>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
