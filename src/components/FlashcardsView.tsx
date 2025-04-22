
import { useState } from 'react';
import { Flashcard } from '@/types';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  onNoteSelect: (noteId: string) => void;
  isLoading?: boolean;
}

export function FlashcardsView({ flashcards, onNoteSelect, isLoading = false }: FlashcardsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const sortedFlashcards = [...flashcards].sort((a, b) => {
    const lastReviewedA = new Date(a.last_reviewed_at).getTime();
    const lastReviewedB = new Date(b.last_reviewed_at).getTime();
    if (lastReviewedA !== lastReviewedB) {
      return lastReviewedB - lastReviewedA;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredFlashcards = sortedFlashcards.filter(card => {
    const searchLower = searchQuery.toLowerCase();
    return (
      card.front.toLowerCase().includes(searchLower) ||
      card.back.toLowerCase().includes(searchLower)
    );
  });

  const handleCardClick = (card: Flashcard) => {
    setSelectedCard(card);
    setIsFlipped(false);
  };

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
      {selectedCard ? (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCard(null);
                setIsFlipped(false);
              }}
            >
              ← Back to all cards
            </Button>
            <Button 
              variant="outline"
              onClick={() => onNoteSelect(selectedCard.note_id)}
              className="flex items-center gap-2"
            >
              Go to Note <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div 
            className="flex-1 flex items-center justify-center cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div 
              className={cn(
                "w-[600px] h-[400px] p-8 rounded-lg shadow-lg transition-all duration-300",
                "flex items-center justify-center text-center text-lg",
                "bg-[#FEF7CD] hover:shadow-xl"
              )}
            >
              <div className="max-w-[500px] overflow-y-auto">
                {isFlipped ? selectedCard.back : selectedCard.front}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Click the card to flip it
          </div>
        </div>
      ) : (
        <>
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
                  "p-4 rounded-lg shadow-md cursor-pointer",
                  "hover:shadow-lg transition-all duration-200",
                  "bg-[#FEF7CD]"
                )}
                onClick={() => handleCardClick(card)}
              >
                <h3 className="font-medium mb-2 line-clamp-2">{card.front}</h3>
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
        </>
      )}
    </div>
  );
}
