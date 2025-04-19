
import { useEffect, useState, useRef, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { toast } from "sonner";

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
}

export function NoteView({
  note,
  onReview,
  onUpdateNote
}: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const currentContentRef = useRef<string>(''); // Use a ref to track the current content
  
  useEffect(() => {
    if (note && note.last_reviewed_at) {
      const distance = formatDistanceToNow(new Date(note.last_reviewed_at), {
        addSuffix: true
      });
      setLastReviewedText(`Last reviewed ${distance}`);
    } else {
      setLastReviewedText('Never reviewed');
    }
    
    if (note) {
      setEditorContent(note.content || '');
      currentContentRef.current = note.content || '';
    }
  }, [note]);

  const saveNoteContent = useCallback(() => {
    console.log("Attempting to save content...");
    
    if (note && onUpdateNote && crepeRef.current) {
      // Get markdown directly from Crepe
      try {
        // Use the markdown getter from Crepe
        const markdown = crepeRef.current.getMarkdown();
        console.log("Markdown content to save:", markdown?.substring(0, 50) + "...");
        
        // Save the markdown content
        onUpdateNote(note.id, { content: markdown || note.content });
        toast("Note saved");
        console.log("Save operation completed");
      } catch (error) {
        console.error("Error getting markdown from editor:", error);
        // Fallback to current content ref if direct method fails
        onUpdateNote(note.id, { content: currentContentRef.current });
        toast("Note saved (fallback method)");
      }
    } else {
      console.log("Save failed - note, onUpdateNote, or crepeRef is null");
    }
  }, [note, onUpdateNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log(`${e.metaKey ? 'CMD' : 'CTRL'} + S key combination detected!`);
        saveNoteContent();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNoteContent]);

  const cleanupEditor = useCallback(() => {
    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!note || !editorRef.current) return;
    
    cleanupEditor();
    
    const element = editorRef.current;
    
    // Create the Crepe editor without the onChange property
    crepeRef.current = new Crepe({
      root: element,
      defaultValue: note.content || '',
    });

    // Set up the change tracking after the editor is created
    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      // Set initial content
      currentContentRef.current = note.content || '';
      
      if (crepeRef.current) {
        // Setup a MutationObserver to track content changes
        const editorContainer = element;
        const observer = new MutationObserver(() => {
          if (crepeRef.current) {
            try {
              const markdown = crepeRef.current.getMarkdown();
              if (markdown) {
                currentContentRef.current = markdown;
                console.log("Editor content changed:", markdown.substring(0, 50) + "...");
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
  }, [note?.id, cleanupEditor]);

  if (!note) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a note to view</p>
      </div>;
  }

  const handleUpdate = (field: keyof Note, value: any) => {
    if (onUpdateNote) {
      onUpdateNote(note.id, {
        [field]: value
      });
    }
  };

  return <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <EditableContent value={note.title} onSave={value => handleUpdate('title', value)} className="text-2xl font-bold" />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition" onClick={() => onReview(note.id)}>
            Mark as Reviewed
          </button>
        </div>

        <div className="flex items-center space-x-4 text-muted-foreground text-sm">
          <span>Created {formatDistanceToNow(new Date(note.created_at), {
            addSuffix: true
          })}</span>
          <span>•</span>
          <span>{lastReviewedText}</span>
        </div>

        <TagsEditor tags={note.tags} onSave={tags => handleUpdate('tags', tags)} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <div className="mb-2 flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Save button clicked");
              saveNoteContent();
            }}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
        <Card className="h-auto bg-[#F1F0FB] shadow-sm">
          <CardContent className="p-6 h-full">
            <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none focus:outline-none">
              {/* Milkdown editor will render here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
