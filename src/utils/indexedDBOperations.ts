import { initializeDB } from "@/lib/indexedDB";
import { toast } from "sonner";
import { Note, Folder } from "@/types";
import { welcomeNote } from "@/sampleData/welcome";
import { sampleFolders, sampleNotes } from "@/sampleData/notes";
import { v4 as uuidv4 } from "uuid";

export async function deleteGuestNote(noteId: string): Promise<boolean> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(["notes"], "readwrite");
    const noteStore = transaction.objectStore("notes");

    await new Promise<void>((resolve, reject) => {
      const request = noteStore.delete(noteId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Wait for transaction to complete before showing toast
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    toast.success("Note deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting guest note:", error);
    toast.error("Failed to delete note");
    return false;
  }
}

export async function deleteGuestFolder(folderId: string): Promise<boolean> {
  try {
    const db = await initializeDB();

    // First delete all notes in the folder
    const notesTransaction = db.transaction(["notes"], "readwrite");
    const noteStore = notesTransaction.objectStore("notes");
    const folderIndex = noteStore.index("folderId");

    const notesRequest = folderIndex.getAll(folderId);
    const notes = await new Promise<Note[]>((resolve, reject) => {
      notesRequest.onsuccess = () => resolve(notesRequest.result);
      notesRequest.onerror = () => reject(notesRequest.error);
    });

    // Delete each note in a separate operation
    for (const note of notes) {
      const deleteRequest = noteStore.delete(note.id);
      await new Promise<void>((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    }

    // Wait for notes transaction to complete before proceeding
    await new Promise<void>((resolve, reject) => {
      notesTransaction.oncomplete = () => resolve();
      notesTransaction.onerror = () => reject(notesTransaction.error);
    });

    // Then delete the folder in a new transaction
    const folderTransaction = db.transaction(["folders"], "readwrite");
    const folderStore = folderTransaction.objectStore("folders");

    await new Promise<void>((resolve, reject) => {
      const request = folderStore.delete(folderId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Wait for folder transaction to complete before showing toast
    await new Promise<void>((resolve, reject) => {
      folderTransaction.oncomplete = () => resolve();
      folderTransaction.onerror = () => reject(folderTransaction.error);
    });

    toast.success("Folder and its notes deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting guest folder:", error);
    toast.error("Failed to delete folder");
    return false;
  }
}

export async function generateWelcomeNoteOnly(): Promise<boolean> {
  try {
    const db = await initializeDB();
    // Create the welcome folder
    const folderId = "welcome-folder";
    const folder = {
      id: folderId,
      name: "Welcome",
      user_id: "guest",
    };
    const folderTransaction = db.transaction(["folders"], "readwrite");
    const folderStore = folderTransaction.objectStore("folders");
    await new Promise<void>((resolve, reject) => {
      const request = folderStore.put(folder);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      folderTransaction.oncomplete = () => resolve();
      folderTransaction.onerror = () => reject(folderTransaction.error);
    });
    // Create the welcome note
    const noteId = "welcome-note";
    const note = {
      id: noteId,
      title: welcomeNote.title,
      content: welcomeNote.content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "guest",
      folder_id: folderId,
      tags: [],
      reviewed_at: new Date().toISOString(),
      flashcards: [],
      archived: false,
    };
    const noteTransaction = db.transaction(["notes"], "readwrite");
    const noteStore = noteTransaction.objectStore("notes");
    await new Promise<void>((resolve, reject) => {
      const request = noteStore.put(note);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      noteTransaction.oncomplete = () => resolve();
      noteTransaction.onerror = () => reject(noteTransaction.error);
    });
    return true;
  } catch (error) {
    console.error("Error generating welcome note only:", error);
    return false;
  }
}

export async function clearGuestData(): Promise<boolean> {
  try {
    const db = await initializeDB();

    // Clear all notes
    const notesTransaction = db.transaction(["notes"], "readwrite");
    const noteStore = notesTransaction.objectStore("notes");

    await new Promise<void>((resolve, reject) => {
      const request = noteStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Wait for notes transaction to complete
    await new Promise<void>((resolve, reject) => {
      notesTransaction.oncomplete = () => resolve();
      notesTransaction.onerror = () => reject(notesTransaction.error);
    });

    // Clear all folders in a new transaction
    const foldersTransaction = db.transaction(["folders"], "readwrite");
    const folderStore = foldersTransaction.objectStore("folders");

    await new Promise<void>((resolve, reject) => {
      const request = folderStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Wait for folders transaction to complete
    await new Promise<void>((resolve, reject) => {
      foldersTransaction.oncomplete = () => resolve();
      foldersTransaction.onerror = () => reject(foldersTransaction.error);
    });

    // Do NOT generate welcome note or any sample data after clearing. Leave state empty.
    toast.success("All guest data has been reset");
    return true;
  } catch (error) {
    console.error("Error clearing guest data:", error);
    toast.error("Failed to clear data");
    return false;
  }
}

export async function generateGuestSampleData(): Promise<boolean> {
  // Prevent duplicate generation for authenticated users
  if (
    typeof window !== "undefined" &&
    localStorage.getItem("sampleDataGenerated") === "true"
  ) {
    return false;
  }
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
        user_id: "guest",
      };

      const folderTransaction = db.transaction(["folders"], "readwrite");
      const folderStore = folderTransaction.objectStore("folders");

      await new Promise<void>((resolve, reject) => {
        const request = folderStore.add(folderObj);
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error("Error adding folder:", request.error);
          reject(request.error);
        };
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
        if (noteKey === "welcome") {
          noteData = {
            ...welcomeNote,
            id: uuidv4(),
            folder_id: folderId,
            user_id: "guest",
            created_at: now,
            last_reviewed_at: now,
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
            user_id: "guest",
            created_at: now,
            last_reviewed_at: now,
          };
        }

        console.log("Adding note to IndexedDB:", noteData);

        // Use a transaction that is forced to complete before continuing
        const noteTransaction = db.transaction(["notes"], "readwrite");
        const noteStore = noteTransaction.objectStore("notes");

        try {
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

          // Wait for the transaction to complete before continuing
          await new Promise<void>((resolve, reject) => {
            noteTransaction.oncomplete = () => resolve();
            noteTransaction.onerror = () => reject(noteTransaction.error);
          });
        } catch (err) {
          console.error("Error in note transaction:", err);
          // Continue with other notes even if one fails
        }
      }
    }

    console.log("Sample data generation completed successfully");
    return true;
  } catch (error) {
    console.error("Error generating sample data:", error);
    return false;
  }
}

export async function updateGuestNote(
  noteId: string,
  updates: Partial<Note>
): Promise<boolean> {
  try {
    const db = await initializeDB();
    const transaction = db.transaction(["notes"], "readwrite");
    const noteStore = transaction.objectStore("notes");

    // Get existing note
    const existingNote = await new Promise<Note | undefined>(
      (resolve, reject) => {
        const request = noteStore.get(noteId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    );

    if (!existingNote) {
      toast.error("Note not found");
      return false;
    }

    // Update the note with new values
    const updatedNote = {
      ...existingNote,
      ...updates,
      last_reviewed_at:
        updates.last_reviewed_at || existingNote.last_reviewed_at,
    };

    await new Promise<void>((resolve, reject) => {
      const request = noteStore.put(updatedNote);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Only show success toast for certain operations
    if (updates.title) {
      toast.success("Note renamed successfully");
    } else if (!updates.content) {
      // Don't show toast for content saves (too frequent)
      toast.success("Note updated successfully");
    }

    return true;
  } catch (error) {
    console.error("Error updating guest note:", error);
    toast.error("Failed to update note");
    return false;
  }
}
