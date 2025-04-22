
import { useState } from 'react';
import { Flashcard } from '@/types';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onNoteSelect: (noteId: string) => void;
  isLoading?: boolean;
}

export function FlashcardsView({ flashcards, onNoteSelect, isLoading = false }: FlashcardsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const sortedFlashcards = [...flashcards].sort((a, b) => {
    // First sort by last_reviewed_at (most recent first)
    const lastReviewedA = new Date(a.last_reviewed_at).getTime();
    const lastReviewedB = new Date(b.last_reviewed_at).getTime();
    if (lastReviewedA !== lastReviewedB) {
      return lastReviewedB - lastReviewedA;
    }
    // If last_reviewed_at is the same, sort by created_at (most recent first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredFlashcards = sortedFlashcards.filter(card => {
    const searchLower = searchQuery.toLowerCase();
    return (
      card.front.toLowerCase().includes(searchLower) ||
      card.back.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden flex flex-col p-6">
        <div className="flex justify-center items-center h-full">
          <p>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
        {filteredFlashcards.map(card => (
          <div
            key={card.id}
            className={cn(
              "p-4 rounded-lg border cursor-pointer",
              "hover:border-primary/50 transition-colors",
              "bg-card"
            )}
            onClick={() => onNoteSelect(card.note_id)}
          >
            <h3 className="font-medium mb-2 line-clamp-2">{card.front}</h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
              {card.back}
            </p>
            <p className="text-xs text-muted-foreground">
              Last reviewed {formatDistanceToNow(new Date(card.last_reviewed_at), { addSuffix: true })}
            </p>
          </div>
        ))}
        {filteredFlashcards.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No flashcards found
          </div>
        )}
      </div>
    </div>
  );
}
