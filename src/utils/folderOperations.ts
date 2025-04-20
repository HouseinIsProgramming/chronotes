
import { supabase, withRetry } from "@/integrations/supabase/client";
import { sampleFolders, sampleNotes } from "@/sampleData/notes";
import { welcomeNote } from "@/sampleData/welcome";
import { toast } from "sonner";

export const createDefaultFolders = async (userId: string) => {
  try {
    const folderPromises = sampleFolders.map(folderData => 
      withRetry(() => 
        supabase
          .from('folders')
          .insert({
            name: folderData.name,
            user_id: userId
          })
          .select()
      )
    );
    
    const folderResults = await Promise.all(folderPromises);
    
    const newFolders = folderResults
      .map(result => {
        const data = result.data as Array<{ id: string; name: string }> | null;
        return data && data[0];
      })
      .filter(Boolean);
    
    for (const folder of newFolders) {
      const correspondingFolder = sampleFolders.find(f => f.name === folder.name);
      
      if (correspondingFolder) {
        const noteKeysForFolder = correspondingFolder.notes;
        
        for (const noteKey of noteKeysForFolder) {
          if (noteKey === 'welcome') {
            await withRetry(() => 
              supabase
                .from('notes')
                .insert({
                  title: welcomeNote.title,
                  content: welcomeNote.content,
                  tags: welcomeNote.tags,
                  folder_id: folder.id,
                  user_id: userId,
                  created_at: new Date().toISOString(),
                  last_reviewed_at: new Date().toISOString()
                })
            );
            continue;
          }
          
          const noteData = sampleNotes[noteKey as keyof typeof sampleNotes];
          if (noteData) {
            await withRetry(() => 
              supabase
                .from('notes')
                .insert({
                  title: noteData.title,
                  content: noteData.content,
                  tags: noteData.tags,
                  folder_id: folder.id,
                  user_id: userId,
                  created_at: new Date().toISOString(),
                  last_reviewed_at: new Date().toISOString()
                })
            );
          }
        }
      }
    }
    
    toast.success("Created default folders and notes");
    return true;
  } catch (error) {
    console.error("Error creating default data:", error);
    toast.error("Failed to create default data");
    return false;
  }
};
