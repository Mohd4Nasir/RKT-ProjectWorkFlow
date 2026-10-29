import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/store';
import { patchProject } from '@/store/slices/projectsSlice';
import { projectApiService } from '@/services/projectsApiService';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BarChart3, CheckSquare, FileText, Flag, AlertCircle, Users } from 'lucide-react';

import { ReportsTab } from '../AllTabs/ReportsTab';
import { DocumentsTab } from '../AllTabs/DocumentsTab';
import { MilestonesTab } from '../AllTabs/MilestonesTab';
import { IssuesTab } from '../AllTabs/IssuesTab';
import { TeamTab,  } from '../AllTabs/TeamTab';
import { DashboardTab } from '../AllTabs/DashboardTab';
import { TasksTab } from '../AllTabs/TaskTab';
import ActivityTab from '../AllTabs/ActivityTab';
import { Project } from '@/types/ProejctsType';
import { getApiErrorMessage, isUnauthorizedApiError } from '@/utils/apiError';
import {
  HeaderChanges, mapStatusOptions, ProjectDetailsHeader, StatusOption,
}  from './ProjectDetailsHeader';
import {getProjectFromStorage} from '@/utils/projectStorage';
type Tab = 'dashboard' | 'tasks' | 'reports' | 'documents' | 'milestones' | 'issues' | 'users' | 'activity';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'milestones', label: 'Milestones', icon: <Flag className="h-3.5 w-3.5" /> },
  { id: 'issues', label: 'Issues', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { id: 'users', label: 'Team', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <AlertCircle className="h-3.5 w-3.5" /> },
];

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
 
  const [tab, setTab] = useState<Tab>('tasks');
  const [details, setDetails] = useState<Project | null>(null); // getProjectDetailsHeader response, as-is
  const [loading, setLoading] = useState(true);
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
 console.log('ProjectDetails: getProjectFromStorage(id):', getProjectFromStorage(id)); // Debugging line
  // status dropdown options
  useEffect(() => {
    let cancelled = false;
    projectApiService
      .getProjectStatuses()
      .then((data: { data: StatusOption[] }) => {
        if (!cancelled) setStatusOptions(mapStatusOptions(data.data));
      })
      .catch((error: unknown) => console.error('Failed to load statuses:', error));
    return () => { cancelled = true; };
  }, []);

  // Only the URL id is used.
  const loadDetails = useCallback(
    async (showLoader = true) => {
      if (!id) return;
      if (showLoader) setLoading(true);
      try {
        const res = await projectApiService.getProjectDetailsHeader(id);
        setDetails(res.data);
      } catch (error) {
        console.error('Failed to load project details:', error);
        if (!isUnauthorizedApiError(error)) {
          toast.error(getApiErrorMessage(error, 'Failed to load project details'));
        }
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    setDetails(null); // no old project flash when id changes
    loadDetails(true);
  }, [loadDetails]);

  const handleUpdate = async (changes: HeaderChanges) => {
    if (!details) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = details as any;
    const projectId = d.projectId ?? id;

    try {
      let patch: Partial<Project>;

      if (changes.status) {
        await projectApiService.updateProjectStatus({ projectId, projectStatus: changes.status });
        patch = { projectStatus: changes.status } as Partial<Project>;
        toast.success('Project status updated');
      } else {
        const projectTitle = changes.title ?? d.projectTitle;
        const projectDescription = changes.description ?? d.projectDescription ?? '';
        const startDate = changes.startDate ?? d.startDate?.slice(0, 10);
        const endDate = changes.endDate ?? d.endDate?.slice(0, 10);

        await projectApiService.updateProject({
          projectId,
          projectTitle,
          projectDescription,
          startDate,
          endDate,
        });
        patch = { projectTitle, projectDescription, startDate, endDate } as Partial<Project>;
        toast.success('Project updated');
      }

      setDetails((prev) => (prev ? { ...prev, ...patch } : prev)); // UI turant update
      dispatch(patchProject({ projectId, ...patch }));             // Redux turant update
      loadDetails(false);                                          // background re-sync
    } catch (error) {
      console.error('Update project error:', error);
      if (!isUnauthorizedApiError(error)) {
        toast.error(getApiErrorMessage(error, 'Failed to update project'));
      }
      throw error; // header edit mode open rahega
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="card-elevated p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-xl">Project not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectId = ((details as any).projectId ?? id) as string;

  return (
    <div className="space-y-5">
      <ProjectDetailsHeader
        project={details}
        statusOptions={statusOptions}
        onBack={() => navigate('/projects')}
        onUpdate={handleUpdate}
      />

      <div className="flex items-center gap-0 px-4 border-b border-border bg-card overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[calc(100vh-160px)]">
        {tab === 'dashboard' && <DashboardTab project={details} />}
        {tab === 'tasks' && <TasksTab projectId={projectId} />}
        {tab === 'reports' && <ReportsTab projectId={projectId} />}
        {tab === 'documents' && <DocumentsTab projectId={projectId} />}
        {tab === 'milestones' && <MilestonesTab projectId={projectId} />}
        {tab === 'issues' && <IssuesTab projectId={projectId} />}
        {tab === 'users' && <TeamTab project={details} />}
        {tab === 'activity' && <ActivityTab projectId={projectId} />}
      </div>
    </div>
  );
}