import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { addProject, deleteProject, setProjects, updateProject } from '@/store/slices/projectsSlice';
import { Project } from '@/types/ProejctsType';
import { toast } from 'sonner';

import { ProjectsHeader } from './ProjectsHeader';
import { ProjectsToolbar } from './ProjectsToolbar';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectEmptyState } from './ProjectEmptyState';
import { ProjectPagination } from './ProjectPagination';
import { ProjectDialog } from './ProjectDialog';
import { ProjectsFilterDrawer, FilterField } from './ProjectsFilterDrawer';
import { ProjectStatsMap } from './ProjectStats';
import { useFilterState, useProjectsFilter } from './hooks/useProjectsFilter';
import { projectApiService } from '@/services/projectsApiService';
import { saveProjectToStorage } from '@/utils/projectStorage';

// interface Props { mine?: boolean; }

export default function Projects() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allProjects = useAppSelector((s) => s.projects.items);
  const allTasks = useAppSelector((s) => s.tasks.lists);
  const users = useAppSelector((s) => s.users.items);
  const me = useAppSelector((s) => s.auth.user!);

  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = useFilterState();

  // const baseProjects = mine
  //   ? allProjects.filter((p) => p.members?.includes(String(me.id)))
  //   : allProjects;

    
  const tabFiltered = useMemo(
    () => allProjects.filter((p) => p.projectStatus !== 'COMPLETED'),
    [allProjects],
  );

  const userOptions = useMemo(() => users.map((u) => ({ label: u.name, value: String(u.id) })), [users]);
  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'Delayed', value: 'delayed' },
    { label: 'Completed', value: 'COMPLETED' },
  ];

  const filterFields: FilterField[] = useMemo(() => [
    { id: 'name', label: 'Project Name', type: 'text' },
    { id: 'owner', label: 'Owner', type: 'select', options: userOptions },
    { id: 'createdTime', label: 'Created Time', type: 'date' },
    { id: 'createdBy', label: 'Created By', type: 'select', options: userOptions },
    { id: 'startDate', label: 'Start Date', type: 'date' },
    { id: 'endDate', label: 'End Date', type: 'date' },
    { id: 'lastModifiedBy', label: 'Last Modified By', type: 'select', options: userOptions },
    { id: 'lastModifiedTime', label: 'Last Modified Time', type: 'date' },
    { id: 'completionTime', label: 'Completion Time', type: 'date' },
    { id: 'projectGroup', label: 'Project Group', type: 'text' },
    { id: 'status', label: 'Status', type: 'select', options: statusOptions },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [userOptions]);

  const filteredActive = useProjectsFilter({
    items: tabFiltered,
    query,
    filters: filters.values,
    searchOf: (p) => p.projectTitle,
    predicates: (p, f) => {
      const preds: boolean[] = [];
      if (f.name) preds.push(p.projectTitle.toLowerCase().includes(f.name.toLowerCase()));
      // Owner filter checks against ANY of the project's owners.
      if (f.owner) preds.push((p.owners ?? []).some((o) => String(o.ownerId) === String(f.owner)));
      if (f.status) preds.push(p.projectStatus === f.status);
      if (f.startDate) preds.push(p.startDate?.slice(0, 10) === f.startDate);
      if (f.endDate) preds.push(p.endDate?.slice(0, 10) === f.endDate);
      return preds;
    },
  });

  const stats: ProjectStatsMap = useMemo(() => {
    const map: ProjectStatsMap = {};
    for (const p of allProjects) {
      // Keyed by projectId — this MUST match what ProjectsTable looks up
      // (stats[row.original.projectId]), not the internal `p.id` string.
      const ts = allTasks.filter((t) => t.listId === p.id);
      const total = ts.length;
      const done = ts.filter((t) => t.titleStatus === 'done').length;
      const pct = total ? Math.round((done / total) * 100) : (p.progress ?? 0);
      const idStr = String(p.projectId ?? '');
      const seed = idStr ? idStr.charCodeAt(idStr.length - 1) : 1;
      const milestones = (seed % 6);
      const mDone = Math.min(milestones, Math.floor((pct / 100) * milestones));
      const issues = total > 0 ? (seed % 4) : 0;
      map[p.projectId] = { total, done, pct, milestones, mDone, issues };
    }
    return map;
  }, [allProjects, allTasks]);

  const loadProjects = async () => {
    try {
      const projects = await projectApiService.getProjects();
      const mappedProjects: Project[] = projects.map((p: Project) => {
        const owners = p.owners ?? [];
        const firstOwner = owners[0];

        return {
          ...p,
          id: String(p.projectId),
          projectId: p.projectId,
          projectTitle: p.projectTitle,
          projectStatus: p.projectStatus,
          name: p.projectTitle,
          status: p.projectStatus?.toLowerCase() ?? 'active',
          owners,
          // Back-compat single-owner fields, derived from owners[0].
          ownerId: firstOwner ? String(firstOwner.ownerId) : undefined,
          ownerName: firstOwner?.ownerName,
          totalTask: p.totalTask,
          completedTask: p.completedTask,
          startDate: p.startDate,
          endDate: p.endDate,
          progress: 0,
    members: owners.map((o) => String(o.ownerId)), // ✅ ab mine filter kaam karega
          tag: '',
          color: '#3b82f6',
        };
      });
 console.log('Mapped Projects:', mappedProjects);
      dispatch(setProjects(mappedProjects));
      console.log('dispatch ke baad turant:', mappedProjects.length);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load projects');
    }
  };

  const projects = useAppSelector((state) => state.projects.items);
 console.log('Redux se allProjects:', allProjects);
console.log('tabFiltered:', tabFiltered.length);
console.log('filteredActive:', filteredActive.length);
  const handleProjectClick = async (projectId: string) => {
    try {
      const project = projects.find((p) => String(p.projectId) === String(projectId));
      saveProjectToStorage(project);
      navigate(`/projects/${project?.projectId}`, { state: { project } });
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSave = async (form: any) => {
    try {
      if (editing) {
        const updated = await projectApiService.updateProject(String(editing.id), {
          projectTitle: form.name,
          projectDescription: form.description,
          status: form.status,
          startDate: form.startDate,
          endDate: form.endDate,
          tag: form.tag,
        });
        dispatch(updateProject(updated));
        toast.success('Project updated');
      } else {
        const newProject = await projectApiService.createProjectTask({
          projectTitle: form.name,
          projectDescription: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          members: [me.id],
        });
        dispatch(addProject(newProject));
        toast.success('Project created');
      }
      setOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save project');
    }
  };

  const start = (page - 1) * pageSize;
  const pageItems = filteredActive.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <ProjectsHeader title={' Projects'} tabs={[]} value="active" onChange={() => {}} />

      <ProjectsToolbar
        query={query}
        onQueryChange={setQuery}
        onOpenFilters={() => setFilterOpen(true)}
        placeholder="Search projects…"
        showViewToggle
        view={view}
        onViewChange={setView}
        showCreate
        onCreate={() => { setEditing(null); setOpen(true); }}
      />

      <>
        {filteredActive.length === 0 ? (
          <ProjectEmptyState />
        ) : view === 'list' ? (
          <ProjectsTable
            projects={pageItems}
            users={users}
            stats={stats}
            onEdit={(p) => { setEditing(p); setOpen(true); }}
            onDelete={(id) => { dispatch(deleteProject(id)); toast.success('Project deleted'); }}
            onUpdate={(p) => dispatch(updateProject(p))}
            onOpenTasks={(p) => navigate(`/projects/${p.id}`)}
            onProjectClick={handleProjectClick}
          />
        ) : (
          <ProjectsGrid
            projects={pageItems}
            users={users}
            stats={stats}
            onEdit={(p) => { setEditing(p); setOpen(true); }}
            onDelete={(id) => { dispatch(deleteProject(id)); toast.success('Project deleted'); }}
          />
        )}

        <ProjectPagination
          total={filteredActive.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </>

      <ProjectsFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        fields={filterFields}
        value={filters.values}
        onApply={filters.setValues}
        onReset={filters.reset}
        title="Filter Projects"
      />

      <ProjectDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
    </div>
  );
}