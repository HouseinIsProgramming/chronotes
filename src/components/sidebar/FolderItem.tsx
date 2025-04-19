
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
  onStartEditing: (folderId: string, event: React.MouseEvent) => void;
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

  return (
    <div key={folder.id} className="mb-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <div 
            className="flex items-center p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group relative"
            onClick={(e) => onToggle(folder.id, e)}
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
            <span className="mr-1">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
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
                    onRename(folder.id, e.currentTarget.value);
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onStartEditing('', e);
                  }
                }}
                onBlur={(e) => onRename(folder.id, e.target.value)}
                autoFocus
              />
            ) : (
              <>
                <span className="text-sm font-medium">{folder.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-auto opacity-0 transition-opacity rename-button absolute right-2"
                  onClick={(e) => onStartEditing(folder.id, e)}
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
            onClick={() => {
              if (mode === 'guest') {
                toast.error("Please log in to delete folders");
                return;
              }
              onDelete(folder.id);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Folder
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

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
            onClick={(e) => onCreateNote(e, folder.id)}
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
