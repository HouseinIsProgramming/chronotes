
import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import { Folder as FolderType, Note } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  folders: FolderType[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  viewMode: 'notes' | 'review';
  onViewModeChange: (mode: 'notes' | 'review') => void;
}

export function Sidebar({ folders, activeNoteId, onNoteSelect, viewMode, onViewModeChange }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Toggle Buttons */}
      <div className="p-2 border-b border-sidebar-border">
        <div className="flex bg-sidebar-accent rounded-lg p-1">
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'notes' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => onViewModeChange('notes')}
          >
            Notes
          </Button>
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'review' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => onViewModeChange('review')}
          >
            Review
          </Button>
        </div>
      </div>

      {viewMode === 'notes' && (
        <div className="flex-1 overflow-auto p-2">
          {folders.map(folder => (
            <div key={folder.id} className="mb-1">
              <div 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent cursor-pointer"
                onClick={() => toggleFolder(folder.id)}
              >
                <span className="mr-1">
                  {expandedFolders[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <Folder size={16} className="mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">{folder.name}</span>
              </div>

              {expandedFolders[folder.id] && (
                <div className="ml-6 mt-1 space-y-1">
                  {folder.notes.map(note => (
                    <div
                      key={note.id}
                      className={cn(
                        "flex items-center p-2 rounded-md text-sm cursor-pointer",
                        activeNoteId === note.id
                          ? "bg-sidebar-accent font-medium"
                          : "hover:bg-sidebar-accent/50"
                      )}
                      onClick={() => onNoteSelect(note.id)}
                    >
                      <FileText size={14} className="mr-2 text-muted-foreground" />
                      <span className="truncate">{note.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
