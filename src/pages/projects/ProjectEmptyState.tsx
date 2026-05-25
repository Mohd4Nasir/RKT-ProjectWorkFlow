import { ClipboardList } from 'lucide-react';

export function ProjectEmptyState({
  title = 'No projects found',
  description = 'Try adjusting your filters or create a new project.',
}: { title?: string; description?: string }) {
  return (
    <div className="card-elevated p-16 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
