
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
import { useAuth } from '@/contexts/AuthContext';

interface FlashcardGeneratorProps {
  note: Note;
}

export function FlashcardGenerator({ note }: FlashcardGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [flashcards, setFlashcards] = useState<Array<{ front: string; back: string }>>([]);
  const { user } = useAuth();

  const generateFlashcards = async () => {
    if (!user) {
      toast.error('Please log in to generate flashcards');
      return;
    }

    if (!note.content || note.content.trim() === '') {
      toast.warning('Note content is empty. Add content before generating flashcards.');
      return;
    }

    setIsGenerating(true);
    try {
      toast.info('Generating flashcards... This may take a moment.');
      
      // Limit content size to prevent overwhelming the API
      const trimmedContent = note.content.slice(0, 5000);
      if (note.content.length > 5000) {
        toast.warning('Note content was trimmed to 5000 characters for processing');
      }
      
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { content: trimmedContent }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Function invocation failed');
      }

      if (!data) {
        console.error('Empty response from function');
        throw new Error('Received empty response from the AI service');
      }

      if (data.error) {
        console.error('API error:', data.error);
        throw new Error(data.error);
      }

      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        console.error('Unexpected response format:', data);
        throw new Error('Received invalid response from the AI service');
      }

      const generatedCards = data.flashcards;
      
      if (generatedCards.length === 0) {
        throw new Error('No flashcards were generated. The AI might need more specific content.');
      }
      
      setFlashcards(generatedCards);
      setShowDialog(true);

      // Store flashcards in the database
      const flashcardInserts = generatedCards.map(card => ({
        user_id: user.id,
        note_id: note.id,
        front: card.front,
        back: card.back,
      }));

      const { error: insertError } = await supabase
        .from('flashcards')
        .insert(flashcardInserts);

      if (insertError) {
        console.error('Database insert error:', insertError);
        toast.warning('Flashcards generated but could not be saved to database');
      } else {
        toast.success(`Successfully generated ${generatedCards.length} flashcards!`);
      }

    } catch (error: any) {
      console.error('Error generating flashcards:', error);
      toast.error(`Failed to generate flashcards: ${error.message || 'Unknown error'}`);
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
        className="relative"
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
