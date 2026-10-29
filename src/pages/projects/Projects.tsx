import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { deleteProject, setProjects, updateProject } from '@/store/slices/projectsSlice';
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
import { getApiErrorMessage, isUnauthorizedApiError } from '@/utils/apiError';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'On Hold', value: 'on-hold' },
  { label: 'Delayed', value: 'delayed' },
  { label: 'Completed', value: 'COMPLETED' },
];

// Maps the raw API project to the shape the UI expects.
const mapProject = (p: Project): Project => {
  const owners = p.owners ?? [];
  const firstOwner = owners[0];

  return {
    ...p,
    id: String(p.projectId),
    name: p.projectTitle,
    status: p.projectStatus?.toLowerCase() ?? 'active',
    owners,
    // Back-compat single-owner fields, derived from owners[0].
    ownerId: firstOwner ? String(firstOwner.ownerId) : undefined,
    ownerName: firstOwner?.ownerName,
    progress: 0,
    members: owners.map((o) => String(o.ownerId)),
    tag: '',
    color: '#3b82f6',
  };
};

export default function Projects() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allProjects = useAppSelector((s) => s.projects.items);
  const allTasks = useAppSelector((s) => s.tasks.lists);
  const users = useAppSelector((s) => s.users.items);

  const [view, setView] = useState<'list' | 'grid'>('list');
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = useFilterState();

  // ---------- data loading ----------
  const loadProjects = useCallback(async () => {
    try {
      const projects = await projectApiService.getProjects();
      dispatch(setProjects(projects.map(mapProject)));
    } catch (error) {
      console.error(error);
      if (!isUnauthorizedApiError(error)) {
        toast.error(getApiErrorMessage(error, 'Failed to load projects'));
      }
    }
  }, [dispatch]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ---------- derived data ----------
  const activeProjects = useMemo(
    () => allProjects.filter((p) => p.projectStatus !== 'COMPLETED'),
    [allProjects],
  );

  const userOptions = useMemo(
    () => users.map((u) => ({ label: u.name, value: String(u.id) })),
    [users],
  );

  const filterFields: FilterField[] = useMemo(
    () => [
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
      { id: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ],
    [userOptions],
  );

  const filteredProjects = useProjectsFilter({
    items: activeProjects,
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

  // Keyed by projectId — must match ProjectsTable's stats[row.original.projectId].
  const stats: ProjectStatsMap = useMemo(() => {
    const map: ProjectStatsMap = {};
    for (const p of allProjects) {
      const ts = allTasks.filter((t) => t.listId === p.id);
      const total = ts.length;
      const done = ts.filter((t) => t.titleStatus === 'done').length;
      const pct = total ? Math.round((done / total) * 100) : (p.progress ?? 0);
      const idStr = String(p.projectId ?? '');
      const seed = idStr ? idStr.charCodeAt(idStr.length - 1) : 1;
      const milestones = seed % 6;
      const mDone = Math.min(milestones, Math.floor((pct / 100) * milestones));
      const issues = total > 0 ? seed % 4 : 0;
      map[p.projectId] = { total, done, pct, milestones, mDone, issues };
    }
    return map;
  }, [allProjects, allTasks]);

  const pageItems = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  // ---------- handlers ----------
  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteProject(id));
    toast.success('Project deleted');
  };

  const handleProjectClick = (projectId: string) => {
    const project = allProjects.find((p) => String(p.projectId) === String(projectId));
    if (!project) {
      toast.error('Failed to load project');
      return;
    }
    saveProjectToStorage(project);
    navigate(`/projects/${project.projectId}`);
  };

  // Called by the dialog after a successful create/update: refetch so the UI updates immediately.
  const handleSaved = async () => {
    await loadProjects();
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <ProjectsHeader title="Projects" tabs={[]} value="active" onChange={() => {}} />

      <ProjectsToolbar
        query={query}
        onQueryChange={setQuery}
        onOpenFilters={() => setFilterOpen(true)}
        placeholder="Search projects…"
        showViewToggle
        view={view}
        onViewChange={setView}
        showCreate
        onCreate={openCreate}
      />

      {filteredProjects.length === 0 ? (
        <ProjectEmptyState />
      ) : view === 'list' ? (
        <ProjectsTable
          projects={pageItems}
          users={users}
          stats={stats}
          onEdit={openEdit}
          onDelete={handleDelete}
          onUpdate={(p) => dispatch(updateProject(p))}
          onOpenTasks={(p) => navigate(`/projects/${p.id}`)}
          onProjectClick={handleProjectClick}
        />
      ) : (
        <ProjectsGrid
          projects={pageItems}
          users={users}
          stats={stats}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <ProjectPagination
        total={filteredProjects.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <ProjectsFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        fields={filterFields}
        value={filters.values}
        onApply={filters.setValues}
        onReset={filters.reset}
        title="Filter Projects"
      />

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}