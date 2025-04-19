
import { useState, useEffect } from 'react';
import { FlashCard as FlashCardType, Note } from '@/types';
import { FlashCard } from '@/components/FlashCard';
import { parseFlashCards } from '@/utils/flashCardParser';

interface FlashCardsViewProps {
  notes: Note[];
}

export function FlashCardsView({ notes }: FlashCardsViewProps) {
  const [flashCards, setFlashCards] = useState<FlashCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const extractFlashCards = async () => {
      setIsLoading(true);
      try {
        const allFlashCards: FlashCardType[] = [];
        
        notes.forEach(note => {
          const cardsFromNote = parseFlashCards(note.content, note.id);
          allFlashCards.push(...cardsFromNote);
        });
        
        setFlashCards(allFlashCards);
      } catch (error) {
        console.error('Error extracting flash cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    extractFlashCards();
  }, [notes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading flash cards...</p>
      </div>
    );
  }

  if (flashCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h2 className="text-2xl font-bold mb-4">No Flash Cards Found</h2>
        <p className="text-center text-muted-foreground mb-4">
          Create flash cards in your notes using the format:
        </p>
        <div className="bg-muted/30 p-4 rounded-md font-mono text-sm">
          ``flash``<br />
          Title of Card<br />
          <br />
          Front side content<br />
          <br />
          Back side content<br />
          ``flashed``
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Flash Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashCards.map((card) => (
          <FlashCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
