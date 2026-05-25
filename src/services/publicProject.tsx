export interface PublicProject {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  access: 'public' | 'restricted' | 'private';
  createdAt: string;
  status: 'active' | 'in-progress' | 'on-hold' | 'completed' | 'delayed';
  category: string;
  joined?: boolean;
}

export const mockPublicProjects: PublicProject[] = [
  { id: 'PUB-101', name: 'Open Design System', ownerId: 'u2', access: 'public', createdAt: '2025-09-12', status: 'active', category: 'Design' },
  { id: 'PUB-102', name: 'Internal Wiki Refresh', ownerId: 'u4', access: 'restricted', createdAt: '2025-10-01', status: 'in-progress', category: 'Knowledge Base' },
  { id: 'PUB-103', name: 'Hackathon 2026', ownerId: 'u1', access: 'public', createdAt: '2026-01-20', status: 'active', category: 'Event' },
  { id: 'PUB-104', name: 'Public API Docs Portal', ownerId: 'u3', access: 'public', createdAt: '2025-07-04', status: 'completed', category: 'Documentation' },
  { id: 'PUB-105', name: 'Community Plugins', ownerId: 'u7', access: 'public', createdAt: '2025-11-22', status: 'on-hold', category: 'Marketplace' },
  { id: 'PUB-106', name: 'Onboarding Playbook', ownerId: 'u8', access: 'restricted', createdAt: '2026-02-14', status: 'in-progress', category: 'HR' },
  { id: 'PUB-107', name: 'Brand Asset Library', ownerId: 'u2', access: 'public', createdAt: '2025-08-30', status: 'active', category: 'Marketing' },
  { id: 'PUB-108', name: 'Security Whitepaper', ownerId: 'u5', access: 'private', createdAt: '2026-03-05', status: 'delayed', category: 'Security' },
];
