import { useEffect, useState, useRef, useCallback } from 'react';
import { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { EditableContent } from '@/components/EditableContent';
import { TagsEditor } from '@/components/TagsEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Crepe } from "@milkdown/crepe";
import { Save } from 'lucide-react';
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

const flashcardStyles = `
pre[data-language="flashcard"] {
  background-color: #FEF7CD;
  padding: 1rem;
  border-radius: 0.5rem;
  color: #000;
  margin: 16px 0;
}

pre[data-language="flashcard"] code {
  font-family: inherit;
  background: none;
  padding: 0;
}

.flashcard-container {
  background-color: #FEF7CD;
  border: 1px solid #8E9196;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.flashcard-question {
  font-weight: 600;
  margin-bottom: 8px;
}

.flashcard-separator {
  border-top: 1px dashed #8E9196;
  margin: 8px 0;
}

.flashcard-answer {
  margin-top: 8px;
}
`;

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
    const styleElement = document.createElement('style');
    styleElement.textContent = flashcardStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
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
        const markdown = crepeRef.current.getMarkdown();
        console.log("Markdown content to save:", markdown?.substring(0, 50) + "...");
        
        onUpdateNote(note.id, { content: markdown || note.content });
        
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
        onUpdateNote(note.id, { content: currentContentRef.current });
        toast("Note saved (fallback method)");
      }
    } else {
      console.log("Save failed - note, onUpdateNote, or crepeRef is null");
    }
  }, [note, onUpdateNote, mode, user]);

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
    
    crepeRef.current = new Crepe({
      root: element,
      defaultValue: note.content || '',
      commands: {
        insertFlashcard: {
          trigger: '/',
          keyword: 'flashcard',
          icon: '🧠',
          description: 'Insert a flashcard block',
          action: (editor) => {
            const flashcardTemplate = [
              '```flashcard',
              '## title',
              '',
              '## front side',
              '',
              'backside',
              '',
              '```flashcardend'
            ].join('\n');
            
            editor.insertText(flashcardTemplate);
            return true;
          }
        }
      }
    });

    crepeRef.current.create().then(() => {
      console.log("Editor created for note:", note.id);
      currentContentRef.current = note.content || '';
      
      if (crepeRef.current) {
        const editorContainer = element;
        const observer = new MutationObserver(() => {
          if (crepeRef.current) {
            try {
              const markdown = crepeRef.current.getMarkdown();
              if (markdown) {
                currentContentRef.current = markdown;
                console.log("Editor content changed:", markdown.substring(0, 50) + "...");
              }
              
              setTimeout(() => {
                processFlashcardBlocks(editorContainer);
              }, 100);
            } catch (error) {
              console.error("Error getting markdown during mutation:", error);
            }
          }
        });
        
        observer.observe(editorContainer, {
          childList: true,
          subtree: true,
          characterData: true
        });
        
        setTimeout(() => {
          processFlashcardBlocks(editorContainer);
        }, 300);
        
        return () => {
          observer.disconnect();
        };
      }
    });

    return cleanupEditor;
  }, [note?.id, cleanupEditor]);

  const processFlashcardBlocks = (container: HTMLDivElement) => {
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
      const content = codeBlock.textContent || '';
      if (content.startsWith('???') && content.endsWith('???') && content.includes('---')) {
        const preElement = codeBlock.parentElement;
        if (!preElement) return;
        
        if (preElement.classList.contains('flashcard-processed')) return;
        
        preElement.classList.add('flashcard-processed');
        
        const cleanContent = content.replace(/^\?\?\?|\?\?\?$/g, '').trim();
        const [question, answer] = cleanContent.split('---').map(part => part.trim());
        
        const flashcardContainer = document.createElement('div');
        flashcardContainer.className = 'flashcard-container';
        
        const questionElem = document.createElement('div');
        questionElem.className = 'flashcard-question';
        questionElem.textContent = question;
        flashcardContainer.appendChild(questionElem);
        
        const separator = document.createElement('div');
        separator.className = 'flashcard-separator';
        flashcardContainer.appendChild(separator);
        
        const answerElem = document.createElement('div');
        answerElem.className = 'flashcard-answer';
        answerElem.textContent = answer;
        flashcardContainer.appendChild(answerElem);
        
        preElement.parentElement?.replaceChild(flashcardContainer, preElement);
      }
    });
  };

  if (!note) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a note to view</p>
      </div>;
  }

  const handleUpdate = async (field: keyof Note, value: any) => {
    if (onUpdateNote) {
      onUpdateNote(note.id, {
        [field]: value
      });
      
      if (mode === 'authenticated' && user) {
        try {
          const updateObject: any = { [field]: value };
          
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
          <button 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition" 
            onClick={async () => {
              onReview(note.id);
              
              if (mode === 'authenticated' && user) {
                try {
                  const now = new Date().toISOString();
                  const { error } = await supabase
                    .from('notes')
                    .update({ last_reviewed_at: now })
                    .eq('id', note.id)
                    .eq('user_id', user.id);
                    
                  if (error) {
                    console.error("Error updating review time in Supabase:", error);
                  }
                } catch (error) {
                  console.error("Exception when updating review time:", error);
                }
              }
            }}
          >
            Mark as Reviewed
          </button>
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
        <div className="mb-2 flex justify-end">
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
