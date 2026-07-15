// import { useEffect, useState } from 'react';
// import { useLocation, useNavigate, useParams } from 'react-router-dom';
// import { useAppDispatch, useAppSelector } from '@/store';
// import { projectApiService } from '@/services/projectsApiService';
// import { setTaskLists } from '@/store/slices/taskListsSlice';
// import { setTasks } from '@/store/slices/tasksSlice';
// import { ReduxTask } from '@/store/slices/tasksSlice';
// import { ReduxTaskList } from '@/store/slices/taskListsSlice';
// import { Button } from '@/components/ui/button';
// import { cn } from '@/lib/utils';
// import { toast } from 'sonner';
// import { format } from 'date-fns';
// import {
//   BarChart3, CheckSquare, FileText, Flag,
//   AlertCircle, Users, ArrowUpRight, MoreHorizontal,
// } from 'lucide-react';

// import { ReportsTab } from '../projectTabs/ReportsTab';
// import { DocumentsTab } from '../projectTabs/DocumentsTab';
// import { MilestonesTab } from '../projectTabs/MilestonesTab';
// import { IssuesTab } from '../projectTabs/IssuesTab';
// import { UsersTab } from '../projectTabs/UserTab';
// import { DashboardTab } from '../projectTabs/DashboardTab';
// import { TasksTab } from '../projectTabs/TaskTab';

// type Tab = 'dashboard' | 'tasks' | 'reports' | 'documents' | 'milestones' | 'issues' | 'users';

// const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
//   { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-3.5 w-3.5" /> },
//   { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
//   { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-3.5 w-3.5" /> },
//   { id: 'documents', label: 'Documents', icon: <FileText className="h-3.5 w-3.5" /> },
//   { id: 'milestones', label: 'Milestones', icon: <Flag className="h-3.5 w-3.5" /> },
//   { id: 'issues', label: 'Issues', icon: <AlertCircle className="h-3.5 w-3.5" /> },
//   { id: 'users', label: 'Users', icon: <Users className="h-3.5 w-3.5" /> },
// ];

// const mapStatus = (s: string): 'todo' | 'in-progress' | 'done' => {
//   switch (s?.toUpperCase()) {
//     case 'IN_PROGRESS': return 'in-progress';
//     case 'DONE': return 'done';
//     default: return 'todo';
//   }
// };

// export default function ProjectDetails() {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const dispatch = useAppDispatch();
//   const location = useLocation();
//   const [tab, setTab] = useState<Tab>('tasks');
//   const project = location.state?.project;
//   console.log('ProjectDetails: project from state:', project);
//   // const project = useAppSelector(s => s.projects.items.find(p => p.id === id))

  
//   // ── Guards ─────────────────────────────────────────────────────────────────
//   // if (loading) return (
//   //   <div className="flex items-center justify-center min-h-[400px]">
//   //     <div className="text-center">
//   //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
//   //       <p className="mt-4 text-sm text-muted-foreground">Loading project...</p>
//   //     </div>
//   //   </div>
//   // );

//   if (!project) return (
//     <div className="card-elevated p-12 text-center">
//       <p className="font-semibold">Project not found</p>
//       <Button variant="outline" className="mt-3" onClick={() => navigate('/projects')}>
//         Back to Projects
//       </Button>
//     </div>
//   );

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card rounded-t-2xl">
//         <span
//           className="h-7 w-7 rounded-lg grid place-items-center text-white text-xs font-bold flex-shrink-0"
//           style={{ background: project.color }}
//         >
//           {project.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
//         </span>
//         <div className="flex items-center gap-2 min-w-0">
//           <span className="text-xs font-mono text-muted-foreground font-semibold">
//             {`KI-${100 + (parseInt(project.id.replace(/\D/g, ''), 10) || 1) * 7}`}
//           </span>
//           <h2 className="font-bold text-base truncate">{project.name}</h2>
//         </div>
//         <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
//           <Button variant="ghost" size="sm" className="text-xs font-semibold" onClick={() => navigate('/projects')}>
//             Back to Projects <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
//           </Button>
//           <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
//             <MoreHorizontal className="h-4 w-4" />
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex items-center gap-0 px-4 border-b border-border bg-card overflow-x-auto">
//         {TABS.map(t => (
//           <button
//             key={t.id}
//             onClick={() => setTab(t.id)}
//             className={cn(
//               'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
//               tab === t.id
//                 ? 'border-[#E07B39] text-[#E07B39]'
//                 : 'border-transparent text-muted-foreground hover:text-foreground',
//             )}
//           >
//             {t.icon}{t.label}
//           </button>
//         ))}
//       </div>

