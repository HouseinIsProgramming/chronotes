
import React, { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
import { Folder } from '@/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from './SettingsModal';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FolderItem } from './sidebar/FolderItem';
import { UserSection } from './sidebar/UserSection';
import { FlashcardsMenuItem } from './sidebar/FlashcardsMenuItem';
import { getUniqueNameInList } from '@/utils/nameUtils';
import { createGuestFolder, createGuestNote, renameGuestFolder } from '@/utils/guestOperations';

interface SidebarProps {
  folders: Folder[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  viewMode: 'notes' | 'review' | 'flashcards';
  onViewModeChange: (mode: 'notes' | 'review' | 'flashcards') => void;
  refreshFolders: () => void;
}

export function Sidebar({ 
  folders, 
  activeNoteId, 
  onNoteSelect, 
  viewMode,
  onViewModeChange,
  refreshFolders 
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const expanded: Record<string, boolean> = {};
    if (activeNoteId) {
      const folderWithActiveNote = folders.find(folder => 
        folder.notes.some(note => note.id === activeNoteId)
      );
      if (folderWithActiveNote) {
        expanded[folderWithActiveNote.id] = true;
      }
    }
    return expanded;
  });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const { user, mode } = useAuth();

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mode === 'guest') {
      const folderId = await createGuestFolder("New Folder");
      if (folderId) {
        setEditingFolderId(folderId);
        refreshFolders();
      }
      return;
    }

    try {
      const existingFolderNames = folders.map(f => f.name);
      const newFolderName = getUniqueNameInList("New Folder", existingFolderNames);

      const { data, error } = await withRetry(() => 
        supabase
          .from('folders')
          .insert({
            name: newFolderName,
            user_id: user?.id
          })
          .select()
          .single()
      );

      if (error) throw error;
      
      toast.success("Folder created successfully");
      
      const folder = data as { id: string } | null;
      if (folder) {
        setEditingFolderId(folder.id);
        refreshFolders(); 
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error("Failed to create folder");
    }
  };

  const handleCreateNote = async (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mode === 'guest') {
      const noteId = await createGuestNote(folderId, "New Note");
      if (noteId) {
        setExpandedFolders(prev => ({
          ...prev,
          [folderId]: true
        }));
        
        refreshFolders();
        
        setTimeout(() => {
          onNoteSelect(noteId);
        }, 300);
      }
      return;
    }

    try {
      if (!folderId || typeof folderId !== 'string' || !folderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        toast.error("Invalid folder selected");
        return;
      }

      const currentFolder = folders.find(f => f.id === folderId);
      if (!currentFolder) {
        toast.error("Folder not found");
        return;
      }

      const existingNoteTitles = currentFolder.notes.map(n => n.title);
      const newNoteTitle = getUniqueNameInList("New Note", existingNoteTitles);
      
      const { data, error } = await withRetry(() => 
        supabase
          .from('notes')
          .insert({
            title: newNoteTitle,
            content: '',
            folder_id: folderId,
            user_id: user?.id,
            tags: []
          })
          .select()
          .single()
      );

      if (error) throw error;
      
      toast.success("Note created successfully");
      
      const note = data as { id: string } | null;
      if (note) {
        setExpandedFolders(prev => ({
          ...prev,
          [folderId]: true
        }));
        
        refreshFolders();
        
        setTimeout(() => {
          onNoteSelect(note.id);
        }, 300);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error("Failed to create note");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    if (mode === 'guest') {
      const success = await renameGuestFolder(folderId, newName);
      if (success) {
        setEditingFolderId(null);
        refreshFolders();
      }
      return;
    }
    
    try {
      const { error } = await withRetry(() => 
        supabase
          .from('folders')
          .update({ name: newName })
          .eq('id', folderId)
          .eq('user_id', user?.id)
      );

      if (error) throw error;
      toast.success("Folder renamed successfully");
      setEditingFolderId(null);
      refreshFolders();
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error("Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (mode === 'guest') {
      toast.error("Please log in to delete folders");
      return;
    }

    try {
      const { error: notesError } = await withRetry(() =>
        supabase
          .from('notes')
          .delete()
          .eq('folder_id', folderId)
          .eq('user_id', user?.id)
      );

      if (notesError) throw notesError;

      const { error: folderError } = await withRetry(() =>
        supabase
          .from('folders')
          .delete()
          .eq('id', folderId)
          .eq('user_id', user?.id)
      );

      if (folderError) throw folderError;

      toast.success("Folder deleted successfully");
      refreshFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error("Failed to delete folder");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (mode === 'guest') {
      toast.error("Please log in to delete notes");
      return;
    }

    try {
      const { error } = await withRetry(() =>
        supabase
          .from('notes')
          .delete()
          .eq('id', noteId)
          .eq('user_id', user?.id)
      );

      if (error) throw error;

      toast.success("Note deleted successfully");
      if (activeNoteId === noteId) {
        onNoteSelect('');
      }
      refreshFolders();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error("Failed to delete note");
    }
  };

  useEffect(() => {
    if (activeNoteId) {
      const folderWithActiveNote = folders.find(folder => 
        folder.notes.some(note => note.id === activeNoteId)
      );
      if (folderWithActiveNote) {
        setExpandedFolders(prev => ({
          ...prev,
          [folderWithActiveNote.id]: true
        }));
      }
    }
  }, [activeNoteId, folders]);

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-2 border-b border-sidebar-border">
        <div className="flex bg-sidebar-accent rounded-lg p-1">
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'notes' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => onViewModeChange('notes')}
            type="button"
          >
            Notes
          </Button>
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'review' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={() => onViewModeChange('review')}
            type="button"
          >
            Review
          </Button>
        </div>
      </div>

      {viewMode === 'notes' && (
        <div className="flex-1 overflow-auto p-2">
          <FlashcardsMenuItem
            isActive={viewMode === 'flashcards'}
            onClick={() => onViewModeChange('flashcards')}
          />
          <div className="flex items-center justify-between mt-4 mb-2">
            <span className="text-sm font-medium">Folders</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCreateFolder}
              type="button"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          {folders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              expanded={expandedFolders[folder.id]}
              onToggle={toggleFolder}
              onNoteSelect={onNoteSelect}
              activeNoteId={activeNoteId}
              onCreateNote={handleCreateNote}
              editingFolderId={editingFolderId}
              onStartEditing={setEditingFolderId}
              onRename={handleRenameFolder}
              onDelete={handleDeleteFolder}
              onDeleteNote={handleDeleteNote}
            />
          ))}
        </div>
      )}

      <Separator className="mb-2" />
      <UserSection onSettingsOpen={setSettingsOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
