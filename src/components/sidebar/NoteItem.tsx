import React, { useRef, useState } from 'react';
import { FileText, Pencil, Trash2 } from 'lucide-react';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { updateGuestNote } from '@/utils/indexedDBOperations';
import { Input } from '@/components/ui/input';
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

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onSelect: (noteId: string, e: React.MouseEvent) => void;
  onDelete: (noteId: string) => void;
}

export function NoteItem({ note, isActive, onSelect, onDelete }: NoteItemProps) {
  const { user, mode } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setTitle(note.title);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 10);
  };

  const handleRenameComplete = async () => {
    if (!title.trim()) {
      setTitle(note.title);
      setIsEditing(false);
      return;
    }

    if (title === note.title) {
      setIsEditing(false);
      return;
    }

    if (mode === 'guest') {
      try {
        const success = await updateGuestNote(note.id, { title });
        if (success) {
          toast.success("Note renamed successfully");
        } else {
          setTitle(note.title);
        }
      } catch (error) {
        console.error('Error renaming guest note:', error);
        toast.error("Failed to rename note");
        setTitle(note.title);
      }
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await withRetry(() => 
        supabase
          .from('notes')
          .update({ title })
          .eq('id', note.id)
          .eq('user_id', user?.id)
      );

      if (error) {
        toast.error("Failed to rename note");
        console.error('Error renaming note:', error);
        setTitle(note.title);
      } else {
        toast.success("Note renamed successfully");
      }
    } catch (error) {
      console.error('Exception when renaming note:', error);
      toast.error("Failed to rename note");
      setTitle(note.title);
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameComplete();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTitle(note.title);
      setIsEditing(false);
    }
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    await onDelete(note.id);
    window.location.reload();
    
    setShowDeleteDialog(false);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "flex items-center p-2 rounded-md text-sm cursor-pointer",
              isActive
                ? "bg-sidebar-accent font-medium"
                : "hover:bg-sidebar-accent/50"
            )}
            onClick={(e) => !isEditing && onSelect(note.id, e)}
          >
            <FileText size={14} className="mr-2 text-muted-foreground" />
            
            {isEditing ? (
              <Input
                ref={inputRef}
                className="h-6 text-xs py-0 px-1"
                value={title}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameComplete}
              />
            ) : (
              <span className="truncate">{note.title}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleRenameClick}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename Note
          </ContextMenuItem>
          <ContextMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Note
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
          }
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{note.title}".
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
    </>
  );
}
