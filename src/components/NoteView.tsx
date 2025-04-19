
import { useEffect, useState, useRef } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { useEditor } from '@milkdown/react';
import { defaultValueCtx, rootCtx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { nord } from '@milkdown/theme-nord';

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
  const [showMarkdown, setShowMarkdown] = useState(true);
  const [localContent, setLocalContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Fixed Milkdown configuration with proper return types
  const { loading, get } = useEditor((root) => {
    return get()
      .use(nord)
      .use(commonmark)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, note?.content || '');
      });
  }, [note?.id, note?.content]);

  useEffect(() => {
    // Update local content when note changes
    if (note) {
      setLocalContent(note.content);
    }
  }, [note?.id]);

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

  useEffect(() => {
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [localContent]);

  // Listen for editor content changes
  useEffect(() => {
    if (!loading && get && note) {
      const editor = get();
      if (editor) {
        // We would set up content change listeners here
        // This is a simplified example - in a real app you'd implement
        // proper markdown serialization and change detection
        
        // Listen for document changes using Milkdown's API
        setTimeout(() => {
          const editorRoot = editorRef.current?.querySelector('.milkdown');
          if (editorRoot) {
            editorRoot.addEventListener('input', () => {
              // This is a simple approach - in a real app you'd use Milkdown's API
              // to properly extract the document content
              const content = editorRoot.textContent || '';
              if (content !== note.content) {
                handleContentChange(content);
              }
            });
          }
        }, 100);
      }
    }
  }, [loading, note]);

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

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    handleUpdate('content', value);
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

      <div className="border-b px-6 py-2 flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          {showMarkdown ? 'Editor' : 'Raw'} view
        </span>
        <Switch checked={showMarkdown} onCheckedChange={setShowMarkdown} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        <Card className="h-auto bg-[#F1F0FB] shadow-sm">
          <CardContent className="p-6 h-full">
            {showMarkdown ? (
              <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <p>Loading editor...</p>
                  </div>
                ) : (
                  <div className="milkdown-editor-wrapper">
                    {/* Fixed rendering of Milkdown editor */}
                    {get() && <div className="milkdown" />}
                  </div>
                )}
              </div>
            ) : (
              <textarea 
                ref={textareaRef}
                value={localContent} 
                onChange={e => handleContentChange(e.target.value)} 
                className="font-mono text-sm w-full whitespace-pre-wrap break-words border-none focus-visible:ring-0 p-0 resize-none bg-transparent"
                style={{
                  height: `${textareaRef.current?.scrollHeight || 'auto'}px`,
                  overflow: "hidden"
                }}
                rows={20}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>;
}
