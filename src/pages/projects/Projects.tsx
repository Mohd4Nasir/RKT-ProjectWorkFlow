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
import { ProjectSummaryCards } from './ProjectSummaryCards';
import { ProjectDialog } from './ProjectDialog';
import { ImportExcelDialog } from './ImportExcelDialog';
import { ProjectsFilterDrawer, FilterField } from './ProjectsFilterDrawer';
import { ProjectStatsMap } from './ProjectStats';
import { useFilterState, useProjectsFilter } from './hooks/useProjectsFilter';
import { projectApiService } from '@/services/projectsApiService';
import { saveProjectToStorage } from '@/utils/projectStorage';

interface Props { mine?: boolean; }

export default function Projects({ mine = false }: Props) {
  const basePath = mine ? '/my-projects' : '/projects';
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
  const [importOpen, setImportOpen] = useState(false);

  const filters = useFilterState();

  // const baseProjects = mine
  //   ? allProjects.filter((p) => p.members?.includes(String(me.id)))
  //   : allProjects;

    
  const tabFiltered = useMemo(
    () => allProjects.filter((p) => p.projectStatus !== 'COMPLETED'),
    [allProjects],
  );

  const userOptions = useMemo(() => {
    // owners actually present on projects (the global users list may not contain them)
    const seen = new Map<string, string>();
    allProjects.forEach((p) => (p.owners ?? []).forEach((o) => seen.set(String(o.ownerId), o.ownerName)));
    return [...seen].map(([value, label]) => ({ label, value })).sort((x, y) => x.label.localeCompare(y.label));
  }, [allProjects]);

  const statusOptions = [
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'On Hold', value: 'ON_HOLD' },
    { label: 'Delayed', value: 'DELAYED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Closed', value: 'CLOSED' },
  ];

  const filterFields: FilterField[] = useMemo(() => [
    { id: 'name', label: 'Project Name', type: 'text' },
    { id: 'owner', label: 'Owner', type: 'select', options: userOptions },
    { id: 'status', label: 'Status', type: 'select', options: statusOptions },
    { id: 'startDate', label: 'Start Date', type: 'daterange' },
    { id: 'endDate', label: 'End Date', type: 'daterange' },
    { id: 'progress', label: 'Progress (%)', type: 'numrange' },
    { id: 'tasks', label: 'Total Tasks', type: 'numrange' },
    {
      id: 'overdue', label: 'Overdue', type: 'select',
      options: [{ label: 'Overdue only', value: 'yes' }, { label: 'Not overdue', value: 'no' }],
    },
    {
      id: 'ownerCount', label: 'Owners', type: 'select',
      options: [{ label: 'Has owner', value: 'has' }, { label: 'No owner', value: 'none' }],
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [userOptions]);

  // a status filter must be able to reach COMPLETED projects, which are hidden by default
  const baseProjects = filters.values.values.status ? allProjects : tabFiltered;

  const filteredActive = useProjectsFilter({
    items: baseProjects,
    query,
    filters: filters.values,
    searchOf: (p) => `${p.projectTitle} ${(p.owners ?? []).map((o) => o.ownerName).join(' ')}`,
    predicates: (p, f) => {
      const preds: boolean[] = [];
      const day = (d?: string) => d?.slice(0, 10) ?? '';
      const inRange = (v: string, from?: string, to?: string) =>
        !!v && (!from || v >= from) && (!to || v <= to);
      const inNum = (n: number, min?: string, max?: string) =>
        (min === undefined || min === '' || n >= Number(min)) && (max === undefined || max === '' || n <= Number(max));

      if (f.name) preds.push(p.projectTitle.toLowerCase().includes(f.name.toLowerCase()));
      // Owner filter checks against ANY of the project's owners.
      if (f.owner) preds.push((p.owners ?? []).some((o) => String(o.ownerId) === String(f.owner)));
      if (f.status) preds.push(p.projectStatus === f.status);
      if (f.startDateFrom || f.startDateTo) preds.push(inRange(day(p.startDate), f.startDateFrom, f.startDateTo));
      if (f.endDateFrom || f.endDateTo) preds.push(inRange(day(p.endDate), f.endDateFrom, f.endDateTo));
      if (f.progressMin || f.progressMax) {
        const total = p.totalTask ?? 0;
        const pct = total ? Math.round(((p.completedTask ?? 0) / total) * 100) : 0;
        preds.push(inNum(pct, f.progressMin, f.progressMax));
      }
      if (f.tasksMin || f.tasksMax) preds.push(inNum(p.totalTask ?? 0, f.tasksMin, f.tasksMax));
      if (f.overdue) {
        const late = !!p.endDate && day(p.endDate) < new Date().toISOString().slice(0, 10)
          && !['COMPLETED', 'CLOSED'].includes(p.projectStatus);
        preds.push(f.overdue === 'yes' ? late : !late);
      }
      if (f.ownerCount) preds.push(f.ownerCount === 'has' ? (p.owners ?? []).length > 0 : (p.owners ?? []).length === 0);
      return preds;
    },
  });

  // number of filters the user has actually filled in (a range counts once)
  const activeFilters = useMemo(() => {
    const v = filters.values.values;
    return filterFields.filter((fl) =>
      Object.keys(v).some((k) => v[k] && (k === fl.id || k.startsWith(fl.id) && /^(From|To|Min|Max)$/.test(k.slice(fl.id.length)))),
    ).length;
  }, [filters.values, filterFields]);

  // changing a filter or the search must not leave the user on a page that no longer exists
  useEffect(() => { setPage(1); }, [query, filters.values]);

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
      navigate(`${basePath}/${project?.projectId}`, { state: { project } });
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
        await projectApiService.updateProject(editing.projectId, {
          projectTitle: form.name,
          projectDescription: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
        });
        toast.success('Project updated');
      } else {
        await projectApiService.createProjectTask({
          projectTitle: form.name,
          projectDescription: form.description,
          startDate: form.startDate,
          endDate: form.endDate,
          members: [me.id],
        });
        toast.success('Project created');
      }
      await loadProjects(); // reload so list shows exactly what the server saved
      setOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save project');
    }
  };

  // Inline edits in the table (title / start / end date) -> PUT /project
  const handleInlineUpdate = async (p: Project) => {
    const prev = allProjects.find((x) => String(x.projectId) === String(p.projectId));
    if (prev && prev.projectTitle === p.projectTitle && prev.startDate === p.startDate && prev.endDate === p.endDate) {
      return;
    }
    try {
      await projectApiService.updateProject(p.projectId, {
        projectTitle: p.projectTitle,
        startDate: p.startDate,
        endDate: p.endDate,
      });
      dispatch(updateProject(p));
      toast.success('Project updated');
    } catch {
      toast.error('Failed to update project');
      loadProjects(); // roll the table back to what the server has
    }
  };

  const start = (page - 1) * pageSize;
  const pageItems = filteredActive.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <ProjectsHeader
        title={mine ? 'Projects' : 'Projects'}
        subtitle={mine ? 'Projects you own or contribute to' : 'All projects across the organisation'}
      />

      <ProjectSummaryCards projects={tabFiltered} />

      <ProjectsToolbar
        query={query}
        onQueryChange={setQuery}
        onOpenFilters={() => setFilterOpen(true)}
        activeFilters={activeFilters}
        placeholder="Search projects…"
        showViewToggle
        view={view}
        onViewChange={setView}
        showCreate
        onCreate={() => { setEditing(null); setOpen(true); }}
        showImport
        onImport={() => setImportOpen(true)}
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
            onUpdate={handleInlineUpdate}
            onChangeStatus={async (p, st) => {
              try {
                await projectApiService.updateProjectStatus(p.projectId, st);
                dispatch(updateProject({ ...p, projectStatus: st } as Project));
                toast.success('Status updated');
              } catch {
                toast.error('Failed to update status');
              }
            }}
            onOpenTasks={(p) => navigate(`${basePath}/${p.id}`)}
            onProjectClick={handleProjectClick}
          />
        ) : (
          <ProjectsGrid
            projects={pageItems}
            users={users}
            stats={stats}
            onEdit={(p) => { setEditing(p); setOpen(true); }}
            onDelete={(id) => { dispatch(deleteProject(id)); toast.success('Project deleted'); }}
            onProjectClick={handleProjectClick}
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

      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} onImported={loadProjects} />

      <ProjectDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
    </div>
  );
}