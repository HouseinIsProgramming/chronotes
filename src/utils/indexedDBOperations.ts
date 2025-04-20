
import { initializeDB } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { Note, Folder } from '@/types';
import { welcomeNote } from '@/sampleData/welcome';
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
    await generateGuestSampleData();
    
    toast.success("All guest data has been reset");
    return true;
  } catch (error) {
    console.error('Error clearing guest data:', error);
    toast.error("Failed to clear data");
    return false;
  }
}

export async function generateGuestSampleData(): Promise<boolean> {
  try {
    const db = await initializeDB();
    
    // Create welcome folder
    const folderId = uuidv4();
    const transaction1 = db.transaction(['folders'], 'readwrite');
    const folderStore = transaction1.objectStore('folders');
    
    const folder = {
      id: folderId,
      name: 'Welcome',
      user_id: 'guest'
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = folderStore.add(folder);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Create welcome note
    const noteId = uuidv4();
    const transaction2 = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction2.objectStore('notes');
    
    const now = new Date().toISOString();
    const note = {
      id: noteId,
      title: welcomeNote.title,
      content: welcomeNote.content,
      tags: welcomeNote.tags,
      folder_id: folderId,
      user_id: 'guest',
      created_at: now,
      last_reviewed_at: now
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.add(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    toast.success("Sample data generated successfully");
    return true;
  } catch (error) {
    console.error('Error generating sample data:', error);
    toast.error("Failed to generate sample data");
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
