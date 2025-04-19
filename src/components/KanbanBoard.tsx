
import { differenceInWeeks } from "date-fns";
import { KanbanColumn, Note, ReviewPriority } from "@/types";
import { NoteCard } from "@/components/NoteCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface KanbanBoardProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
  onReview: (noteId: string) => void;
  onViewModeChange: (mode: 'notes' | 'review') => void;
}

export function KanbanBoard({ notes, onNoteSelect, onReview, onViewModeChange }: KanbanBoardProps) {
  const isMobile = useIsMobile();
  
  const handleCardClick = (noteId: string) => {
    onNoteSelect(noteId);
    onViewModeChange('notes');
  };

  const categorizeNotes = (notes: Note[]): KanbanColumn[] => {
    const columns: KanbanColumn[] = [
      { title: "High Priority", priority: "high", notes: [] },
      { title: "Medium Priority", priority: "medium", notes: [] },
      { title: "Low Priority", priority: "low", notes: [] },
      { title: "Reviewed", priority: "reviewed", notes: [] },
    ];

    notes.forEach(note => {
      // If note has a priority, put it in the corresponding column
      if (note.priority) {
        const priorityColumn = columns.find(col => col.priority === note.priority);
        if (priorityColumn) {
          priorityColumn.notes.push(note);
          return;
        }
      }

      // If no priority, fall back to time-based categorization
      const lastReviewedDate = note.last_reviewed_at 
        ? new Date(note.last_reviewed_at) 
        : new Date(0); // If never reviewed, use epoch time
      
      const weeksAgo = differenceInWeeks(new Date(), lastReviewedDate);
      
      if (weeksAgo >= 3) {
        columns[0].notes.push(note); // High Priority
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
    <div className={`h-full overflow-auto ${isMobile ? 'p-2' : 'p-4'}`}>
      <div className={`
        h-full 
        ${isMobile 
          ? 'flex flex-col space-y-4' 
          : 'flex flex-wrap gap-4 content-start'
        }
      `}>
        {columns.map((column) => (
          <div 
            key={column.priority}
            className={`
              flex flex-col bg-card rounded-lg border
              ${isMobile 
                ? 'w-full' 
                : 'w-[calc(50%-0.5rem)] min-h-[400px]'
              }
            `}
          >
            <div className={`
              p-3 border-b rounded-t-lg font-medium text-center
              ${column.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
              ${column.priority === 'medium' ? 'bg-amber-100 text-amber-800' : ''}
              ${column.priority === 'low' ? 'bg-blue-100 text-blue-800' : ''}
              ${column.priority === 'reviewed' ? 'bg-green-100 text-green-800' : ''}
            `}>
              {column.title}
              <span className="ml-2 opacity-70">({column.notes.length})</span>
            </div>
            <div className={`
              p-2 flex-1 overflow-y-auto
              ${isMobile ? 'max-h-[300px]' : ''}
            `}>
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
