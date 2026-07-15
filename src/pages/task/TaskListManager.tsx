/* eslint-disable @typescript-eslint/no-explicit-any */
// components/TaskListManager.tsx
import React, { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

// Define proper types
interface TaskList {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks?: any[];
  createdAt: string;
  updatedAt: string;
}

interface TaskListManagerProps {
  taskLists?: TaskList[];
  projectId: string;
  onAddTaskList: (data: any) => void;
  onUpdateTaskList: (taskList: TaskList) => void;
  onDeleteTaskList: (taskListId: string) => void;
  onReorderTaskLists: (orderedIds: string[]) => void;
  children?: ReactNode; // ← Explicitly marked as optional with ?
}

const TaskListManager: React.FC<TaskListManagerProps> = ({
  taskLists = [],
  projectId,
  onAddTaskList,
  onUpdateTaskList,
  onDeleteTaskList,
  onReorderTaskLists,
  children, // Now properly optional in types
}) => {
  // State for Create List
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  // State for Edit List
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [editListName, setEditListName] = useState('');
  const [editListDescription, setEditListDescription] = useState('');

  // State for Delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);
  const [deletingListName, setDeletingListName] = useState('');

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // ========== CREATE HANDLER ==========
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newListName.trim()) {
      toast.error('List name is required');
      return;
    }

    setIsLoading(true);
    try {
      const newList = {
        name: newListName.trim(),
        description: newListDescription.trim(),
        projectId: projectId,
        order: taskLists?.length || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onAddTaskList(newList);
      toast.success('Task list created successfully!');
      resetCreateForm();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating task list:', error);
      toast.error('Failed to create task list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== EDIT HANDLER ==========
  const handleEditClick = (list: TaskList) => {
    setEditingList(list);
    setEditListName(list.name);
    setEditListDescription(list.description || '');
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editListName.trim()) {
      toast.error('List name is required');
      return;
    }

    setIsLoading(true);
    try {
      const updatedList = {
        ...editingList,
        name: editListName.trim(),
        description: editListDescription.trim(),
        updatedAt: new Date().toISOString()
      };

      await onUpdateTaskList(updatedList as TaskList);
      toast.success('Task list updated successfully!');
      resetEditForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating task list:', error);
      toast.error('Failed to update task list.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== DELETE HANDLER ==========
  const handleDeleteClick = (listId: string, listName: string) => {
    setDeletingListId(listId);
    setDeletingListName(listName);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingListId) return;
    
    setIsLoading(true);
    try {
      await onDeleteTaskList(deletingListId);
      toast.success('Task list deleted successfully!');
      setIsDeleteDialogOpen(false);
      setDeletingListId(null);
      setDeletingListName('');
    } catch (error) {
      console.error('Error deleting task list:', error);
      toast.error('Failed to delete task list.');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== RESET FUNCTIONS ==========
  const resetCreateForm = () => {
    setNewListName('');
    setNewListDescription('');
  };

  const resetEditForm = () => {
    setEditListName('');
    setEditListDescription('');
    setEditingList(null);
  };

  // ========== RENDER ==========
  return (
    <>
      {/* Trigger Button - Can be customized via children or default */}
      {children ? (
        <div onClick={() => setIsCreateDialogOpen(true)} style={{ cursor: 'pointer' }}>
          {children}
        </div>
      ) : (
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          size="sm"
          className="h-8 px-3 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <FolderPlus className="h-4 w-4" />
          New List
        </Button>
      )}

      {/* ========== CREATE LIST DIALOG ========== */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task List</DialogTitle>
            <DialogDescription>
              Add a new task list to organize your tasks better.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName">List Name *</Label>
              <Input
                id="listName"
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="listDescription">Description (optional)</Label>
              <Textarea
                id="listDescription"
                placeholder="Enter list description..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateForm();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create List'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== EDIT LIST DIALOG ========== */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task List</DialogTitle>
            <DialogDescription>
              Update your task list details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editListName">List Name *</Label>
              <Input
                id="editListName"
                placeholder="Enter list name..."
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                autoFocus
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editListDescription">Description (optional)</Label>
              <Textarea
                id="editListDescription"
                placeholder="Enter list description..."
                value={editListDescription}
                onChange={(e) => setEditListDescription(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  resetEditForm();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update List'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== DELETE CONFIRMATION DIALOG ========== */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deletingListName}"</strong>? 
              This action cannot be undone and will delete all tasks in this list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingListId(null);
                setDeletingListName('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete List'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== LIST DISPLAY WITH EDIT/DELETE ACTIONS ========== */}
      {taskLists.length > 0 && (
        <div className="mt-4 space-y-2">
          {taskLists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{list.name}</h4>
                  {list.description && (
                    <p className="text-xs text-gray-500 truncate">{list.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {list.tasks?.length || 0} tasks
                </span>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(list)}
                  className="h-7 w-7 p-0"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(list.id, list.name)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default TaskListManager;