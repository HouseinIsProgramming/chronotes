
import { v4 as uuidv4 } from "uuid";
import { FlashCard } from "@/types";

// Parse flash cards from note content
export const parseFlashCards = (content: string | undefined, noteId: string): FlashCard[] => {
  if (!content) return [];
  
  const flashCards: FlashCard[] = [];
  
  // Parse classic flash card format
  const classicRegex = /``flash\s*([\s\S]*?)\s*\n\n([\s\S]*?)\s*\n\n([\s\S]*?)\s*``flashed/g;
  let match;
  
  while ((match = classicRegex.exec(content)) !== null) {
    const [, title, frontSide, backSide] = match;
    
    flashCards.push({
      id: uuidv4(),
      title: title.trim(),
      frontSide: frontSide.trim(),
      backSide: backSide.trim(),
      noteId
    });
  }
  
  // Parse new flashcard format with ??? markers
  const newFormatRegex = /\?\?\?([\s\S]*?)---([\s\S]*?)\?\?\?/g;
  let newMatch;
  
  while ((newMatch = newFormatRegex.exec(content)) !== null) {
    const [, question, answer] = newMatch;
    
    flashCards.push({
      id: uuidv4(),
      title: `Flashcard ${flashCards.length + 1}`,
      frontSide: question.trim(),
      backSide: answer.trim(),
      noteId
    });
  }
  
  return flashCards;
}
