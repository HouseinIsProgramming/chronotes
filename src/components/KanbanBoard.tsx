import { differenceInWeeks } from "date-fns";
import { KanbanColumn, Note, ReviewPriority } from "@/types";
import { NoteCard } from "@/components/NoteCard";

interface KanbanBoardProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
  onReview: (noteId: string) => void;
  onViewModeChange: (mode: 'notes' | 'review') => void;
}

export function KanbanBoard({ notes, onNoteSelect, onReview, onViewModeChange }: KanbanBoardProps) {
  const handleCardClick = (noteId: string) => {
    onNoteSelect(noteId);
    onViewModeChange('notes');
  };

  const categorizeNotes = (notes: Note[]): KanbanColumn[] => {
    const columns: KanbanColumn[] = [
      { title: "Urgent", priority: "urgent", notes: [] },
      { title: "Medium Priority", priority: "medium", notes: [] },
      { title: "Low Priority", priority: "low", notes: [] },
      { title: "Reviewed", priority: "reviewed", notes: [] },
    ];

    notes.forEach(note => {
      const lastReviewedDate = note.last_reviewed_at 
        ? new Date(note.last_reviewed_at) 
        : new Date(0); // If never reviewed, use epoch time
      
      const weeksAgo = differenceInWeeks(new Date(), lastReviewedDate);
      
      if (weeksAgo >= 3) {
        columns[0].notes.push(note); // Urgent
      } else if (weeksAgo >= 2) {
        columns[1].notes.push(note); // Medium
      } else if (weeksAgo >= 1) {
        columns[2].notes.push(note); // Low
      } else {
        columns[3].notes.push(note); // Reviewed
      }
    });

    return columns;
  };

  const columns = categorizeNotes(notes);

  return (
    <div className="h-full overflow-auto">
      <div className="h-full flex gap-4 p-4">
        {columns.map((column) => (
          <div 
            key={column.priority}
            className="flex flex-col min-w-[300px] max-w-[300px] bg-card rounded-lg border"
          >
            <div className={`
              p-3 border-b rounded-t-lg font-medium text-center
              ${column.priority === 'urgent' ? 'bg-red-100 text-red-800' : ''}
              ${column.priority === 'medium' ? 'bg-amber-100 text-amber-800' : ''}
              ${column.priority === 'low' ? 'bg-blue-100 text-blue-800' : ''}
              ${column.priority === 'reviewed' ? 'bg-green-100 text-green-800' : ''}
            `}>
              {column.title}
              <span className="ml-2 opacity-70">({column.notes.length})</span>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              {column.notes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onClick={() => handleCardClick(note.id)}
                  onReview={() => onReview(note.id)}
                  priority={column.priority}
                />
              ))}
              {column.notes.length === 0 && (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm italic border border-dashed rounded-md m-2">
                  No notes in this category
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
