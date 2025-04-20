
import { initializeDB } from '@/lib/indexedDB';
import { sampleFolders, sampleNotes } from '@/sampleData/notes';
import { welcomeNote } from '@/sampleData/welcome';
import { toast } from "sonner";

export async function generateGuestSampleData() {
  try {
    const db = await initializeDB();
    
    // Clear existing data first
    await clearGuestData();

    // Create transaction for both stores
    const transaction = db.transaction(['folders', 'notes'], 'readwrite');
    const folderStore = transaction.objectStore('folders');
    const noteStore = transaction.objectStore('notes');

    // Create each folder and store their IDs
    const folderPromises = sampleFolders.map(folder => {
      const folderId = crypto.randomUUID();
      return folderStore.add({
        id: folderId,
        name: folder.name
      });
    });

    await Promise.all(folderPromises);

    // Get all folders to map notes
    const foldersRequest = folderStore.getAll();
    const folders = await new Promise((resolve) => {
      foldersRequest.onsuccess = () => resolve(foldersRequest.result);
    });

    // Create notes for each folder
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const sampleFolder = sampleFolders[i];

      for (const noteKey of sampleFolder.notes) {
        const noteId = crypto.randomUUID();
        if (noteKey === 'welcome') {
          await noteStore.add({
            id: noteId,
            title: welcomeNote.title,
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
          await noteStore.add({
            id: noteId,
            title: note.title,
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
