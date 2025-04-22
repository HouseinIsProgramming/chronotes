
import { useState, useEffect } from 'react';
import { Flashcard } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useFlashcards = (mode: string | null, user: any) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlashcards = async () => {
    if (mode === 'authenticated' && user) {
      try {
        const { data, error } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching flashcards:', error);
          toast.error('Failed to load flashcards');
          return;
        }

        setFlashcards(data || []);
      } catch (error) {
        console.error('Error in fetchFlashcards:', error);
        toast.error('Something went wrong loading your flashcards');
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [mode, user]);

  return {
    flashcards,
    isLoading,
    refreshFlashcards: fetchFlashcards
  };
};
