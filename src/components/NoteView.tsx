import { useEffect, useState, useRef, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import { Save, Trash2, Copy, Flag, FlagTriangleRight, FlagTriangleLeft, Feather } from 'lucide-react';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
  onDelete?: (noteId: string) => void;
}

export function NoteView({
  note,
  onReview,
  onUpdateNote,
  onDelete
}: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const currentContentRef = useRef<string>(''); // Use a ref to track the current content
  const { mode, user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (note && note.last_reviewed_at) {
      const distance = formatDistanceToNow(new Date(note.last_reviewed_at), {
        addSuffix: true
      });
      setLastReviewedText(`Last reviewed ${distance}`);
    } else {
      setLastReviewedText('Never reviewed');
    }
    
    if (note) {
      setEditorContent(note.content || '');
      currentContentRef.current = note.content || '';
    }
  }, [note]);

  const saveNoteContent = useCallback(async () => {
    console.log("Attempting to save content...");
    
    if (note && onUpdateNote && crepeRef.current) {
      try {
        // Get markdown directly from Crepe
        const markdown = crepeRef.current.getMarkdown();
        console.log("Markdown content to save:", markdown?.substring(0, 50) + "...");
        
        // Update note in local state
        onUpdateNote(note.id, { content: markdown || note.content });
        
        // If authenticated, also save to Supabase
        if (mode === 'authenticated' && user) {
          try {
            const { error } = await supabase
              .from('notes')
              .update({ 
                content: markdown || note.content,
              })
              .eq('id', note.id)
              .eq('user_id', user.id);
              
            if (error) {
              console.error("Error saving note to Supabase:", error);
              toast("Failed to sync note: " + error.message);
            } else {
              toast("Note saved and synced");
            }
          } catch (error) {
            console.error("Exception when saving to Supabase:", error);
            toast("Note saved locally only");
          }
        } else {
          toast("Note saved locally");
        }
        
        console.log("Save operation completed");
      } catch (error) {
        console.error("Error getting markdown from editor:", error);
        // Fallback to current content ref if direct method fails
        onUpdateNote(note.id, { content: currentContentRef.current });
        toast("Note saved (fallback method)");
      }
    } else {
      console.log("Save failed - note, onUpdateNote, or crepeRef is null");
    }
  }, [note, onUpdateNote, mode, user]);

  const handlePriorityUpdate = useCallback(async (priority: 'high' | 'medium' | 'low') => {
    if (note && onUpdateNote) {
      try {
        // If the same priority is clicked, set to null (remove priority)
        const newPriority = note.priority === priority ? null : priority;
        
        // Update note in local state
        onUpdateNote(note.id, { priority: newPriority });
        
        // If authenticated, also save to Supabase
        if (mode === 'authenticated' && user) {
          const { error } = await supabase
            .from('notes')
            .update({ priority: newPriority })
            .eq('id', note.id)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating note priority:", error);
            toast.error("Failed to update note priority");
          } else {
            toast.success(newPriority ? `Note marked as ${newPriority} priority` : 'Priority removed');
          }
        } else {
          toast.success(newPriority ? `Note marked as ${newPriority} priority` : 'Priority removed');
        }
      } catch (error) {
        console.error("Exception when updating note priority:", error);
        toast.error("Failed to update note priority");
      }
    }
  }, [note, onUpdateNote, mode, user]);

  const handleReview = useCallback(async () => {
    if (!note) return;

    console.log("Mark as reviewed clicked for note:", note.id);
    
    // First, update the note's priority to null locally
    if (onUpdateNote) {
      console.log("Setting priority to null for note:", note.id);
      onUpdateNote(note.id, { priority: null });
    }
    
    // Then, call the onReview function to update the review timestamp
    onReview(note.id);
    
    // If authenticated, update both last_reviewed_at and priority in Supabase
    if (mode === 'authenticated' && user) {
      try {
        const now = new Date().toISOString();
        console.log("Updating note in Supabase with priority=null and last_reviewed_at=now");
        const { error } = await supabase
          .from('notes')
          .update({ 
            last_reviewed_at: now,
            priority: null  // Explicitly set priority to null when reviewed
          })
          .eq('id', note.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error("Error updating review time in Supabase:", error);
          toast.error("Failed to mark note as reviewed");
        } else {
          toast.success("Note marked as reviewed");
          console.log("Note successfully marked as reviewed in Supabase");
        }
      } catch (error) {
        console.error("Exception when updating review time:", error);
        toast.error("Failed to mark note as reviewed");
      }
    } else if (mode === 'guest') {
      toast.success("Note marked as reviewed");
    }
  }, [note, onReview, onUpdateNote, mode, user]);

  const handleDelete = useCallback(() => {
    if (mode === 'guest') {
      toast.error("Please log in to delete notes");
      return;
    }
    setShowDeleteDialog(true);
  }, [mode]);

  const handleCopy = useCallback(() => {
    if (!note || !crepeRef.current) return;
    
    try {
      const markdown = crepeRef.current.getMarkdown();
      if (markdown) {
        navigator.clipboard.writeText(markdown)
          .then(() => toast.success("Content copied to clipboard"))
          .catch(() => toast.error("Failed to copy content"));
      }
    } catch (error) {
      console.error("Error getting markdown content:", error);
      toast.error("Failed to copy content");
    }
  }, [note]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log(`${e.metaKey ? 'CMD' : 'CTRL'} + S key combination detected!`);
        saveNoteContent();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveNoteContent]);

  const cleanupEditor = useCallback(() => {
    if (crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!note || !editorRef.current) return;
    
    cleanupEditor();
    
    const element = editorRef.current;
    
    // Create the Crepe editor without the onChange property
    crepeRef.current = new Crepe({
      root: element,
      defaultValue: note.content || '',
    });

    // Set up the change tracking after the editor is created
    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      // Set initial content
      currentContentRef.current = note.content || '';
      
      if (crepeRef.current) {
        // Setup a MutationObserver to track content changes
        const editorContainer = element;
        const observer = new MutationObserver(() => {
          if (crepeRef.current) {
            try {
              const markdown = crepeRef.current.getMarkdown();
              if (markdown) {
                currentContentRef.current = markdown;
                console.log("Editor content changed:", markdown.substring(0, 50) + "...");
              }
            } catch (error) {
              console.error("Error getting markdown during mutation:", error);
            }
          }
        });
        
        // Observe changes to the editor's DOM
        observer.observe(editorContainer, {
          childList: true,
          subtree: true,
          characterData: true
        });
        
        // Add cleanup for the observer
        return () => {
          observer.disconnect();
        };
      }
    });

    return cleanupEditor;
  }, [note?.id, cleanupEditor]);

  if (!note) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">
      <p>Select a note to view</p>
    </div>;
  }

  const handleUpdate = async (field: keyof Note, value: any) => {
    if (onUpdateNote) {
      // Update locally
      onUpdateNote(note.id, {
        [field]: value
      });
      
      // If authenticated, also save to Supabase
      if (mode === 'authenticated' && user) {
        try {
          const updateObject: any = { [field]: value };
          
          // Don't include the updated_at field
          
          const { error } = await supabase
            .from('notes')
            .update(updateObject)
            .eq('id', note.id)
            .eq('user_id', user.id);
            
          if (error) {
            console.error(`Error saving ${field} to Supabase:`, error);
            toast(`Failed to sync ${field}: ` + error.message);
          }
        } catch (error) {
          console.error(`Exception when saving ${field} to Supabase:`, error);
        }
      }
    }
  };

  return <div className="h-full flex flex-col overflow-hidden">
    <div className="p-6 border-b space-y-4">
      <div className="flex items-center justify-between">
        <EditableContent 
          value={note.title} 
          onSave={value => handleUpdate('title', value)} 
          className="text-2xl font-bold" 
        />
      </div>

      <div className="flex items-center space-x-4 text-muted-foreground text-sm">
        <span>Created {formatDistanceToNow(new Date(note.created_at), {
          addSuffix: true
        })}</span>
        <span>•</span>
        <span>{lastReviewedText}</span>
      </div>

      <TagsEditor tags={note.tags} onSave={tags => handleUpdate('tags', tags)} />
    </div>

    <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
      <div className="mb-2">
        <Menubar className="border-none p-0">
          <MenubarMenu>
            <MenubarTrigger className="font-semibold">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={saveNoteContent}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </MenubarItem>
              <MenubarItem onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </MenubarItem>
              <MenubarItem onClick={handleCopy}>
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
                onClick={() => handlePriorityUpdate('high')}
                className={note?.priority === 'high' ? 'bg-accent' : ''}
              >
                <Flag className="mr-2 h-4 w-4" />
                High Priority
              </MenubarItem>
              <MenubarItem 
                onClick={() => handlePriorityUpdate('medium')}
                className={note?.priority === 'medium' ? 'bg-accent' : ''}
              >
                <FlagTriangleRight className="mr-2 h-4 w-4" />
                Medium Priority
              </MenubarItem>
              <MenubarItem 
                onClick={() => handlePriorityUpdate('low')}
                className={note?.priority === 'low' ? 'bg-accent' : ''}
              >
                <FlagTriangleLeft className="mr-2 h-4 w-4" />
                Low Priority
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger onClick={handleReview} className="font-semibold">
              <Feather className="mr-2 h-4 w-4" />
              Mark as Reviewed
            </MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      </div>

      <Card className="h-auto bg-[#F1F0FB] shadow-sm">
        <CardContent className="p-6 h-full">
          <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none focus:outline-none">
            {/* Milkdown editor will render here */}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the note "{note.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (note && onDelete) {
                  onDelete(note.id);
                  setShowDeleteDialog(false);
                } else {
                  toast.error("Delete functionality is not available");
                  setShowDeleteDialog(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>;
}