//       {/* Tab content — each tab is fully self-contained */}
//       <div className="min-h-[calc(100vh-160px)]">
//         {tab === 'dashboard' && <DashboardTab project={project} />}
//         {tab === 'tasks' && <TasksTab projectId={project.id} />}
//         {tab === 'reports' && <ReportsTab projectId={project.id} />}
//         {tab === 'documents' && <DocumentsTab projectId={project.id} />}
//         {tab === 'milestones' && <MilestonesTab projectId={project.projectId} />}
//         {tab === 'issues' && <IssuesTab projectId={project.id} />}
//         {tab === 'users' && <UsersTab project={project} />}
//       </div>
//     </div>
//   );
// }













import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { projectApiService } from '@/services/projectsApiService';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart3, CheckSquare, FileText, Flag,
  AlertCircle, Users, ArrowUpRight, MoreHorizontal,
} from 'lucide-react';

import { ReportsTab } from '../projectTabs/ReportsTab';
import { DocumentsTab } from '../projectTabs/DocumentsTab';
import { MilestonesTab } from '../projectTabs/MilestonesTab';
import { IssuesTab } from '../projectTabs/IssuesTab';
import { UsersTab } from '../projectTabs/UserTab';
import { DashboardTab } from '../projectTabs/DashboardTab';
import { TasksTab } from '../projectTabs/TaskTab';
import { getProjectFromStorage, saveProjectToStorage } from '@/utils/projectStorage';
import { Project } from '@/types/ProejctAndTask';

type Tab = 'dashboard' | 'tasks' | 'reports' | 'documents' | 'milestones' | 'issues' | 'users';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'milestones', label: 'Milestones', icon: <Flag className="h-3.5 w-3.5" /> },
  { id: 'issues', label: 'Issues', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  { id: 'users', label: 'Team', icon: <Users className="h-3.5 w-3.5" /> },
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
  const [tab, setTab] = useState<Tab>('tasks');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Redux se projects list lo
  const allProjects = useAppSelector(state => state.projects?.items || []);
  // const projectsLoading = useAppSelector(state => state.projects || false);
  
  console.log('🔍 ProjectDetails: ID from URL:', id);
  console.log('🔍 Location state:', location.state);
  
  // ==========================================
  // ✅ MAIN LOGIC: Load project from multiple sources
  // ==========================================
  useEffect(() => {
    const loadProject = async () => {
      console.log('📡 Loading project...');
      
      // 1️⃣ Try: Location state se
      let foundProject = location.state?.project;
      console.log('1️⃣ From location.state:', foundProject ? '✅ Found' : '❌ Not found');
      
      // 2️⃣ Try: SessionStorage se (refresh case)
      if (!foundProject) {
        foundProject = getProjectFromStorage(id);
        console.log('2️⃣ From sessionStorage:', foundProject ? '✅ Found' : '❌ Not found');
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
      <div className="card-elevated p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-semibold text-xl">Project not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }
  
  // ==========================================
  // ✅ Project mil gaya - Render
  // ==========================================
  // Project ID normalize karo (kyuki project.id ya project.projectId ho sakta hai)
  const projectId = project.id || project.projectId;
  
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card rounded-t-2xl">
        <span
          className="h-7 w-7 rounded-lg grid place-items-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: project.color || '#E07B39' }}
        >
          {(project.name || project.projectTitle || 'P')
            .split(' ')
            .map((w: string) => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-muted-foreground font-semibold">
            {project.code || `PRJ-${String(projectId).padStart(3, '0')}`}
          </span>
          <h2 className="font-bold text-base truncate">
            {project.name || project.projectTitle || 'Untitled Project'}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-semibold" 
            onClick={() => navigate('/projects')}
          >
            Back to Projects <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 px-4 border-b border-border bg-card overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
              tab === t.id
                ? 'border-[#d9376e] text-[#d9376e]'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content — each tab is fully self-contained */}
      <div className="min-h-[calc(100vh-160px)]">
        {tab === 'dashboard' && <DashboardTab project={project} />}
        {tab === 'tasks' && <TasksTab projectId={projectId} />}
        {tab === 'reports' && <ReportsTab projectId={projectId} />}
        {tab === 'documents' && <DocumentsTab projectId={projectId} />}
        {tab === 'milestones' && <MilestonesTab projectId={projectId} />}
        {tab === 'issues' && <IssuesTab projectId={projectId} />}
        {tab === 'users' && <UsersTab project={project} />}
      </div>
    </div>
  );
}