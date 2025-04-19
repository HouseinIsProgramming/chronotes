import { useEffect, useState, useRef, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import { Save, Feather, Flag, FlagTriangleRight, FlagTriangleLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface NoteViewProps {
  note: Note | null;
  onReview: (noteId: string) => void;
  onUpdateNote?: (noteId: string, updates: Partial<Note>) => void;
}

export function NoteView({
  note,
  onReview,
  onUpdateNote
}: NoteViewProps) {
  const [lastReviewedText, setLastReviewedText] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const currentContentRef = useRef<string>(''); // Use a ref to track the current content
  const { mode, user } = useAuth();
  
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
        // Update note in local state
        onUpdateNote(note.id, { priority });
        
        // If authenticated, also save to Supabase
        if (mode === 'authenticated' && user) {
          const { error } = await supabase
            .from('notes')
            .update({ priority })
            .eq('id', note.id)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating note priority:", error);
            toast.error("Failed to update note priority");
          } else {
            toast.success(`Note marked as ${priority} priority`);
          }
        } else {
          toast.success(`Note marked as ${priority} priority`);
        }
      } catch (error) {
        console.error("Exception when updating note priority:", error);
        toast.error("Failed to update note priority");
      }
    }
  }, [note, onUpdateNote, mode, user]);

  const handleReview = useCallback(async () => {
    if (note) {
      onReview(note.id);
      
      // If authenticated, also update last_reviewed_at and reset priority in Supabase
      if (mode === 'authenticated' && user) {
        try {
          const now = new Date().toISOString();
          const { error } = await supabase
            .from('notes')
            .update({ 
              last_reviewed_at: now,
              priority: null  // Reset priority when reviewed
            })
            .eq('id', note.id)
            .eq('user_id', user.id);
            
          if (error) {
            console.error("Error updating review time in Supabase:", error);
            toast.error("Failed to mark note as reviewed");
          } else {
            toast.success("Note marked as reviewed");
          }
        } catch (error) {
          console.error("Exception when updating review time:", error);
          toast.error("Failed to mark note as reviewed");
        }
      }
    }
  }, [note, onReview, mode, user]);

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
        <div className="mb-2 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log("Save button clicked");
              saveNoteContent();
            }}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleReview}
            className="gap-2"
          >
            <Feather className="h-4 w-4" />
            Mark as Reviewed
          </Button>
          <Button 
            variant={note.priority === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePriorityUpdate('high')}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            High Priority
          </Button>
          <Button 
            variant={note.priority === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePriorityUpdate('medium')}
            className="gap-2"
          >
            <FlagTriangleRight className="h-4 w-4" />
            Medium Priority
          </Button>
          <Button 
            variant={note.priority === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePriorityUpdate('low')}
            className="gap-2"
          >
            <FlagTriangleLeft className="h-4 w-4" />
            Low Priority
          </Button>
        </div>
        <Card className="h-auto bg-[#F1F0FB] shadow-sm">
          <CardContent className="p-6 h-full">
            <div ref={editorRef} className="prose prose-sm md:prose-base max-w-none focus:outline-none">
              {/* Milkdown editor will render here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
