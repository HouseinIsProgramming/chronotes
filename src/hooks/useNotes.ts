
import { useState, useCallback, useEffect } from 'react';
import { Folder, Note } from '@/types';
import { supabase, withRetry } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createDefaultFolders } from '@/utils/folderOperations';
import { sampleFoldersData } from '@/sampleData/notes';

export const useNotes = (mode: string | null, user: any) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const allNotes = folders.flatMap(folder => folder.notes);

  const fetchUserData = useCallback(async () => {
    if (mode === 'authenticated' && user) {
      try {
        const { data: folderData, error: folderError } = await withRetry(() => 
          supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
        );

        if (folderError) {
          console.error("Error fetching folders:", folderError);
          toast.error("Failed to load folders", {
            description: folderError.message
          });
          
          setFolders(sampleFoldersData);
          return;
        }

        const typedFolderData = folderData as Array<{
          id: string;
          name: string;
        }> | null;

        if (!typedFolderData || typedFolderData.length === 0) {
          await createDefaultFolders(user.id);
          return;
        }

        const { data: noteData, error: noteError } = await withRetry(() => 
          supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
        );

        if (noteError) {
          console.error("Error fetching notes:", noteError);
          toast.error("Failed to load notes");
          return;
        }

        const typedNoteData = noteData as Array<{
          id: string;
          title: string;
          content: string;
          tags: string[];
          created_at: string;
          last_reviewed_at: string;
          folder_id: string;
          priority?: string;
        }> | null;

        const userFolders: Folder[] = typedFolderData.map(folder => ({
          id: folder.id,
          name: folder.name,
          notes: (typedNoteData || [])
            .filter(note => note.folder_id === folder.id)
            .map(note => ({
              ...note,
              priority: note.priority as 'high' | 'medium' | 'low' | undefined
            })) || []
        }));

        setFolders(userFolders);
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        toast.error("Something went wrong loading your data");
        setFolders(sampleFoldersData);
      }
    } else if (mode === 'guest') {
      setFolders(sampleFoldersData);
    }
  }, [mode, user]);

  const handleReview = async (noteId: string) => {
    const now = new Date().toISOString();
    
    const updatedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => 
        note.id === noteId 
          ? { ...note, last_reviewed_at: now, priority: null } 
          : note
      )
    }));
    
    setFolders(updatedFolders);
    
    if (mode === 'authenticated' && user) {
      try {
        const { error } = await withRetry(() => 
          supabase
            .from('notes')
            .update({ 
              last_reviewed_at: now,
              priority: null
            })
            .eq('id', noteId)
            .eq('user_id', user.id)
        );
          
        if (error) {
          console.error("Error updating review time and priority:", error);
          toast.error("Failed to sync review status");
        }
      } catch (error) {
        console.error("Exception when updating review time and priority:", error);
      }
    }
  };

  const handleNoteUpdate = async (noteId: string, updates: Partial<Note>) => {
    const updatedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates } 
          : note
      )
    }));
    
    setFolders(updatedFolders);
  };

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (allNotes.length > 0 && !activeNoteId) {
      const welcomeNote = allNotes.find(note => note.title === "Welcome to NoteFlow");
      const firstNoteId = welcomeNote ? welcomeNote.id : allNotes[0].id;
      setActiveNoteId(firstNoteId);
      setActiveNote(allNotes.find(note => note.id === firstNoteId) || null);
    }
  }, [allNotes, activeNoteId]);

  useEffect(() => {
    if (activeNoteId) {
      const foundNote = allNotes.find(note => note.id === activeNoteId);
      setActiveNote(foundNote || null);
    } else {
      setActiveNote(null);
    }
  }, [activeNoteId, allNotes]);

  return {
    folders,
    activeNoteId,
    activeNote,
    setActiveNoteId,
    handleReview,
    handleNoteUpdate,
    fetchUserData
  };
};
