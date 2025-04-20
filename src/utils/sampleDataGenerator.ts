
import { supabase, withRetry } from "@/integrations/supabase/client";
import { Folder } from "@/types";
import { toast } from "sonner";
import { sampleFolders, sampleNotes } from "@/sampleData/notes";
import { welcomeNote } from "@/sampleData/welcome";

// Function to generate sample data in IndexedDB for guest mode
async function generateGuestSampleData() {
  try {
    const indexedDB = window.indexedDB;
    const request = indexedDB.open('chronotes', 1);
    
    request.onsuccess = async (event) => {
      const db = request.result;
      
      // Create folders
      const folderIds = new Map<string, string>();
      
      for (const folder of sampleFolders) {
        const folderId = crypto.randomUUID();
        folderIds.set(folder.name, folderId);
        
        const folderTransaction = db.transaction('folders', 'readwrite');
        const folderStore = folderTransaction.objectStore('folders');
        
        folderStore.add({
          id: folderId,
          name: folder.name,
          user_id: 'guest'
        });
      }
      
      // Create notes for each folder
      for (const folder of sampleFolders) {
        const folderId = folderIds.get(folder.name);
        if (!folderId) continue;
        
        // Get notes that belong to this folder
        const notesToCreate = folder.notes.map(noteKey => {
          // Special case for welcome note
          if (noteKey === 'welcome') {
            return {
              id: crypto.randomUUID(),
              title: welcomeNote.title,
              content: welcomeNote.content,
              tags: welcomeNote.tags,
              user_id: 'guest',
              folder_id: folderId,
              created_at: new Date().toISOString(),
              last_reviewed_at: new Date().toISOString()
            };
          }
          
          const note = sampleNotes[noteKey as keyof typeof sampleNotes];
          return {
            id: crypto.randomUUID(),
            title: note.title,
            content: note.content,
            tags: note.tags,
            user_id: 'guest',
            folder_id: folderId,
            created_at: new Date().toISOString(),
            last_reviewed_at: new Date().toISOString()
          };
        });
        
        const noteTransaction = db.transaction('notes', 'readwrite');
        const noteStore = noteTransaction.objectStore('notes');
        
        // Add each note to the store
        for (const note of notesToCreate) {
          noteStore.add(note);
        }
      }
      
      toast.success("Sample data created successfully");
    };
    
    request.onerror = (event) => {
      console.error("Error accessing IndexedDB:", request.error);
      toast.error("Failed to create sample data");
      throw new Error(request.error?.message || "IndexedDB error");
    };
    
    return true;
  } catch (error) {
    console.error("Error generating guest sample data:", error);
    toast.error(error instanceof Error ? error.message : "Failed to create sample data");
    return false;
  }
}

// Function to generate sample data in Supabase for authenticated users
export async function generateSampleData(userId: string) {
  // For guest mode, use IndexedDB instead of Supabase
  if (userId === 'guest') {
    return generateGuestSampleData();
  }
  
  try {
    // Create each folder and store their IDs
    const folderIds = new Map<string, string>();
    
    for (const folder of sampleFolders) {
      const { data: newFolder, error: folderError } = await withRetry(() => 
        supabase
          .from('folders')
          .insert({ 
            name: folder.name, 
            user_id: userId 
          })
          .select()
          .single()
      );
      
      if (folderError) throw folderError;
      if (newFolder) {
        folderIds.set(folder.name, (newFolder as Folder).id);
      }
    }

    // Create notes for each folder
    for (const folder of sampleFolders) {
      const folderId = folderIds.get(folder.name);
      if (!folderId) continue;

      // Get notes that belong to this folder
      const notesToCreate = folder.notes.map(noteKey => {
        // Special case for welcome note
        if (noteKey === 'welcome') {
          return {
            ...welcomeNote,
            user_id: userId,
            folder_id: folderId
          };
        }
        
        const note = sampleNotes[noteKey as keyof typeof sampleNotes];
        return {
          title: note.title,
          content: note.content,
          tags: note.tags,
          user_id: userId,
          folder_id: folderId
        };
      });

      const { error: notesError } = await withRetry(() => 
        supabase
          .from('notes')
          .insert(notesToCreate)
      );
      
      if (notesError) throw notesError;
    }

    toast.success("Sample data created successfully");
    return true;
  } catch (error) {
    console.error("Error generating sample data:", error);
    toast.error(error instanceof Error ? error.message : "Failed to create sample data");
    return false;
  }
}
