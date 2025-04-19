
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
}

export function NoteView({ note, onReview }: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{note.title}</h1>
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

        {note.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <Badge key={index} variant="purple" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 prose prose-sm md:prose-base max-w-none">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
    </div>
  );
}
