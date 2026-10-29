import { FolderOpen } from 'lucide-react';

export function ProjectEmptyState({
  title = 'No projects found',
  description = 'Try adjusting your filters or create a new project.',
}: { title?: string; description?: string }) {
  return (
    <div className="card-elevated py-16 px-6 text-center">
      <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center">
        <FolderOpen className="h-7 w-7" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
