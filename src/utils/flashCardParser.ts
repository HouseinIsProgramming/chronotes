
import { FlashCard } from '@/types';

export function parseFlashCards(markdown: string, noteId: string): FlashCard[] {
  const flashCards: FlashCard[] = [];
  const flashRegex = /``flash\n([\s\S]*?)\n\n([\s\S]*?)\n\n([\s\S]*?)``flashed/g;
  
  let match;
  while ((match = flashRegex.exec(markdown)) !== null) {
    const [_, title, frontSide, backSide] = match;
    flashCards.push({
      id: `${noteId}-${flashCards.length + 1}`,
      title: title.trim(),
      frontSide: frontSide.trim(),
      backSide: backSide.trim(),
      noteId
    });
  }
  
  return flashCards;
}
