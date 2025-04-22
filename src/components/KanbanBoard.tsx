import { differenceInWeeks } from "date-fns";
import { KanbanColumn, Note, ReviewPriority } from "@/types";
import { NoteCard } from "@/components/NoteCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface KanbanBoardProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
  onReview: (noteId: string) => void;
  onViewModeChange: (mode: "notes" | "review") => void;
}

export function KanbanBoard({
  notes,
  onNoteSelect,
  onReview,
  onViewModeChange,
}: KanbanBoardProps) {
  const isMobile = useIsMobile();

  const handleCardClick = (noteId: string) => {
    onNoteSelect(noteId);
    onViewModeChange("notes");
  };

  const categorizeNotes = (notes: Note[]): KanbanColumn[] => {
    const columns: KanbanColumn[] = [
      { title: "High Priority", priority: "high", notes: [] },
      { title: "Medium Priority", priority: "medium", notes: [] },
      { title: "Low Priority", priority: "low", notes: [] },
      { title: "Reviewed", priority: "reviewed", notes: [] },
    ];

    notes.forEach((note) => {
      if (note.priority) {
        const priorityColumn = columns.find(
          (col) => col.priority === note.priority,
        );
        if (priorityColumn) {
          priorityColumn.notes.push(note);
          return;
        }
      }

      const lastReviewedDate = note.last_reviewed_at
        ? new Date(note.last_reviewed_at)
        : new Date(0);

      const weeksAgo = differenceInWeeks(new Date(), lastReviewedDate);

      if (weeksAgo >= 3) {
        columns[0].notes.push(note);
      } else if (weeksAgo >= 2) {
        columns[1].notes.push(note);
      } else if (weeksAgo >= 1) {
        columns[2].notes.push(note);
      } else {
        columns[3].notes.push(note);
      }
    });

    return columns;
  };

  const columns = categorizeNotes(notes);
  const highPriorityColumn = columns.find((col) => col.priority === "high");
  const mediumPriorityColumn = columns.find((col) => col.priority === "medium");
  const lowPriorityColumn = columns.find((col) => col.priority === "low");
  const reviewedColumn = columns.find((col) => col.priority === "reviewed");

  return (
    <div className={`h-full overflow-auto ${isMobile ? "p-2" : "p-4"}`}>
      <div className="h-full flex flex-col gap-4">
        <div
          className={`
          ${isMobile ? "w-full" : "w-full flex-none"}
        `}
        >
          {highPriorityColumn && (
            <div className="flex flex-col bg-card rounded-lg border h-[clamp(300px,100%,600px)]">
              <div className="p-3 border-b rounded-t-lg font-medium text-center bg-red-100 text-red-800">
                {highPriorityColumn.title}
                <span className="ml-2 opacity-70">
                  ({highPriorityColumn.notes.length})
                </span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                <div
                  className={`
                  ${!isMobile ? "grid md:grid-cols-2 xl:grid-cols-3 gap-3" : ""}
                `}
                >
                  {highPriorityColumn.notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleCardClick(note.id)}
                      onReview={() => onReview(note.id)}
                      priority={highPriorityColumn.priority}
                    />
                  ))}
                </div>
                {highPriorityColumn.notes.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-muted-foreground text-sm italic border border-dashed rounded-md m-2">
                    No notes in this category
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="w-full flex gap-4 flex-none">
            {[mediumPriorityColumn, lowPriorityColumn].map(
              (column) =>
                column && (
                  <div
                    key={column.priority}
                    className="flex-1 flex flex-col bg-card rounded-lg border h-[clamp(300px,100%,600px)]"
                  >
                    <div
                      className={`
                  p-3 border-b rounded-t-lg font-medium text-center
                  ${column.priority === "medium" ? "bg-amber-100 text-amber-800" : ""}
                  ${column.priority === "low" ? "bg-blue-100 text-blue-800" : ""}
                `}
                    >
                      {column.title}
                      <span className="ml-2 opacity-70">
                        ({column.notes.length})
                      </span>
                    </div>
                    <div className="p-2 flex-1 overflow-y-auto">
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {column.notes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={() => handleCardClick(note.id)}
                            onReview={() => onReview(note.id)}
                            priority={column.priority}
                          />
                        ))}
                      </div>
                      {column.notes.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-muted-foreground text-sm italic border border-dashed rounded-md m-2">
                          No notes in this category
                        </div>
                      )}
                    </div>
                  </div>
                ),
            )}
          </div>
        )}

        <div
          className={`
          ${isMobile ? "w-full" : "w-full flex-none"}
        `}
        >
          {reviewedColumn && (
            <div className="flex flex-col bg-card rounded-lg border h-[clamp(300px,100%,600px)]">
              <div className="p-3 border-b rounded-t-lg font-medium text-center bg-green-100 text-green-800">
                {reviewedColumn.title}
                <span className="ml-2 opacity-70">
                  ({reviewedColumn.notes.length})
                </span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                <div
                  className={`
                  ${!isMobile ? "grid md:grid-cols-2 xl:grid-cols-3 gap-3" : ""}
                `}
                >
                  {reviewedColumn.notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => handleCardClick(note.id)}
                      onReview={() => onReview(note.id)}
                      priority={reviewedColumn.priority}
                    />
                  ))}
                </div>
                {reviewedColumn.notes.length === 0 && (
                  <div className="h-24 flex items-center justify-center text-muted-foreground text-sm italic border border-dashed rounded-md m-2">
                    No notes in this category
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {isMobile &&
          [mediumPriorityColumn, lowPriorityColumn].map(
            (column) =>
              column && (
                <div
                  key={column.priority}
                  className="w-full flex flex-col bg-card rounded-lg border h-[clamp(300px,100%,600px)]"
                >
                  <div
                    className={`
              p-3 border-b rounded-t-lg font-medium text-center
              ${column.priority === "medium" ? "bg-amber-100 text-amber-800" : ""}
              ${column.priority === "low" ? "bg-blue-100 text-blue-800" : ""}
            `}
                  >
                    {column.title}
                    <span className="ml-2 opacity-70">
                      ({column.notes.length})
                    </span>
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
              ),
          )}
      </div>
    </div>
  );
}
