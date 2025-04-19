
import React, { useState } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
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
  const { mode } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    if (mode === 'guest') {
      toast.error("Please log in to delete notes");
      return;
    }
    setShowDeleteDialog(true);
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
            onClick={(e) => onSelect(note.id, e)}
          >
            <FileText size={14} className="mr-2 text-muted-foreground" />
            <span className="truncate">{note.title}</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Note
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{note.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(note.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
