
import { Note } from '@/types';
import { Copy, Save, Trash2, CheckCircle, ChevronDown, Flag } from 'lucide-react';
import { FlashcardGenerator } from './FlashcardGenerator';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { cn } from '@/lib/utils';

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
  // Get priority colors
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high':
        return 'text-[#ea384c] hover:text-[#ea384c]/90';
      case 'medium':
        return 'text-[#F97316] hover:text-[#F97316]/90';
      case 'low':
        return 'text-[#0EA5E9] hover:text-[#0EA5E9]/90';
      default:
        return '';
    }
  };

  // Priority selection handler
  const handlePrioritySelect = (newPriority: 'high' | 'medium' | 'low') => {
    // If the same priority is selected, toggle it off (set to null)
    if (note.priority === newPriority) {
      onPriorityUpdate(null);
    } else {
      onPriorityUpdate(newPriority);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-2 mb-4">
      <div className="flex items-center space-x-2">
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={onSave}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </MenubarItem>
              <MenubarItem onClick={onCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger className={cn("flex items-center gap-2", getPriorityColor(note.priority))}>
              {note.priority ? (
                <>
                  <Flag className="h-4 w-4" />
                  <span className="capitalize">{note.priority}</span>
                </>
              ) : (
                <>
                  <span>Set Priority</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem 
                onClick={() => handlePrioritySelect('high')}
                className={cn(
                  "text-[#ea384c]",
                  note.priority === 'high' && "font-bold"
                )}
              >
                <Flag className="mr-2 h-4 w-4" />
                High
              </MenubarItem>
              <MenubarItem 
                onClick={() => handlePrioritySelect('medium')}
                className={cn(
                  "text-[#F97316]",
                  note.priority === 'medium' && "font-bold"
                )}
              >
                <Flag className="mr-2 h-4 w-4" />
                Medium
              </MenubarItem>
              <MenubarItem 
                onClick={() => handlePrioritySelect('low')}
                className={cn(
                  "text-[#0EA5E9]",
                  note.priority === 'low' && "font-bold"
                )}
              >
                <Flag className="mr-2 h-4 w-4" />
                Low
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <button
          onClick={onReview}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Reviewed
        </button>
      </div>

      <FlashcardGenerator note={note} />
    </div>
  );
}
