
import { initializeDB } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { Note } from '@/types';

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
