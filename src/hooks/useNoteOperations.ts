
import { useCallback } from 'react';
import { Note } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { updateGuestNote } from '@/utils/indexedDBOperations';

export function useNoteOperations() {
  const { mode, user } = useAuth();

  const saveNoteToSupabase = useCallback(async (
    note: Note,
    content: string,
  ) => {
    if (!note) return;

    try {
      if (mode === 'guest') {
        // For guest mode, save to IndexedDB
        await updateGuestNote(note.id, { content });
      } else if (mode === 'authenticated' && user) {
        // For authenticated users, save to Supabase
        const { error: noteError } = await supabase
          .from('notes')
          .update({ content })
          .eq('id', note.id)
          .eq('user_id', user.id);
          
        if (noteError) {
          console.error("Error saving note to Supabase:", noteError);
          toast.error("Failed to sync note: " + noteError.message);
          return;
        }

        // Create history snapshot
        const { error: historyError } = await supabase
          .from('note_history')
          .insert({
            note_id: note.id,
            user_id: user.id,
            title: note.title,
            content: content,
            tags: note.tags,
            priority: note.priority,
            folder_id: note.folder_id
          });

        if (historyError) {
          console.error("Error creating history snapshot:", historyError);
          toast.error("Note saved but failed to create history snapshot");
        } else {
          toast.success("Note saved with history snapshot");
        }
      }
    } catch (error) {
      console.error("Exception when saving note:", error);
      toast.error("Failed to save note");
    }
  }, [mode, user]);

  const updateNotePriority = useCallback(async (
    note: Note,
    priority: 'high' | 'medium' | 'low' | null,
    onUpdateNote?: (noteId: string, updates: Partial<Note>) => void,
  ) => {
    if (!note) return;

    try {
      // Update note in local state
      if (onUpdateNote) {
        onUpdateNote(note.id, { priority });
      }
      
      if (mode === 'guest') {
        // For guest mode, save to IndexedDB
        await updateGuestNote(note.id, { priority });
      } else if (mode === 'authenticated' && user) {
        // For authenticated users, save to Supabase
        const { error } = await supabase
          .from('notes')
          .update({ priority })
          .eq('id', note.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error updating note priority:", error);
          toast.error("Failed to update note priority");
        } else {
          toast.success(priority ? `Note marked as ${priority} priority` : 'Priority removed');
        }
      }
    } catch (error) {
      console.error("Exception when updating note priority:", error);
      toast.error("Failed to update note priority");
    }
  }, [mode, user]);

  const handleNoteReview = useCallback(async (
    note: Note,
    onReview: (noteId: string) => void,
    onUpdateNote?: (noteId: string, updates: Partial<Note>) => void,
  ) => {
    if (!note) return;

    console.log("Mark as reviewed clicked for note:", note.id);
    const now = new Date().toISOString();
    
    // First, update the note's priority to null locally
    if (onUpdateNote) {
      console.log("Setting priority to null for note:", note.id);
      onUpdateNote(note.id, { priority: null, last_reviewed_at: now });
    }
    
    // Then, call the onReview function to update the review timestamp
    onReview(note.id);
    
    try {
      if (mode === 'guest') {
        // For guest mode, save to IndexedDB
        await updateGuestNote(note.id, { 
          last_reviewed_at: now,
          priority: null
        });
        toast.success("Note marked as reviewed");
      } else if (mode === 'authenticated' && user) {
        // For authenticated users, save to Supabase
        const { error } = await supabase
          .from('notes')
          .update({ 
            last_reviewed_at: now,
            priority: null
          })
          .eq('id', note.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error updating review time in Supabase:", error);
          toast.error("Failed to mark note as reviewed");
        } else {
          toast.success("Note marked as reviewed");
        }
      }
    } catch (error) {
      console.error("Exception when updating review time:", error);
      toast.error("Failed to mark note as reviewed");
    }
  }, [mode, user]);

  return {
    saveNoteToSupabase,
    updateNotePriority,
    handleNoteReview,
  };
}
