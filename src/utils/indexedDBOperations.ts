
import { initializeDB } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { Note, Folder } from '@/types';
import { welcomeNote } from '@/sampleData/welcome';
import { sampleFolders, sampleNotes } from '@/sampleData/notes';
import { v4 as uuidv4 } from 'uuid';

export async function deleteGuestNote(noteId: string): Promise<boolean> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction.objectStore('notes');
    
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.delete(noteId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    toast.success("Note deleted successfully");
    return true;
  } catch (error) {
    console.error('Error deleting guest note:', error);
    toast.error("Failed to delete note");
    return false;
  }
}

export async function deleteGuestFolder(folderId: string): Promise<boolean> {
  try {
    const db = await initializeDB();
    
    // First delete all notes in the folder
    const transaction1 = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction1.objectStore('notes');
    const folderIndex = noteStore.index('folderId');
    
    const notesRequest = folderIndex.getAll(folderId);
    const notes = await new Promise<Note[]>((resolve, reject) => {
      notesRequest.onsuccess = () => resolve(notesRequest.result);
      notesRequest.onerror = () => reject(notesRequest.error);
    });
    
    // Delete each note
    for (const note of notes) {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = noteStore.delete(note.id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }
    
    // Then delete the folder
    const transaction2 = db.transaction(['folders'], 'readwrite');
    const folderStore = transaction2.objectStore('folders');
    
    await new Promise<void>((resolve, reject) => {
      const request = folderStore.delete(folderId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    toast.success("Folder and its notes deleted successfully");
    return true;
  } catch (error) {
    console.error('Error deleting guest folder:', error);
    toast.error("Failed to delete folder");
    return false;
  }
}

export async function clearGuestData(): Promise<boolean> {
  try {
    const db = await initializeDB();
    
    // Clear all notes
    const transaction1 = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction1.objectStore('notes');
    
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Clear all folders
    const transaction2 = db.transaction(['folders'], 'readwrite');
    const folderStore = transaction2.objectStore('folders');
    
    await new Promise<void>((resolve, reject) => {
      const request = folderStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Create welcome folder and note
    const success = await generateGuestSampleData();
    
    if (success) {
      toast.success("All guest data has been reset");
      return true;
    } else {
      toast.error("Failed to generate welcome data after reset");
      return false;
    }
  } catch (error) {
    console.error('Error clearing guest data:', error);
    toast.error("Failed to clear data");
    return false;
  }
}

export async function generateGuestSampleData(): Promise<boolean> {
  try {
    const db = await initializeDB();
    const now = new Date().toISOString();
    
    // Create folders and store their IDs
    const folderIds = new Map<string, string>();
    
    // Create folders one by one
    for (const folder of sampleFolders) {
      const folderId = uuidv4();
      
      const folderObj = {
        id: folderId,
        name: folder.name,
        user_id: 'guest'
      };
      
      const folderTransaction = db.transaction(['folders'], 'readwrite');
      const folderStore = folderTransaction.objectStore('folders');
      
      await new Promise<void>((resolve, reject) => {
        const request = folderStore.add(folderObj);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      folderIds.set(folder.name, folderId);
      
      // Wait for the transaction to complete
      await new Promise<void>((resolve, reject) => {
        folderTransaction.oncomplete = () => resolve();
        folderTransaction.onerror = () => reject(folderTransaction.error);
      });
    }
    
    // Create notes for each folder
    for (const folder of sampleFolders) {
      const folderId = folderIds.get(folder.name);
      if (!folderId) {
        console.error(`Folder ID not found for ${folder.name}`);
        continue;
      }
      
      // Get notes that belong to this folder
      for (const noteKey of folder.notes) {
        let noteData;
        
        // Special case for welcome note
        if (noteKey === 'welcome') {
          noteData = {
            ...welcomeNote,
            id: uuidv4(),
            folder_id: folderId,
            user_id: 'guest',
            created_at: now,
            last_reviewed_at: now
          };
        } else {
          // Get the note from sample notes
          const note = sampleNotes[noteKey as keyof typeof sampleNotes];
          if (!note) {
            console.error(`Note with key ${noteKey} not found in sampleNotes`);
            continue;
          }
          
          noteData = {
            id: uuidv4(),
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            folder_id: folderId,
            user_id: 'guest',
            created_at: now,
            last_reviewed_at: now
          };
        }
        
        console.log("Adding note to IndexedDB:", noteData);
        
        // Create a new transaction for each note
        const noteTransaction = db.transaction(['notes'], 'readwrite');
        const noteStore = noteTransaction.objectStore('notes');
        
        await new Promise<void>((resolve, reject) => {
          const request = noteStore.add(noteData);
          request.onsuccess = () => {
            console.log("Note added successfully:", request.result);
            resolve();
          };
          request.onerror = (event) => {
            console.error("Error adding note:", event);
            reject(request.error);
          };
        });
        
        // Wait for the transaction to complete
        await new Promise<void>((resolve, reject) => {
          noteTransaction.oncomplete = () => resolve();
          noteTransaction.onerror = () => reject(noteTransaction.error);
        });
      }
    }
    
    console.log("Sample data generation completed successfully");
    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    return false;
  }
}

export async function updateGuestNote(noteId: string, updates: Partial<Note>): Promise<boolean> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction.objectStore('notes');
    
    // Get existing note
    const existingNote = await new Promise<Note | undefined>((resolve, reject) => {
      const request = noteStore.get(noteId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!existingNote) {
      toast.error("Note not found");
      return false;
    }
    
    // Update the note with new values
    const updatedNote = {
      ...existingNote,
      ...updates,
      last_reviewed_at: updates.last_reviewed_at || existingNote.last_reviewed_at,
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.put(updatedNote);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Only show success toast for certain operations
    if (updates.title) {
      toast.success("Note renamed successfully");
    } else if (!updates.content) { // Don't show toast for content saves (too frequent)
      toast.success("Note updated successfully");
    }
    
    return true;
  } catch (error) {
    console.error('Error updating guest note:', error);
    toast.error("Failed to update note");
    return false;
  }
}
