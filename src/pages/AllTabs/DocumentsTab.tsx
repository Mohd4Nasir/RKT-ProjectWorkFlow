import { OwnerDocuments } from '@/components/OwnerDocuments';

interface Props { projectId: string; }

export function DocumentsTab({ projectId }: Props) {
  return <OwnerDocuments ownerType="PROJECT" ownerId={Number(projectId)} subtitle="Project files and attachments" />;
}
