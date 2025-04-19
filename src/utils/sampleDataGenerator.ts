
import { supabase, withRetry } from "@/integrations/supabase/client";
import { Folder } from "@/types";
import { toast } from "sonner";

export async function generateSampleData(userId: string) {
  try {
    // Create Web Development folder
    const { data: webDevFolder, error: webDevError } = await withRetry(() => 
      supabase
        .from('folders')
        .insert({ 
          name: 'Web Development', 
          user_id: userId 
        })
        .select()
        .single()
    );
    
    if (webDevError) throw webDevError;

    // Create React Essentials folder
    const { data: reactFolder, error: reactError } = await withRetry(() => 
      supabase
        .from('folders')
        .insert({ 
          name: 'React Essentials', 
          user_id: userId 
        })
        .select()
        .single()
    );
    
    if (reactError) throw reactError;

    // Add sample notes to Web Development folder
    if (webDevFolder) {
      const { error: webNotesError } = await withRetry(() => 
        supabase
          .from('notes')
          .insert([
            { 
              title: 'JavaScript Best Practices', 
              content: '# JavaScript Best Practices\n\n1. Use const and let\n2. Write clean functions\n3. Handle errors properly',
              tags: ['javascript', 'programming', 'best-practices'],
              user_id: userId,
              folder_id: (webDevFolder as Folder).id
            },
            { 
              title: 'CSS Grid Layout Guide', 
              content: '# CSS Grid Layout\n\nCSS Grid is a powerful tool for creating two-dimensional layouts.',
              tags: ['css', 'web-development', 'layout'],
              user_id: userId,
              folder_id: (webDevFolder as Folder).id
            }
          ])
      );
      
      if (webNotesError) throw webNotesError;
    }

    // Add sample notes to React folder
    if (reactFolder) {
      const { error: reactNotesError } = await withRetry(() => 
        supabase
          .from('notes')
          .insert([
            { 
              title: 'React Hooks Overview', 
              content: '# React Hooks\n\nHooks are functions that let you "hook into" React state and lifecycle features.',
              tags: ['react', 'hooks', 'frontend'],
              user_id: userId,
              folder_id: (reactFolder as Folder).id
            },
            { 
              title: 'State Management in React', 
              content: '# State Management\n\nLearn about different state management approaches in React applications.',
              tags: ['react', 'state-management', 'frontend'],
              user_id: userId,
              folder_id: (reactFolder as Folder).id
            }
          ])
      );
      
      if (reactNotesError) throw reactNotesError;
    }

    toast.success("Sample data created successfully");
    return true;
  } catch (error) {
    console.error("Error generating sample data:", error);
    toast.error(error instanceof Error ? error.message : "Failed to create sample data");
    return false;
  }
}

