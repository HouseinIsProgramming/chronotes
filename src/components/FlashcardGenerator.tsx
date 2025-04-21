
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { Note } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FlashcardGeneratorProps {
  note: Note;
}

export function FlashcardGenerator({ note }: FlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([]);

  const generateFlashcards = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { content: note.content }
      });

      if (error) throw error;

      const generatedCards = data.flashcards;
      setFlashcards(generatedCards);
      setShowDialog(true);

      // Store flashcards in the database
      const promises = generatedCards.map(card => 
        supabase.from('flashcards').insert({
          note_id: note.id,
          front: card.front,
          back: card.back,
        })
      );

      await Promise.all(promises);
      toast.success('Flashcards generated and saved successfully!');

    } catch (error) {
      console.error('Error generating flashcards:', error);
      toast.error('Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={generateFlashcards}
        disabled={isGenerating}
      >
        <Brain className="h-4 w-4 mr-2" />
        {isGenerating ? 'Generating...' : 'Generate Flashcards'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Flashcards</DialogTitle>
            <DialogDescription>
              {flashcards.length} flashcards have been generated and saved
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {flashcards.map((card, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Card {index + 1}</h3>
                <div className="space-y-2">
                  <p><strong>Front:</strong> {card.front}</p>
                  <p><strong>Back:</strong> {card.back}</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
