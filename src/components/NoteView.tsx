
import { useEffect, useState, useRef, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";

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
  const observerRef = useRef<MutationObserver | null>(null);

  // Update last reviewed text when note changes
  useEffect(() => {
    if (note && note.last_reviewed_at) {
      const distance = formatDistanceToNow(new Date(note.last_reviewed_at), {
        addSuffix: true
      });
      setLastReviewedText(`Last reviewed ${distance}`);
    } else {
      setLastReviewedText('Never reviewed');
    }
  }, [note]);

  // Cleanup function to destroy editor and disconnect observer
  const cleanupEditor = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }
  }, []);

  // Setup editor when note changes
  useEffect(() => {
    if (!note || !editorRef.current) return;
    
    // Clean up any existing editor before creating a new one
    cleanupEditor();
    
    // Create new editor instance
    crepeRef.current = new Crepe({
      root: editorRef.current,
      defaultValue: note.content || '',
    });

    // Create and setup the editor
    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      
      // Setup mutation observer to detect content changes
      if (editorRef.current && onUpdateNote && note) {
        observerRef.current = new MutationObserver(() => {
          const content = editorRef.current?.textContent || '';
          onUpdateNote(note.id, { content });
        });
        
        observerRef.current.observe(editorRef.current, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    });

    // Cleanup on unmount or when note changes
    return cleanupEditor;
  }, [note?.id, cleanupEditor, onUpdateNote]);

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
        <Card className="h-auto bg-[#F1F0FB] shadow-sm">
          <CardContent className="p-6 h-full">
            <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none">
              <div className="milkdown-editor-wrapper">
                {/* Crepe will render here */}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
