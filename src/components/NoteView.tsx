
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Tag } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { cn } from '@/lib/utils';

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
}

export function NoteView({ note, onReview, onUpdateNote }: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');
  const [showMarkdown, setShowMarkdown] = useState(true);

  useEffect(() => {
    if (note && note.last_reviewed_at) {
      const distance = formatDistanceToNow(new Date(note.last_reviewed_at), { addSuffix: true });
      setLastReviewedText(`Last reviewed ${distance}`);
    } else {
      setLastReviewedText('Never reviewed');
    }
  }, [note]);

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a note to view</p>
      </div>
    );
  }

  const handleUpdate = (field: keyof Note, value: any) => {
    if (onUpdateNote) {
      onUpdateNote(note.id, { [field]: value });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <EditableContent
            value={note.title}
            onSave={(value) => handleUpdate('title', value)}
            className="text-2xl font-bold"
          />
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
            onClick={() => onReview(note.id)}
          >
            Mark as Reviewed
          </button>
        </div>

        <div className="flex items-center space-x-4 text-muted-foreground text-sm">
          <span>Created {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
          <span>•</span>
          <span>{lastReviewedText}</span>
        </div>

        <TagsEditor
          tags={note.tags}
          onSave={(tags) => handleUpdate('tags', tags)}
        />
      </div>

      <div className="border-b px-6 py-2 flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          {showMarkdown ? 'Rendered' : 'Raw'} view
        </span>
        <Switch
          checked={showMarkdown}
          onCheckedChange={setShowMarkdown}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showMarkdown ? (
          <div className="prose prose-sm md:prose-base max-w-none">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>
        ) : (
          <EditableContent
            value={note.content}
            onSave={(value) => handleUpdate('content', value)}
            multiline
            className={cn(
              "font-mono text-sm w-full h-full whitespace-pre-wrap break-words",
              "border rounded-md p-2 bg-background"
            )}
          />
        )}
      </div>
    </div>
  );
}
