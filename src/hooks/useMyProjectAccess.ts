import { useEffect, useState } from 'react';
import { getParsedToken } from '@/services/keycloakService';
import { projectApiService } from '@/services/projectsApiService';

/** who am I in this project? (best effort, the backend re-checks every action with 401) */
export interface MyProjectAccess {
  userId: number | null;
  /** upper-cased project role, '' until known */
  role: string;
}

export function useMyProjectAccess(projectId?: number | string): MyProjectAccess {
  const [me, setMe] = useState<MyProjectAccess>({ userId: null, role: '' });
  useEffect(() => {
    if (!projectId) return;
    let live = true;
    const email = (getParsedToken()?.email || '').toLowerCase();
    projectApiService.getExistingMembersInProject(String(projectId))
      .then((r) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any[] = Array.isArray(r?.data) ? r.data : [];
        const mine = list.find((m) => email && String(m?.email || '').toLowerCase() === email);
        if (live && mine) {
          setMe({
            userId: Number(mine.userId ?? mine.id) || null,
            role: String(mine.projectRole ?? mine.role ?? mine.userRole ?? '').toUpperCase(),
          });
        }
      })
      .catch(() => undefined);
    return () => { live = false; };
  }, [projectId]);
  return me;
}

export const isOwner = (role: string) => role.includes('OWNER');
export const isPrivileged = (role: string) => role.includes('OWNER') || role.includes('MANAGER');
export const isObserver = (role: string) => role.includes('OBSERVER');
