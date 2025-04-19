
import { formatDistanceToNow } from "date-fns";
import { Note, ReviewPriority } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Tag } from "lucide-react";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onReview: () => void;
  priority: ReviewPriority;
}

export function NoteCard({ note, onClick, onReview, priority }: NoteCardProps) {
  const lastReviewed = note.last_reviewed_at
    ? formatDistanceToNow(new Date(note.last_reviewed_at), { addSuffix: true })
    : "Never reviewed";

  const getPriorityStyle = (priority: ReviewPriority) => {
    switch (priority) {
      case "urgent":
        return "border-l-4 border-l-red-400";
      case "medium":
        return "border-l-4 border-l-amber-400";
      case "low":
        return "border-l-4 border-l-blue-400";
      case "reviewed":
        return "border-l-4 border-l-green-400";
      default:
        return "";
    }
  };

  return (
    <Card 
      className={`mb-3 cursor-pointer hover:bg-muted/50 transition ${getPriorityStyle(priority)}`} 
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <FileText size={16} className="mt-1 text-muted-foreground" />
          <div>
            <h3 className="font-medium text-sm line-clamp-2">{note.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {note.content.substring(0, 100)}
              {note.content.length > 100 ? '...' : ''}
            </p>
            
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {note.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="purple" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {note.tags.length > 2 && (
                  <Badge variant="gray" className="text-xs">
                    +{note.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {lastReviewed}
        </div>
        <button 
          className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded"
          onClick={(e) => {
            e.stopPropagation();
            onReview();
          }}
        >
          Review
        </button>
      </CardFooter>
    </Card>
  );
}
