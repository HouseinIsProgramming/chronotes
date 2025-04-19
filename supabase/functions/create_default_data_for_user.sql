
CREATE OR REPLACE FUNCTION public.create_default_data_for_user(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  web_dev_folder_id uuid;
  frontend_folder_id uuid;
BEGIN
  -- Create Web Development folder
  INSERT INTO public.folders (id, name, user_id)
  VALUES (gen_random_uuid(), 'Web Development', user_id_param)
  RETURNING id INTO web_dev_folder_id;

  -- Create Frontend Essentials folder
  INSERT INTO public.folders (id, name, user_id)
  VALUES (gen_random_uuid(), 'Frontend Essentials', user_id_param)
  RETURNING id INTO frontend_folder_id;

  -- Insert example notes into Web Development folder
  INSERT INTO public.notes (
    title, content, tags, folder_id, user_id
  ) VALUES 
  ('Getting Started with Markdown', 
   '# Markdown Basics\n\nMarkdown is a lightweight markup language with plain text formatting syntax...', 
   ARRAY['markdown', 'tutorial', 'programming'],
   web_dev_folder_id,
   user_id_param),
  ('React Hooks Overview',
   '# React Hooks\n\nHooks are a new addition in React 16.8 that let you use state and other React features...',
   ARRAY['react', 'hooks', 'javascript', 'frontend'],
   web_dev_folder_id,
   user_id_param);

  -- Insert example notes into Frontend Essentials folder
  INSERT INTO public.notes (
    title, content, tags, folder_id, user_id
  ) VALUES 
  ('TypeScript Interfaces vs Types',
   '# TypeScript: Interfaces vs Types\n\nBoth interfaces and types allow for describing the shape of objects...',
   ARRAY['typescript', 'programming', 'interfaces'],
   frontend_folder_id,
   user_id_param),
  ('CSS Grid Layout',
   '# CSS Grid Layout\n\nCSS Grid Layout is a two-dimensional grid-based layout system aimed at web page design...',
   ARRAY['css', 'grid', 'web', 'layout'],
   frontend_folder_id,
   user_id_param);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_default_data_for_user(uuid) TO authenticated;
