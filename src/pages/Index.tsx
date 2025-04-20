import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { NoteView } from "@/components/NoteView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Folder, Note } from "@/types";
import { addDays, subWeeks } from "date-fns";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchCommand } from "@/components/SearchCommand";

const sampleNotes: Note[] = [
  {
    id: "1",
    title: "Getting Started with Markdown",
    content: "# Markdown Basics\n\nMarkdown is a lightweight markup language with plain text formatting syntax. It's designed so that it can be converted to HTML and many other formats.\n\n## Basic Syntax\n\n### Headers\n\n# H1\n## H2\n### H3\n\n### Emphasis\n\n*italic* or _italic_\n\n**bold** or __bold__\n\n### Lists\n\nUnordered:\n- Item 1\n- Item 2\n  - Item 2a\n  - Item 2b\n\nOrdered:\n1. Item 1\n2. Item 2\n\n### Links\n\n[Link Text](http://example.com)\n\n### Images\n\n![Alt Text](http://example.com/image.jpg)\n\n### Code\n\nInline `code` has backticks.\n\n```\ncode blocks\ncan be fenced\n```\n\n### Blockquotes\n\n> This is a blockquote.",
    tags: ["markdown", "tutorial", "programming"],
    created_at: subWeeks(new Date(), 2).toISOString(),
    last_reviewed_at: subWeeks(new Date(), 2).toISOString(),
    folder_id: "1"
  },
  {
    id: "2",
    title: "React Hooks Overview",
    content: "# React Hooks\n\nHooks are a new addition in React 16.8 that let you use state and other React features without writing a class.\n\n## Basic Hooks\n\n### useState\n\n```jsx\nimport React, { useState } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n### useEffect\n\nThe Effect Hook lets you perform side effects in function components:\n\n```jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  // Similar to componentDidMount and componentDidUpdate:\n  useEffect(() => {\n    document.title = `You clicked ${count} times`;\n  });\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n### useContext\n\nAccepts a context object and returns the current context value:\n\n```jsx\nconst value = useContext(MyContext);\n```",
    tags: ["react", "hooks", "javascript", "frontend"],
    created_at: subWeeks(new Date(), 1).toISOString(),
    last_reviewed_at: subWeeks(new Date(), 1).toISOString(),
    folder_id: "1"
  },
  {
    id: "3",
    title: "TypeScript Interfaces vs Types",
    content: "# TypeScript: Interfaces vs Types\n\nBoth interfaces and types allow for describing the shape of objects in TypeScript, but they have some key differences.\n\n## Interfaces\n\n```typescript\ninterface Person {\n  name: string;\n  age: number;\n}\n\ninterface Student extends Person {\n  studentId: string;\n}\n```\n\n## Types\n\n```typescript\ntype Person = {\n  name: string;\n  age: number;\n};\n\ntype Student = Person & {\n  studentId: string;\n};\n```\n\n## Key Differences\n\n### Declaration Merging\n\nInterfaces can be extended through declaration merging:\n\n```typescript\ninterface Window {\n  title: string;\n}\n\ninterface Window {\n  ts: number;\n}\n\n// Window now has both title and ts properties\n```\n\nTypes cannot be reopened to add new properties.\n\n### Computed Properties\n\nTypes can use computed properties:\n\n```typescript\ntype Keys = 'firstName' | 'lastName';\n\ntype Person = {\n  [key in Keys]: string;\n};\n\n// equivalent to:\n// type Person = {\n//   firstName: string;\n//   lastName: string;\n// };\n```\n\n### Primitives and Unions\n\nTypes are more flexible, allowing for primitives, unions, and tuples:\n\n```typescript\ntype Name = string;\ntype NameOrAge = string | number;\ntype Coordinates = [number, number];\n```\n\n### Performance\n\nInterfaces are generally preferred for object shapes as they can be optimized better by the TypeScript compiler.\n\n## When to Use Each\n\n- **Interfaces**: When defining object shapes, especially public APIs\n- **Types**: When you need unions, primitives, or more complex types",
    tags: ["typescript", "programming", "interfaces"],
    created_at: subWeeks(new Date(), 3).toISOString(),
    last_reviewed_at: subWeeks(new Date(), 3).toISOString(),
    folder_id: "2"
  },
  {
    id: "4",
    title: "CSS Grid Layout",
    content: "# CSS Grid Layout\n\nCSS Grid Layout is a two-dimensional grid-based layout system aimed at web page design.\n\n## Basic Usage\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  grid-template-rows: auto;\n  gap: 10px;\n}\n```\n\n## Grid Container Properties\n\n- `display: grid` - Defines the element as a grid container\n- `grid-template-columns` - Defines the columns of the grid\n- `grid-template-rows` - Defines the rows of the grid\n- `gap` - Defines the gap between grid items\n\n## Grid Item Properties\n\n- `grid-column` - Specifies which column(s) the item will span\n- `grid-row` - Specifies which row(s) the item will span\n\n## Example Layout\n\n```html\n<div class=\"container\">\n  <header class=\"header\">Header</header>\n  <nav class=\"sidebar\">Sidebar</nav>\n  <main class=\"main\">Main Content</main>\n  <footer class=\"footer\">Footer</footer>\n</div>\n```\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: 1fr 3fr;\n  grid-template-rows: auto 1fr auto;\n  grid-template-areas:\n    \"header header\"\n    \"sidebar main\"\n    \"footer footer\";\n  min-height: 100vh;\n}\n\n.header {\n  grid-area: header;\n}\n\n.sidebar {\n  grid-area: sidebar;\n}\n\n.main {\n  grid-area: main;\n}\n\n.footer {\n  grid-area: footer;\n}\n```\n\n## Advanced Features\n\n### Auto-Fill and Auto-Fit\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n}\n```\n\n### Alignment\n\n```css\n.container {\n  justify-items: center; /* horizontal alignment */\n  align-items: center; /* vertical alignment */\n  place-items: center; /* shorthand for both */\n}\n```",
    tags: ["css", "grid", "web", "layout"],
    created_at: subWeeks(new Date(), 4).toISOString(),
    last_reviewed_at: addDays(new Date(), -2).toISOString(),
    folder_id: "2"
  },
  {
    id: "5",
    title: "JavaScript Async/Await",
    content: "# Asynchronous JavaScript with Async/Await\n\nAsync/await is syntactic sugar over JavaScript Promises, making asynchronous code easier to write and understand.\n\n## Basic Syntax\n\n```javascript\nasync function fetchData() {\n  try {\n    const response = await fetch('https://api.example.com/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error fetching data:', error);\n  }\n}\n```\n\n## Key Features\n\n### Error Handling\n\nWith async/await, you can use traditional try/catch blocks for error handling:\n\n```javascript\nasync function fetchUserData(userId) {\n  try {\n    const response = await fetch(`https://api.example.com/users/${userId}`);\n    \n    if (!response.ok) {\n      throw new Error(`HTTP error! status: ${response.status}`);\n    }\n    \n    const userData = await response.json();\n    return userData;\n  } catch (error) {\n    console.error('There was a problem fetching the user data:', error);\n  }\n}\n```\n\n### Sequential vs Parallel Execution\n\n**Sequential execution:**\n\n```javascript\nasync function sequential() {\n  const result1 = await asyncOperation1();\n  const result2 = await asyncOperation2(result1);\n  return result2;\n}\n```\n\n**Parallel execution:**\n\n```javascript\nasync function parallel() {\n  const promise1 = asyncOperation1();\n  const promise2 = asyncOperation2();\n  \n  // Both operations are initiated before awaiting\n  const [result1, result2] = await Promise.all([promise1, promise2]);\n  \n  return { result1, result2 };\n}\n```\n\n## Using with Array Methods\n\n```javascript\nasync function processArray(items) {\n  // Sequential processing\n  for (const item of items) {\n    await processItem(item);\n  }\n  \n  // Parallel processing\n  const promises = items.map(item => processItem(item));\n  const results = await Promise.all(promises);\n}\n```\n\n## Async IIFE (Immediately Invoked Function Expression)\n\n```javascript\n(async function() {\n  const data = await fetchData();\n  console.log(data);\n})();\n```",
    tags: ["javascript", "async", "promises", "programming"],
    created_at: subWeeks(new Date(), 2).toISOString(),
    last_reviewed_at: addDays(new Date(), -5).toISOString(),
    folder_id: "1"
  }
];

