
import { useState } from 'react';
import { FlashCard as FlashCardType } from '@/types';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashCardProps {
  card: FlashCardType;
}

export function FlashCard({ card }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Card 
      className="w-80 h-48 cursor-pointer bg-[#FEF7CD] hover:shadow-lg transition-shadow"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            className="p-4 h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-bold text-lg mb-2">{card.title}</h3>
            <p className="text-sm">{card.frontSide}</p>
          </motion.div>
        ) : (
          <motion.div
            key="back"
            className="p-4 h-full flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm">{card.backSide}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
