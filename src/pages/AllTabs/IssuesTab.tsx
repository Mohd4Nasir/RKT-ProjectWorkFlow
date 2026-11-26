import { useMemo } from 'react';
import { useProjectTasks } from '@/hooks/useProjectTasks';
import { IssuesPanel } from '@/pages/task/IssuesPanel';

interface Props { projectId: string; }

/** Project-wide issues (task-issue-controller). Issues can be reported on any task or subtask of the project. */
export function IssuesTab({ projectId }: Props) {
  const { tasks } = useProjectTasks(projectId);
  const options = useMemo(
    () => tasks.map((t) => ({ taskId: t.taskId, taskTitle: t.taskTitle, listTitle: t.listTitle })),
    [tasks],
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Issues</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Track bugs, blockers, improvements and queries across all tasks and subtasks</p>
      </div>
      <IssuesPanel projectId={projectId} tasks={options} />
    </div>
  );
}
