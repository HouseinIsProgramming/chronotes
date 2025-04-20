
import { initializeDB } from '@/lib/indexedDB';
import { Note, Folder } from '@/types';
import { getUniqueNameInList } from './nameUtils';

export async function createGuestFolder(name: string): Promise<Folder> {
  const db = await initializeDB();
  const transaction = db.transaction(['folders'], 'readwrite');
  const folderStore = transaction.objectStore('folders');
  
  // Get existing folders to check for name duplicates
  const existingFolders = await new Promise<Array<{name: string}>>((resolve, reject) => {
    const request = folderStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const existingFolderNames = existingFolders.map(f => f.name);
  const uniqueFolderName = getUniqueNameInList(name, existingFolderNames);
  
  const newFolder: Folder = {
    id: crypto.randomUUID(),
    name: uniqueFolderName,
    notes: []
  };

  return new Promise((resolve, reject) => {
    const request = folderStore.add(newFolder);
    request.onsuccess = () => resolve(newFolder);
    request.onerror = () => reject(request.error);
  });
}

export async function createGuestNote(title: string, folderId: string): Promise<Note> {
  const db = await initializeDB();
  const transaction = db.transaction(['notes'], 'readwrite');
  const noteStore = transaction.objectStore('notes');
  
  // Get existing notes in this folder to check for title duplicates
  const existingNotes = await new Promise<Array<{title: string}>>((resolve, reject) => {
    const request = noteStore.index('folderId').getAll(folderId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const existingNoteTitles = existingNotes.map(n => n.title);
  const uniqueTitle = getUniqueNameInList(title, existingNoteTitles);
  
  const newNote: Note = {
    id: crypto.randomUUID(),
    title: uniqueTitle,
    content: '',
    folder_id: folderId,
    tags: [],
    created_at: new Date().toISOString(),
    last_reviewed_at: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const request = noteStore.add(newNote);
    request.onsuccess = () => resolve(newNote);
    request.onerror = () => reject(request.error);
  });
}
