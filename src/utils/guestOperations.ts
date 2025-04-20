
import { initializeDB } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { getUniqueNameInList } from './nameUtils';
import { Note } from '@/types';

export async function createGuestFolder(name: string): Promise<string | null> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['folders'], 'readwrite');
    const folderStore = transaction.objectStore('folders');
    
    // Get existing folder names
    const existingFolders = await new Promise<Array<{name: string}>>((resolve, reject) => {
      const request = folderStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const existingNames = existingFolders.map(f => f.name);
    const uniqueName = getUniqueNameInList(name, existingNames);
    
    const folderId = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const request = folderStore.add({
        id: folderId,
        name: uniqueName
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    toast.success("Folder created successfully");
    return folderId;
  } catch (error) {
    console.error('Error creating guest folder:', error);
    toast.error("Failed to create folder");
    return null;
  }
}

export async function renameGuestFolder(folderId: string, newName: string): Promise<boolean> {
  try {
    const db = await initializeDB();
    
    // First get all folders to check for duplicate names
    const transaction1 = db.transaction(['folders'], 'readonly');
    const folderStore1 = transaction1.objectStore('folders');
    
    const existingFolders = await new Promise<Array<{id: string, name: string}>>((resolve, reject) => {
      const request = folderStore1.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Filter out the current folder from name checking
    const otherFolderNames = existingFolders
      .filter(f => f.id !== folderId)
      .map(f => f.name);
    
    // Generate a unique name if needed
    const uniqueName = getUniqueNameInList(newName, otherFolderNames);
    
    // Now update the folder with the unique name
    const transaction2 = db.transaction(['folders'], 'readwrite');
    const folderStore2 = transaction2.objectStore('folders');
    
    // Get the folder to update
    const folder = await new Promise<{id: string, name: string} | undefined>((resolve, reject) => {
      const request = folderStore2.get(folderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!folder) {
      toast.error("Folder not found");
      return false;
    }
    
    // Update the folder name
    await new Promise<void>((resolve, reject) => {
      const request = folderStore2.put({
        ...folder,
        name: uniqueName
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    toast.success("Folder renamed successfully");
    return true;
  } catch (error) {
    console.error('Error renaming guest folder:', error);
    toast.error("Failed to rename folder");
    return false;
  }
}

export async function createGuestNote(folderId: string, title: string): Promise<string | null> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['notes'], 'readwrite');
    const noteStore = transaction.objectStore('notes');
    
    // Get existing note titles in the folder
    const existingNotes = await new Promise<Note[]>((resolve, reject) => {
      const request = noteStore.index('folderId').getAll(folderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const existingTitles = existingNotes.map(n => n.title);
    const uniqueTitle = getUniqueNameInList(title, existingTitles);
    
    const noteId = crypto.randomUUID();
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.add({
        id: noteId,
        title: uniqueTitle,
        content: '',
        folder_id: folderId,
        tags: [],
        created_at: new Date().toISOString(),
        last_reviewed_at: new Date().toISOString()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    toast.success("Note created successfully");
    return noteId;
  } catch (error) {
    console.error('Error creating guest note:', error);
    toast.error("Failed to create note");
    return null;
  }
}

export async function renameGuestNote(noteId: string, newTitle: string, folderId: string): Promise<boolean> {
  try {
    const db = await initializeDB();
    
    // First get all notes in the same folder to check for duplicate titles
    const transaction1 = db.transaction(['notes'], 'readonly');
    const noteStore1 = transaction1.objectStore('notes');
    
    const existingNotes = await new Promise<Note[]>((resolve, reject) => {
      const request = noteStore1.index('folderId').getAll(folderId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    // Filter out the current note from title checking
    const otherNoteTitles = existingNotes
      .filter(n => n.id !== noteId)
      .map(n => n.title);
    
    // Generate a unique title if needed
    const uniqueTitle = getUniqueNameInList(newTitle, otherNoteTitles);
    
    // Now update the note with the unique title
    const transaction2 = db.transaction(['notes'], 'readwrite');
    const noteStore2 = transaction2.objectStore('notes');
    
    // Get the note to update
    const note = await new Promise<Note | undefined>((resolve, reject) => {
      const request = noteStore2.get(noteId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    if (!note) {
      toast.error("Note not found");
      return false;
    }
    
    // Update the note title
    await new Promise<void>((resolve, reject) => {
      const request = noteStore2.put({
        ...note,
        title: uniqueTitle
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    toast.success("Note renamed successfully");
    return true;
  } catch (error) {
    console.error('Error renaming guest note:', error);
    toast.error("Failed to rename note");
    return false;
  }
}
