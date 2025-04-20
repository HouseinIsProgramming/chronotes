import { initializeDB } from '@/lib/indexedDB';
import { sampleFolders, sampleNotes } from '@/sampleData/notes';
import { welcomeNote } from '@/sampleData/welcome';
import { toast } from "sonner";
import { getUniqueNameInList } from './nameUtils';

export async function generateGuestSampleData() {
  try {
    const db = await initializeDB();
    
    // Clear existing data first
    await clearGuestData();

    // Get existing folder names first
    const transaction = db.transaction(['folders'], 'readonly');
    const folderStore = transaction.objectStore('folders');
    const existingFolders = await new Promise<Array<{name: string}>>((resolve, reject) => {
      const request = folderStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const existingFolderNames = existingFolders.map(f => f.name);

    // Create transaction for both stores
    const writeTransaction = db.transaction(['folders', 'notes'], 'readwrite');
    const writeFolderStore = writeTransaction.objectStore('folders');
    const noteStore = writeTransaction.objectStore('notes');

    // Create each folder with unique names
    const folderPromises = sampleFolders.map(folder => {
      const uniqueFolderName = getUniqueNameInList(folder.name, existingFolderNames);
      existingFolderNames.push(uniqueFolderName); // Add to list for next iterations
      
      const folderId = crypto.randomUUID();
      return writeFolderStore.add({
        id: folderId,
        name: uniqueFolderName
      });
    });

    await Promise.all(folderPromises);

    // Get all folders to map notes
    const foldersRequest = writeFolderStore.getAll();
    const foldersPromise = new Promise<Array<{id: string, name: string}>>((resolve, reject) => {
      foldersRequest.onsuccess = () => resolve(foldersRequest.result);
      foldersRequest.onerror = () => reject(foldersRequest.error);
    });
    
    const folders = await foldersPromise;

    // Create notes for each folder
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const sampleFolder = sampleFolders[i];

      // Get existing notes in this folder
      const existingNotesRequest = noteStore.index('folderId').getAll(folder.id);
      const existingNotes = await new Promise<Array<{title: string}>>((resolve, reject) => {
        existingNotesRequest.onsuccess = () => resolve(existingNotesRequest.result);
        existingNotesRequest.onerror = () => reject(existingNotesRequest.error);
      });
      
      const existingNoteTitles = existingNotes.map(n => n.title);

      for (const noteKey of sampleFolder.notes) {
        const noteId = crypto.randomUUID();
        if (noteKey === 'welcome') {
          const uniqueTitle = getUniqueNameInList(welcomeNote.title, existingNoteTitles);
          existingNoteTitles.push(uniqueTitle);
          
          await noteStore.add({
            id: noteId,
            title: uniqueTitle,
            content: welcomeNote.content,
            tags: welcomeNote.tags,
            folder_id: folder.id,
            created_at: new Date().toISOString(),
            last_reviewed_at: new Date().toISOString()
          });
          continue;
        }

        const note = sampleNotes[noteKey as keyof typeof sampleNotes];
        if (note) {
          const uniqueTitle = getUniqueNameInList(note.title, existingNoteTitles);
          existingNoteTitles.push(uniqueTitle);
          
          await noteStore.add({
            id: noteId,
            title: uniqueTitle,
            content: note.content,
            tags: note.tags,
            folder_id: folder.id,
            created_at: new Date().toISOString(),
            last_reviewed_at: new Date().toISOString()
          });
        }
      }
    }

    toast.success("Sample data generated successfully");
    return true;
  } catch (error) {
    console.error("Error generating sample data:", error);
    toast.error("Failed to generate sample data");
    return false;
  }
}

export async function clearGuestData() {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(['folders', 'notes'], 'readwrite');
    
    // Clear both stores
    await Promise.all([
      transaction.objectStore('folders').clear(),
      transaction.objectStore('notes').clear()
    ]);

    // Create a Welcome folder
    const welcomeFolderId = crypto.randomUUID();
    const folderStore = transaction.objectStore('folders');
    await folderStore.add({
      id: welcomeFolderId,
      name: 'Welcome'
    });

    // Add welcome note
    const noteStore = transaction.objectStore('notes');
    await noteStore.add({
      id: crypto.randomUUID(),
      title: welcomeNote.title,
      content: welcomeNote.content,
      tags: welcomeNote.tags,
      folder_id: welcomeFolderId,
      created_at: new Date().toISOString(),
      last_reviewed_at: new Date().toISOString()
    });

    toast.success("All data has been reset to default state");
    return true;
  } catch (error) {
    console.error("Error clearing data:", error);
    toast.error("Failed to clear data");
    return false;
  }
}
