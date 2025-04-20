
import { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { NoteToolbar } from '@/components/NoteToolbar';
import { NoteEditor } from '@/components/NoteEditor';
import { useNoteOperations } from '@/hooks/useNoteOperations';
import { toast } from "sonner";
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

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
  onDelete?: (noteId: string) => void;
}

export function NoteView({
  note,
  onReview,
  onUpdateNote,
  onDelete
}: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const currentContentRef = useRef<string>('');
  const { saveNoteToSupabase, updateNotePriority, handleNoteReview, updateNoteTitle } = useNoteOperations();

  useEffect(() => {
    if (note && note.last_reviewed_at) {
      const distance = formatDistanceToNow(new Date(note.last_reviewed_at), {
        addSuffix: true
      });
      setLastReviewedText(`Last reviewed ${distance}`);
    } else {
      setLastReviewedText('Never reviewed');
    }
    
    if (note) {
      currentContentRef.current = note.content || '';
    }
  }, [note]);

  const handleUpdate = async (field: keyof Note, value: any) => {
    if (note) {
      if (field === 'title') {
        await updateNoteTitle(note, value, onUpdateNote);
      } else if (onUpdateNote) {
        onUpdateNote(note.id, { [field]: value });
      }
    }
  };

  const saveNoteContent = useCallback(async () => {
    console.log("Attempting to save content...");
    
    if (note && onUpdateNote) {
      try {
        // Update note in local state
        onUpdateNote(note.id, { content: currentContentRef.current });
        
        // Save to Supabase if authenticated
        await saveNoteToSupabase(note, currentContentRef.current);
      } catch (error) {
        console.error("Error saving note:", error);
        toast.error("Failed to save note");
      }
    }
  }, [note, onUpdateNote, saveNoteToSupabase]);

  const handleContentChange = useCallback((content: string) => {
    currentContentRef.current = content;
  }, []);

  const handleCopy = useCallback(() => {
    if (!note) return;
    
    try {
      navigator.clipboard.writeText(currentContentRef.current)
        .then(() => toast.success("Content copied to clipboard"))
        .catch(() => toast.error("Failed to copy content"));
    } catch (error) {
      console.error("Error copying content:", error);
      toast.error("Failed to copy content");
    }
  }, [note]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log(`${e.metaKey ? 'CMD' : 'CTRL'} + S key combination detected!`);
        saveNoteContent();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNoteContent]);

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a note to view</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <EditableContent 
            value={note.title} 
            onSave={value => handleUpdate('title', value)} 
            className="text-2xl font-bold" 
          />
        </div>

        <div className="flex items-center space-x-4 text-muted-foreground text-sm">
          <span>Created {formatDistanceToNow(new Date(note.created_at), {
            addSuffix: true
          })}</span>
          <span>•</span>
          <span>{lastReviewedText}</span>
        </div>

        <TagsEditor tags={note.tags} onSave={tags => handleUpdate('tags', tags)} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="mb-2">
          <NoteToolbar 
            note={note}
            onSave={saveNoteContent}
            onDelete={() => setShowDeleteDialog(true)}
            onCopy={handleCopy}
            onPriorityUpdate={(priority) => updateNotePriority(note, priority, onUpdateNote)}
            onReview={() => handleNoteReview(note, onReview, onUpdateNote)}
          />
        </div>

        <NoteEditor 
          note={note}
          onContentChange={handleContentChange}
        />
      </div>

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
                if (onDelete) {
                  onDelete(note.id);
                  setShowDeleteDialog(false);
                } else {
                  toast.error("Delete functionality is not available");
                  setShowDeleteDialog(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
