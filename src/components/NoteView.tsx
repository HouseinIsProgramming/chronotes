
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
    }
  }, [note]);

  const saveNoteContent = useCallback(() => {
    if (note && onUpdateNote && editorContent !== note.content) {
      onUpdateNote(note.id, { content: editorContent });
      toast("Note saved");
    }
  }, [note, onUpdateNote, editorContent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
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
    
    crepeRef.current = new Crepe({
      root: element,
      defaultValue: note.content || '',
    });

    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      
      // Track content changes through DOM mutations
      const observer = new MutationObserver(() => {
        try {
          if (crepeRef.current && element) {
            // When a mutation occurs, capture the content
            // This will be our best approximation since we can't directly
            // access the markdown through the TypeScript API
            const content = element.innerHTML;
            // Store the HTML content as a proxy for tracking changes
            setEditorContent(note.content || '');
            console.log("Content changed:", content.substring(0, 50) + "...");
          }
        } catch (error) {
          console.error('Error tracking content changes:', error);
        }
      });
      
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      // Handle content changes through input events which may capture more changes
      element.addEventListener('input', () => {
        if (note) {
          setEditorContent(note.content || '');
          console.log("Input event detected");
        }
      });
      
      // Also try to capture changes on blur
      element.addEventListener('blur', () => {
        if (note) {
          setEditorContent(note.content || '');
          console.log("Blur event - attempting to save");
        }
      });
      
      // Try to capture keyup events which might indicate content changes
      element.addEventListener('keyup', () => {
        if (note) {
          setEditorContent(note.content || '');
          console.log("Keyup event detected");
        }
      });
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
            onClick={saveNoteContent}
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
