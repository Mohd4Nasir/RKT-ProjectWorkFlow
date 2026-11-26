import { ProjectDocuments } from '@/components/documents/ProjectDocuments';

interface Props { projectId: string; }

export function DocumentsTab({ projectId }: Props) {
  return <ProjectDocuments projectId={projectId} />;
}
