
import { useState } from 'react';
import { Note } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FlashcardsViewProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
}

export function FlashcardsView({ notes, onNoteSelect }: FlashcardsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const sortedNotes = [...notes].sort((a, b) => {
    // First sort by last_reviewed_at (most recent first)
    const lastReviewedA = new Date(a.last_reviewed_at).getTime();
    const lastReviewedB = new Date(b.last_reviewed_at).getTime();
    if (lastReviewedA !== lastReviewedB) {
      return lastReviewedB - lastReviewedA;
    }
    // If last_reviewed_at is the same, sort by created_at (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredNotes = sortedNotes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      note.content.toLowerCase().includes(searchLower) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className={cn(
              "p-4 rounded-lg border cursor-pointer",
              "hover:border-primary/50 transition-colors",
              "bg-card"
            )}
            onClick={() => onNoteSelect(note.id)}
          >
            <h3 className="font-medium mb-2 line-clamp-1">{note.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="bg-muted px-2 py-1 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {note.content.replace(/[#*`]/g, '')}
            </p>
            <p className="text-xs text-muted-foreground">
              Last reviewed {formatDistanceToNow(new Date(note.last_reviewed_at), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
