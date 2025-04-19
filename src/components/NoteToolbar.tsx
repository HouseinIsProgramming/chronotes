
import { Note } from '@/types';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Save, Trash2, Copy, Flag, FlagTriangleRight, FlagTriangleLeft, Feather, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";

interface NoteToolbarProps {
  note: Note;
  onSave: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onPriorityUpdate: (priority: 'high' | 'medium' | 'low') => void;
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
  const { mode } = useAuth();

  return (
    <Menubar className="border-none p-0">
      <MenubarMenu>
        <MenubarTrigger className="font-semibold">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </MenubarItem>
          <MenubarItem onClick={() => {
            if (mode === 'guest') {
              toast.error("Please log in to delete notes");
              return;
            }
            onDelete();
          }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </MenubarItem>
          <MenubarItem onClick={onCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Content
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-semibold">
          {note?.priority ? `Priority: ${note.priority}` : 'Set Priority'}
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem 
            onClick={() => onPriorityUpdate('high')}
            className={note?.priority === 'high' ? 'bg-accent' : ''}
          >
            <Flag className="mr-2 h-4 w-4" />
            High Priority
          </MenubarItem>
          <MenubarItem 
            onClick={() => onPriorityUpdate('medium')}
            className={note?.priority === 'medium' ? 'bg-accent' : ''}
          >
            <FlagTriangleRight className="mr-2 h-4 w-4" />
            Medium Priority
          </MenubarItem>
          <MenubarItem 
            onClick={() => onPriorityUpdate('low')}
            className={note?.priority === 'low' ? 'bg-accent' : ''}
          >
            <FlagTriangleLeft className="mr-2 h-4 w-4" />
            Low Priority
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger onClick={onReview} className="font-semibold">
          <Feather className="mr-2 h-4 w-4" />
          Mark as Reviewed
        </MenubarTrigger>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="font-semibold">
          <History className="mr-2 h-4 w-4" />
          History
        </MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => toast.info("Note history feature coming soon!")}>
            View History
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
