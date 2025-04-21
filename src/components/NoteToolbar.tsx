import { Note } from '@/types';
import { Button } from '@/components/ui/button';
import { Copy, Save, Trash2, CheckCircle } from 'lucide-react';
import { PrioritySelector } from './PrioritySelector';
import { FlashcardGenerator } from './FlashcardGenerator';

interface NoteToolbarProps {
  note: Note;
  onSave: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPriorityUpdate: (priority: 'high' | 'medium' | 'low' | null) => void;
  onReview: () => void;
}

export function NoteToolbar({
  note,
  onSave,
  onDelete,
  onCopy,
  onPriorityUpdate,
  onReview
}: NoteToolbarProps) {
  return (
    <div className="flex items-center space-x-2 mb-4">
      <Button variant="outline" size="sm" onClick={onSave}>
        <Save className="h-4 w-4 mr-2" />
        Save
      </Button>
      <Button variant="outline" size="sm" onClick={onCopy}>
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>
      <Button variant="outline" size="sm" onClick={onDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
      <PrioritySelector onPriorityUpdate={onPriorityUpdate} />
      <Button variant="outline" size="sm" onClick={onReview}>
        <CheckCircle className="h-4 w-4 mr-2" />
        Mark as Reviewed
      </Button>
      <FlashcardGenerator note={note} />
    </div>
  );
}