const sampleFolders: Folder[] = [
  {
    id: "1",
    name: "Web Development",
    notes: sampleNotes.filter(note => note.folder_id === "1"),
  },
  {
    id: "2",
    name: "Frontend Essentials",
    notes: sampleNotes.filter(note => note.folder_id === "2"),
  }
];

export default function Index() {
  const { mode, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mode) {
      navigate('/auth');
    }
  }, [mode, navigate]);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'notes' | 'review'>('notes');
  const allNotes = folders.flatMap(folder => folder.notes);

  const fetchUserData = useCallback(async () => {
    if (mode === 'authenticated' && user) {
      try {
        const { data: folderData, error: folderError } = await withRetry(() => 
          supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
        );

        if (folderError) {
          console.error("Error fetching folders:", folderError);
          toast.error("Failed to load folders", {
            description: folderError.message
          });
          
          setFolders(sampleFolders);
          return;
        }

        const typedFolderData = folderData as Array<{
          id: string;
          name: string;
        }> | null;

        if (!typedFolderData || typedFolderData.length === 0) {
          await createDefaultFolders(user.id);
          return;
        }

        const { data: noteData, error: noteError } = await withRetry(() => 
          supabase
            .from('notes')
            .select('*')
            .eq('user_id', user.id)
        );

        if (noteError) {
          console.error("Error fetching notes:", noteError);
          toast.error("Failed to load notes", {
            description: noteError.message
          });
          return;
        }

        const typedNoteData = noteData as Array<{
          id: string;
          title: string;
          content: string;
          tags: string[];
          created_at: string;
          last_reviewed_at: string;
          folder_id: string;
          priority?: string;
        }> | null;

        const userFolders: Folder[] = typedFolderData.map(folder => ({
          id: folder.id,
          name: folder.name,
          notes: (typedNoteData || [])
            .filter(note => note.folder_id === folder.id)
            .map(note => ({
              ...note,
              priority: note.priority as 'high' | 'medium' | 'low' | undefined
            })) || []
        }));

        setFolders(userFolders);
        
        if (!activeNoteId && userFolders[0]?.notes.length > 0) {
          setActiveNoteId(userFolders[0].notes[0].id);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
        toast.error("Something went wrong loading your data");
        setFolders(sampleFolders);
      }
    } else if (mode === 'guest') {
      setFolders(sampleFolders);
      
      if (!activeNoteId && sampleFolders[0]?.notes.length > 0) {
        setActiveNoteId(sampleFolders[0].notes[0].id);
      }
    }
  }, [mode, user, activeNoteId]);
  
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const createDefaultFolders = async (userId: string) => {
    try {
      const folderPromises = sampleFolders.map(folder => 
        withRetry(() => 
          supabase
            .from('folders')
            .insert({
              name: folder.name,
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
        const sampleFolderNotes = sampleNotes.filter(
          note => note.folder_id === sampleFolders.find(f => f.name === folder.name)?.id
        );
        
        for (const note of sampleFolderNotes) {
          await withRetry(() => 
            supabase
              .from('notes')
              .insert({
                title: note.title,
                content: note.content,
                tags: note.tags,
                folder_id: folder.id,
                user_id: userId,
                created_at: new Date().toISOString(),
                last_reviewed_at: new Date().toISOString()
              })
          );
        }
      }
      
      toast.success("Created default folders and notes");
      
      fetchUserData();
    } catch (error) {
      console.error("Error creating default data:", error);
      toast.error("Failed to create default data");
    }
  };

  useEffect(() => {
    if (allNotes.length > 0 && !activeNoteId) {
      // Find the welcome note if it exists
      const welcomeNote = allNotes.find(note => note.title === "Welcome to NoteFlow");
      const firstNoteId = welcomeNote ? welcomeNote.id : allNotes[0].id;
      setActiveNoteId(firstNoteId);
      setActiveNote(allNotes.find(note => note.id === firstNoteId) || null);
    }
  }, [allNotes, activeNoteId]);

  useEffect(() => {
    if (activeNoteId) {
      const foundNote = allNotes.find(note => note.id === activeNoteId);
      setActiveNote(foundNote || null);
    } else {
      setActiveNote(null);
    }
  }, [activeNoteId, allNotes]);

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleViewModeChange = (newMode: 'notes' | 'review') => {
    setViewMode(newMode);
  };

  const handleReview = async (noteId: string) => {
    console.log("handleReview called in Index.tsx for note:", noteId);
    const now = new Date().toISOString();
    
    const updatedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => 
        note.id === noteId 
          ? { ...note, last_reviewed_at: now, priority: null } 
          : note
      )
    }));
    
    setFolders(updatedFolders);
    console.log("Updated folders in local state with null priority for note:", noteId);
    
    if (mode === 'authenticated' && user) {
      try {
        const { error } = await withRetry(() => 
          supabase
            .from('notes')
            .update({ 
              last_reviewed_at: now,
              priority: null  // Explicitly set priority to null
            })
            .eq('id', noteId)
            .eq('user_id', user.id)
        );
          
        if (error) {
          console.error("Error updating review time and priority:", error);
          toast.error("Failed to sync review status");
        } else {
          console.log("Successfully updated review time and priority in Supabase");
        }
      } catch (error) {
        console.error("Exception when updating review time and priority:", error);
      }
    }
  };

  const handleNoteUpdate = async (noteId: string, updates: Partial<Note>) => {
    console.log("handleNoteUpdate called with:", noteId, updates);
    
    const updatedFolders = folders.map(folder => ({
      ...folder,
      notes: folder.notes.map(note => 
        note.id === noteId 
          ? { ...note, ...updates } 
          : note
      )
    }));
    
    setFolders(updatedFolders);
    console.log("Updated folders in local state with updates for note:", noteId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        folders={folders}
        activeNoteId={activeNoteId}
        onNoteSelect={handleNoteSelect}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        refreshFolders={fetchUserData}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b p-4 flex justify-end">
          <SearchCommand 
            notes={allNotes} 
            onNoteSelect={handleNoteSelect}
          />
        </div>
        {viewMode === 'notes' ? (
          <NoteView 
            note={activeNote} 
            onReview={handleReview}
            onUpdateNote={handleNoteUpdate}
          />
        ) : (
          <KanbanBoard 
            notes={allNotes} 
            onNoteSelect={handleNoteSelect}
            onReview={handleReview}
            onViewModeChange={handleViewModeChange}
          />
        )}
      </div>
    </div>
  );
}
