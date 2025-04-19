
import { supabase, withRetry } from "@/integrations/supabase/client";
import { Folder } from "@/types";
import { toast } from "sonner";
import { sampleFolders, sampleNotes } from "@/sampleData/notes";

export async function generateSampleData(userId: string) {
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

