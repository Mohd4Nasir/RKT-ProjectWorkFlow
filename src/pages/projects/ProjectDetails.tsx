import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NotFound from '../NotFound';
import { useAppDispatch, useAppSelector } from '@/store';
import { projectApiService } from '@/services/projectsApiService';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart3, CheckSquare, FileText, Flag,
  AlertCircle, Users, ArrowLeft, ChevronRight, Home, CalendarDays, Activity,
} from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { fmtDate, isProjectOverdue, projectProgress, statusUi } from './projectUi';

import { ReportsTab } from '../AllTabs/ReportsTab';
import { DocumentsTab } from '../AllTabs/DocumentsTab';
import { MilestonesTab } from '../AllTabs/MilestonesTab';
import { IssuesTab } from '../AllTabs/IssuesTab';
import { UsersTab } from '../AllTabs/UserTab';
import { DashboardTab } from '../AllTabs/DashboardTab';
import { TasksTab } from '../AllTabs/TaskTab';
import { getProjectFromStorage, saveProjectToStorage } from '@/utils/projectStorage';
import { Project } from '@/types/ProejctsType';
import ActivityTab from '../AllTabs/ActivityTab';

type Tab = 'dashboard' | 'tasks' | 'reports' | 'documents' | 'milestones' | 'issues' | 'users' | 'activity';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'milestones', label: 'Milestones', icon: <Flag className="h-3.5 w-3.5" /> },
  { id: 'issues', label: 'Issues', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { id: 'users', label: 'Team', icon: <Users className="h-3.5 w-3.5" /> },
  { id: 'activity', label: 'Activity', icon: <Activity className="h-3.5 w-3.5" /> },
];

const mapStatus = (s: string): 'todo' | 'in-progress' | 'done' => {
  switch (s?.toUpperCase()) {
    case 'IN_PROGRESS': return 'in-progress';
    case 'DONE': return 'done';
    default: return 'todo';
  }
};






