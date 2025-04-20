
import { useEffect, useRef } from 'react';
import { Note } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { math } from "@milkdown/plugin-math";


interface NoteEditorProps {
  note: Note;
  onContentChange: (content: string) => void;
}

export function NoteEditor({ note, onContentChange }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);

  const cleanupEditor = () => {
    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }
  };

  useEffect(() => {
    if (!note || !editorRef.current) return;
    
    cleanupEditor();
    
    const element = editorRef.current;
    
    // Create the Crepe editor
    crepeRef.current = new Crepe({
      root: element,
      defaultValue: note.content || '',
       plugins: [math()],
    });

    // Set up the change tracking after the editor is created
    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      
      if (crepeRef.current) {
        // Setup a MutationObserver to track content changes
        const editorContainer = element;
        const observer = new MutationObserver(() => {
          if (crepeRef.current) {
            try {
              const markdown = crepeRef.current.getMarkdown();
              if (markdown) {
                onContentChange(markdown);
              }
            } catch (error) {
              console.error("Error getting markdown during mutation:", error);
            }
          }
        });
        
        // Observe changes to the editor's DOM
        observer.observe(editorContainer, {
          childList: true,
          subtree: true,
          characterData: true
        });
        
        // Add cleanup for the observer
        return () => {
          observer.disconnect();
        };
      }
    });

    return cleanupEditor;
  }, [note?.id, onContentChange]);

  return (
    <Card className="h-auto bg-[#F1F0FB] shadow-sm">
      <CardContent className="p-6 h-full">
        <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none focus:outline-none">
          {/* Milkdown editor will render here */}
        </div>
      </CardContent>
    </Card>
  );
}
