import { useMemo } from 'react';
import { ChevronsUpDown, List, ListTodo, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubTaskNode } from '@/types/taskTypes';
import { T, TaskCardFlat, flattenListTasks } from './Taskdetailshared';

// Adjust this to match your actual redux "list" shape (state.tasks.lists)
export interface TaskListItem {
  listId: number | string;
  listTitle: string;
  tasks?: SubTaskNode[];
}

interface TaskListSidebarProps {
  lists: TaskListItem[];
  selectedListId: string;
  onSelectListId: (listId: string) => void;
  selectedTaskId: number;
  onSelectTask: (t: SubTaskNode) => void;
}

export function TaskListSidebar({
  lists,
  selectedListId,
  onSelectListId,
  selectedTaskId,
  onSelectTask,
}: TaskListSidebarProps) {
  const selectedList = useMemo(
    () => lists.find((l) => String(l.listId) === selectedListId),
    [lists, selectedListId],
  );

  const flatTasks = useMemo(
    () => (selectedList ? flattenListTasks(selectedList.tasks || []) : []),
    [selectedList],
  );

  return (
    <div className="w-80 flex-shrink-0 flex flex-col bg-brand-surface">
      <div
        className=" pb-3 relative z-[110] bg-brand-surface"
        style={{ borderBottom: `1px solid ${T.navy}14` }}
      >
        <div className="flex items-center gap-2 px-2 bg-secondary-55 mb-3 border-b-2 py-3.5 flex-shrink-0"
          >
            <span
              className="inline-flex items-center gap-1 text-[11px] px-2  bg-primary-55 py-0.5 rounded font-bold"
              style={{ backgroundColor: `${T.teal}80`, color: T.navy }}
            >
              <List className="h-3 w-3" /> Task List
            </span>
        </div>
        

        <Select value={selectedListId} onValueChange={onSelectListId}>
          <SelectTrigger
            className="w-full h-10 bg-white  text-heading border-2-heading  rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 shadow-sm"
           
          >
            <SelectValue placeholder="Select a list..." />
          </SelectTrigger>

          <SelectContent
            className="z-[1000] rounded-lg shadow-xl w-full min-w-[var(--radix-select-trigger-width)] max-h-[300px] overflow-y-auto overflow-hidden"
            style={{ backgroundColor: T.white, border: `1px solid ${T.navy}22` }}
            position="popper"
            sideOffset={4}
            align="start"
          >
            <div className="py-1">
              {lists.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-xs" style={{ color: `${T.para}88` }}>No lists available</p>
                </div>
              ) : (
                lists.map((list) => (
                  <SelectItem
                    key={list.listId}
                    value={String(list.listId)}
                    className="text-xs font-semibold pl-3 pr-8 py-2.5 cursor-pointer transition-colors flex items-center justify-between w-full data-[state=checked]:font-bold [&>span:first-child]:hidden"
                    style={{ color: T.navy }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: String(list.listId) === selectedListId ? T.pink : `${T.navy}33` }}
                      />
                      <span className="truncate">{list.listTitle}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-mono font-bold"
                        style={{ backgroundColor: T.teal, color: T.navy }}
                      >
                        {(list.tasks || []).length}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!selectedList ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${T.peach}1a` }}
            >
              <ChevronsUpDown className="h-6 w-6" style={{ color: `${T.pink}66` }} />
            </div>
            <p className="text-xs font-medium" style={{ color: `${T.para}99` }}>Select a list to view tasks</p>
          </div>
        ) : flatTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: `${T.pink}1a` }}
            >
              <ListTodo className="h-6 w-6" style={{ color: `${T.pink}66` }} />
            </div>
            <p className="text-xs font-medium" style={{ color: `${T.para}99` }}>No tasks in</p>
            <p className="text-xs font-bold mt-1" style={{ color: T.navy }}>"{selectedList.listTitle}"</p>
          </div>
        ) : (
          flatTasks.map((t) => (
            <TaskCardFlat
              key={t.taskId}
              node={t}
              selectedTaskId={selectedTaskId}
              onClickTask={onSelectTask}
              isSubtask={!!t.parentTaskId}
            />
          ))
        )}
      </div>
    </div>
  );
}