export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Active tab lives in the URL (?tab=reports) so refresh / back / shared links keep it
  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab = TABS.some((t) => t.id === tabParam) ? (tabParam as Tab) : 'tasks';
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true });
  const listPath = location.pathname.startsWith('/my-projects') ? '/my-projects' : '/projects';
  const listLabel = listPath === '/my-projects' ? 'My Projects' : 'Projects';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Redux se projects list lo
  const allProjects = useAppSelector(state => state.projects?.items || []);
  // const projectsLoading = useAppSelector(state => state.projects || false);
  
  console.log('🔍 ProjectDetails: ID from URL:', id);
  // console.log('🔍 Location state:', location.state);
  
  // ==========================================
  // ✅ MAIN LOGIC: Load project from multiple sources
  // ==========================================
  useEffect(() => {
    const loadProject = async () => {
      // console.log('📡 Loading project...');
      
      // 1️⃣ Try: Location state se
      let foundProject = location.state?.project;
      // console.log('1️⃣ From location.state:', foundProject ? '✅ Found' : '❌ Not found');
      
      // 2️⃣ Try: SessionStorage se (refresh case)
      if (!foundProject) {
        foundProject = getProjectFromStorage(id);
        // console.log('2️⃣ From sessionStorage:', foundProject ? '✅ Found' : '❌ Not found');
      }
      
      // 3️⃣ Try: Redux list se
      if (!foundProject && allProjects.length > 0) {
        foundProject = allProjects.find((p: Project) => 
          String(p.id || p.projectId) === String(id)
        );
        console.log('3️⃣ From Redux:', foundProject ? '✅ Found' : '❌ Not found');
      }
      
      // 4️⃣ Try: Agar Redux list empty hai toh fetch karo
      if (!foundProject && allProjects.length === 0) {
        console.log('📡 Fetching projects from API...');
        try {
          // ✅ Tumhari project API call
          const projects = await projectApiService.getProjects();
          
          // Redux mein store karo
          // dispatch(setProjects(projects)); // Agar tumhara slice hai
          
          // Ab isme se dhundho
          foundProject = projects.find((p: Project) => 
            String(p.id || p.projectId) === String(id)
          );
          console.log('4️⃣ After API fetch:', foundProject ? '✅ Found' : '❌ Not found');
        } catch (error) {
          console.error('❌ Failed to fetch projects:', error);
        }
      }
      
      // ✅ Agar project mil gaya toh storage mein save karo
      if (foundProject) {
        console.log('✅ Project loaded successfully:', foundProject);
        saveProjectToStorage(foundProject);
        setProject(foundProject);
      } else {
        console.error('❌ Project not found anywhere!');
        toast.error('Project not found');
      }
      
      setLoading(false);
    };
    
    loadProject();
  }, [id, location.state, allProjects, ]);
  
  // ==========================================
  // ✅ Loading State
  // ==========================================
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
  
  // ==========================================
  // ✅ Not Found State
  // ==========================================
  if (!project) {
    return (
      <NotFound
        title="Project not found"
        message="The project you're looking for doesn't exist or has been deleted."
        hideLinks
      />
    );
  }
  
  // ==========================================
  // ✅ Project mil gaya - Render
  // ==========================================
  // Project ID normalize karo (kyuki project.id ya project.projectId ho sakta hai)
  const projectId = project.id || project.projectId;
  const projectTitle: string = project.name || project.projectTitle || 'Untitled Project';
  const st = statusUi(project.projectStatus);
  const overdue = isProjectOverdue(project);
  const pct = projectProgress(project);
  const owners = project.owners ?? [];
  
  return (
    <div className="page-fill">
      {/* Breadcrumb + header */}
      <div className="card-elevated overflow-hidden shrink-0">
        <div className="px-4 pt-2.5 pb-2 space-y-1.5">
          <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(listPath)}
            className="inline-flex items-center gap-1 h-6 pl-1.5 pr-2.5 rounded-md border border-border bg-background text-[11px] font-semibold text-foreground hover:bg-muted transition-colors shrink-0"
            title={`Back to ${listLabel}`}
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <span className="h-4 w-px bg-border" aria-hidden />
          <nav className="flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground">
              <Home className="h-3 w-3" /> Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={listPath} className="hover:text-foreground">{listLabel}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground truncate max-w-[40ch]">{projectTitle}</span>
          </nav>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="h-9 w-9 rounded-lg grid place-items-center text-white bg-primary text-xs font-bold shadow shrink-0">
              {projectTitle.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-base font-bold truncate">{projectTitle}</h1>
                <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border', st.badge)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                  {st.label}
                </span>
                {overdue && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200">
                    Overdue
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <span className="font-mono">{project.code || `PRJ-${String(projectId).padStart(3, '0')}`}</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
                </span>
                {owners.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex -space-x-2">
                      {owners.slice(0, 3).map((o: { ownerId: string | number; ownerName: string }) => (
                        <UserAvatar key={String(o.ownerId)} name={o.ownerName} size="sm" />
                      ))}
                    </span>
                    {owners[0].ownerName}{owners.length > 1 ? ` +${owners.length - 1}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="w-36 hidden sm:block">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>{project.completedTask ?? 0}/{project.totalTask ?? 0} tasks</span>
                  <span className="font-semibold text-foreground">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-3 border-t border-border bg-card overflow-x-auto" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content — each tab is fully self-contained */}
      <div className="fill-area overflow-y-auto scrollbar-thin rounded-xl">
        {tab === 'dashboard' && <DashboardTab project={project} />}
        {tab === 'tasks' && <TasksTab projectId={projectId} project={project} />}
        {tab === 'reports' && <ReportsTab projectId={projectId} />}
        {tab === 'documents' && <DocumentsTab projectId={projectId} />}
        {tab === 'milestones' && <MilestonesTab projectId={projectId} />}
        {tab === 'issues' && <IssuesTab projectId={projectId} />}
        {tab === 'users' && <UsersTab project={project} />}
        {tab === 'activity' && <ActivityTab projectId={projectId} />}
      </div>
    </div>
  );
}