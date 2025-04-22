
import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Note } from '@/types';
import { NoteItem } from './NoteItem';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FolderItemProps {
  folder: {
    id: string;
    name: string;
    notes: Note[];
  };
  expanded: boolean;
  onToggle: (folderId: string, e: React.MouseEvent) => void;
  onNoteSelect: (noteId: string, e: React.MouseEvent) => void;
  activeNoteId: string | null;
  onCreateNote: (e: React.MouseEvent, folderId: string) => void;
  editingFolderId: string | null;
  onStartEditing: (folderId: string, e?: React.MouseEvent | React.KeyboardEvent) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function FolderItem({
  folder,
  expanded,
  onToggle,
  onNoteSelect,
  activeNoteId,
  onCreateNote,
  editingFolderId,
  onStartEditing,
  onRename,
  onDelete,
  onDeleteNote
}: FolderItemProps) {
  const { mode } = useAuth();
  const folderRenameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleToggle = (e: React.MouseEvent) => {
    onToggle(folder.id, e);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(folder.id);
    setShowDeleteDialog(false);
  };

  const handleStartEditing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onStartEditing(folder.id, e);
  };

  const handleRename = (newName: string) => {
    onRename(folder.id, newName);
  };

  const handleCreateNote = (e: React.MouseEvent) => {
    onCreateNote(e, folder.id);
  };

  return (
    <div key={folder.id} className="mb-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className="flex items-center p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group relative"
            onClick={handleToggle}
            onMouseEnter={() => {
              if (folderRenameTimerRef.current) {
                clearTimeout(folderRenameTimerRef.current);
              }
              
              folderRenameTimerRef.current = setTimeout(() => {
                if (editingFolderId !== folder.id) {
                  const renameButton = document.querySelector(`[data-folder-id="${folder.id}"] .rename-button`) as HTMLElement;
                  if (renameButton) {
                    renameButton.classList.remove('opacity-0');
                  }
                }
              }, 500);
            }}
            onMouseLeave={() => {
              if (folderRenameTimerRef.current) {
                clearTimeout(folderRenameTimerRef.current);
                folderRenameTimerRef.current = null;
              }
              
              if (editingFolderId !== folder.id) {
                const renameButton = document.querySelector(`[data-folder-id="${folder.id}"] .rename-button`) as HTMLElement;
                if (renameButton) {
                  renameButton.classList.add('opacity-0');
                }
              }
            }}
            data-folder-id={folder.id}
          >
            <span className="mr-1" onClick={(e) => e.stopPropagation()}>
              {expanded ? <ChevronDown size={16} onClick={handleToggle} /> : <ChevronRight size={16} onClick={handleToggle} />}
            </span>
            <Folder size={16} className="mr-2 text-muted-foreground" />
            
            {editingFolderId === folder.id ? (
              <Input
                className="h-6 text-sm py-0 px-1"
                defaultValue={folder.name}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRename((e.target as HTMLInputElement).value);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onStartEditing('');
                  }
                }}
                onBlur={(e) => handleRename(e.target.value)}
                autoFocus
              />
            ) : (
              <>
                <span className="text-sm font-medium">{folder.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto opacity-0 transition-opacity rename-button absolute right-2"
                  onClick={handleStartEditing}
                  type="button"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder "{folder.name}" and all its notes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {expanded && (
        <div className="ml-6 mt-1 space-y-1">
          {folder.notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isActive={activeNoteId === note.id}
              onSelect={onNoteSelect}
              onDelete={onDeleteNote}
            />
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
            onClick={handleCreateNote}
            type="button"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Note
          </Button>
        </div>
      )}
    </div>
  );
}
