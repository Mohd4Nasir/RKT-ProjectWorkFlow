import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { addProject, deleteProject, updateProject } from '@/store/slices/projectsSlice';
import { Project } from '@/types';
import { toast } from 'sonner';

import { ProjectsHeader } from './ProjectsHeader';
import { ProjectsToolbar } from './ProjectsToolbar';
import { ProjectsTable } from './ProjectsTable';
import { ProjectsGrid } from './ProjectsGrid';
import { ProjectEmptyState } from './ProjectEmptyState';
import { ProjectPagination } from './ProjectPagination';
import { ProjectDialog } from './ProjectDialog';
import { PublicProjectsTable } from './PublicProjectsTable';
import { ProjectsFilterDrawer, FilterField } from './ProjectsFilterDrawer';
import { ProjectStatsMap } from './ProjectStats';
import {
  emptyFilterValues, useFilterState, useProjectsFilter,
} from './hooks/useProjectsFilter';
import { mockPublicProjects, PublicProject } from '@/services/publicProject';

interface Props { mine?: boolean; }

export default function Projects({ mine }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const allProjects = useAppSelector((s) => s.projects.items);
  const allTasks = useAppSelector((s) => s.tasks.items);
  const users = useAppSelector((s) => s.users.items);
  const me = useAppSelector((s) => s.auth.user!);

  const [tab, setTab] = useState<'active' | 'public'>('active');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [activeQ, setActiveQ] = useState('');
  const [publicQ, setPublicQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilters = useFilterState();
  const publicFilters = useFilterState();

  const [publicProjects, setPublicProjects] = useState<PublicProject[]>(mockPublicProjects);

  const baseProjects = mine ? allProjects.filter((p) => p.members.includes(me.id)) : allProjects;
  const tabFiltered = useMemo(() => baseProjects.filter((p) => p.status !== 'completed'), [baseProjects]);

  const userOptions = useMemo(() => users.map((u) => ({ label: u.name, value: u.id })), [users]);
  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'On Hold', value: 'on-hold' },
    { label: 'Delayed', value: 'delayed' },
    { label: 'Completed', value: 'completed' },
  ];
  const accessOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Restricted', value: 'restricted' },
    { label: 'Private', value: 'private' },
  ];
  const layoutOptions = [
    { label: 'Classic', value: 'classic' },
    { label: 'Kanban', value: 'kanban' },
    { label: 'Timeline', value: 'timeline' },
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
    { id: 'layout', label: 'Layout', type: 'select', options: layoutOptions },
    { id: 'projectAccess', label: 'Project Access', type: 'select', options: accessOptions },
  ], [userOptions]);

  const filteredActive = useProjectsFilter({
    items: tabFiltered,
    query: activeQ,
    filters: activeFilters.values,
    searchOf: (p) => p.name,
    predicates: (p, f) => {
      const preds: boolean[] = [];
      if (f.name) preds.push(p.name.toLowerCase().includes(f.name.toLowerCase()));
      if (f.owner) preds.push(p.ownerId === f.owner);
      if (f.status) preds.push(p.status === f.status);
      if (f.startDate) preds.push(p.startDate?.slice(0, 10) === f.startDate);
      if (f.endDate) preds.push(p.endDate?.slice(0, 10) === f.endDate);
      return preds;
    },
  });

  const filteredPublic = useProjectsFilter({
    items: publicProjects,
    query: publicQ,
    filters: publicFilters.values,
    searchOf: (p) => p.name,
    predicates: (p, f) => {
      const preds: boolean[] = [];
      if (f.name) preds.push(p.name.toLowerCase().includes(f.name.toLowerCase()));
      if (f.owner) preds.push(p.ownerId === f.owner);
      if (f.status) preds.push(p.status === f.status);
      if (f.projectAccess) preds.push(p.access === f.projectAccess);
      if (f.createdTime) preds.push(p.createdAt.slice(0, 10) === f.createdTime);
      return preds;
    },
  });

  const stats: ProjectStatsMap = useMemo(() => {
    const map: ProjectStatsMap = {};
    for (const p of allProjects) {
      const ts = allTasks.filter((t) => t.projectId === p.id);
      const total = ts.length;
      const done = ts.filter((t) => t.status === 'done').length;
      const pct = total ? Math.round((done / total) * 100) : p.progress;
      const seed = p.id.charCodeAt(p.id.length - 1) || 1;
      const milestones = (seed % 6);
      const mDone = Math.min(milestones, Math.floor((pct / 100) * milestones));
      const issues = total > 0 ? (seed % 4) : 0;
      map[p.id] = { total, done, pct, milestones, mDone, issues };
    }
    return map;
  }, [allProjects, allTasks]);

  const onSave = (form: any) => {
    if (editing) {
      dispatch(updateProject({ ...editing, ...form }));
      toast.success('Project updated');
    } else {
      dispatch(addProject({
        id: 'p' + Date.now(),
        name: form.name,
        description: form.description,
        status: form.status,
        progress: 0,
        startDate: form.startDate,
        endDate: form.endDate,
        members: [me.id],
        ownerId: me.id,
        sla: 'on-track',
        tag: form.tag || 'General',
        color: 'hsl(261 38% 59%)',
      }));
      toast.success('Project created');
    }
    setOpen(false);
    setEditing(null);
  };

  const isActive = tab === 'active';
  const currentQuery = isActive ? activeQ : publicQ;
  const setCurrentQuery = isActive ? setActiveQ : setPublicQ;
  const currentFilters = isActive ? activeFilters : publicFilters;

  const start = (page - 1) * pageSize;
  const pageItems = filteredActive.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <ProjectsHeader
        title={mine ? 'My Projects' : 'Projects'}
        tabs={[
          { id: 'active', label: 'Active Projects' },
          { id: 'public', label: 'Public Projects' },
        ]}
        value={tab}
        onChange={(v) => { setTab(v as 'active' | 'public'); setPage(1); }}
      />

      <ProjectsToolbar
        query={currentQuery}
        onQueryChange={setCurrentQuery}
        onOpenFilters={() => setFilterOpen(true)}
        placeholder={isActive ? 'Search projects…' : 'Search public projects…'}
        showViewToggle={isActive}
        view={view}
        onViewChange={setView}
        showCreate={isActive}
        onCreate={() => { setEditing(null); setOpen(true); }}
      />

      {isActive ? (
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
      ) : (
        <PublicProjectsTable
          projects={filteredPublic}
          users={users}
          onJoin={(id) => {
            setPublicProjects((prev) => prev.map((p) => p.id === id ? { ...p, joined: !p.joined } : p));
            toast.success('Project joined');
          }}
        />
      )}

      <ProjectsFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        fields={filterFields}
        value={currentFilters.values}
        onApply={currentFilters.setValues}
        onReset={currentFilters.reset}
        title={isActive ? 'Filter Active Projects' : 'Filter Public Projects'}
      />

      <ProjectDialog open={open} onOpenChange={setOpen} editing={editing} onSave={onSave} />
    </div>
  );
}
