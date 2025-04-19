import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Settings, LogOut, FolderPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Folder as FolderType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from './SettingsModal';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { supabase, withRetry } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SidebarProps {
  folders: FolderType[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  viewMode: 'notes' | 'review';
  onViewModeChange: (mode: 'notes' | 'review') => void;
  refreshFolders: () => void;
}

export function Sidebar({ folders, activeNoteId, onNoteSelect, viewMode, onViewModeChange, refreshFolders }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const { user, mode, signOut } = useAuth();
  const navigate = useNavigate();
  const folderRenameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      toast.error("Please log in to create folders");
      return;
    }

    const folderName = "New Folder";
    try {
      const { data, error } = await withRetry(() => 
        supabase
          .from('folders')
          .insert({
            name: folderName,
            user_id: user?.id
          })
          .select()
          .single()
      );

      if (error) {
        console.error("Error creating folder:", error);
        throw error;
      }
      
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
      toast.error("Please log in to create notes");
      return;
    }

    try {
      console.log("Creating note in folder:", folderId);
      
      if (!folderId || typeof folderId !== 'string' || !folderId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        toast.error("Invalid folder selected");
        console.error("Invalid folder ID:", folderId);
        return;
      }
      
      const { data, error } = await withRetry(() => 
        supabase
          .from('notes')
          .insert({
            title: 'New Note',
            content: '',
            folder_id: folderId,
            user_id: user?.id,
            tags: []
          })
          .select()
          .single()
      );

      if (error) {
        console.error("Error creating note:", error);
        throw error;
      }
      
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

  const startEditingFolder = (folderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setEditingFolderId(folderId);
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  const handleNoteClick = (noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onNoteSelect(noteId);
  };

  const handleViewModeChange = (mode: 'notes' | 'review', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewModeChange(mode);
  };

  const handleSettingsOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSettingsOpen(true);
  };

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    signOut();
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
    return () => {
      if (folderRenameTimerRef.current) {
        clearTimeout(folderRenameTimerRef.current);
      }
    };
  }, []);

  const getUserInitials = () => {
    if (!user) return '?';
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (!user) return null;
    const githubProvider = user.identities?.find(identity => identity.provider === 'github');
    if (githubProvider?.identity_data?.avatar_url) {
      return githubProvider.identity_data.avatar_url;
    }
    const googleProvider = user.identities?.find(identity => identity.provider === 'google');
    if (googleProvider?.identity_data?.picture) {
      return googleProvider.identity_data.picture;
    }
    return null;
  };

  return (
    <div className="w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-2 border-b border-sidebar-border">
        <div className="flex bg-sidebar-accent rounded-lg p-1">
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'notes' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={(e) => handleViewModeChange('notes', e)}
            type="button"
          >
            Notes
          </Button>
          <Button
            variant="ghost"
            className={cn("flex-1 h-9 rounded-md font-normal", 
              viewMode === 'review' ? "bg-white shadow-sm text-primary" : "text-muted-foreground")}
            onClick={(e) => handleViewModeChange('review', e)}
            type="button"
          >
            Review
          </Button>
        </div>
      </div>

      {viewMode === 'notes' && (
        <div className="flex-1 overflow-auto p-2">
          <div className="flex items-center justify-between mb-2">
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
            <div key={folder.id} className="mb-1">
              <ContextMenu>
                <ContextMenuTrigger>
                  <div 
                    className="flex items-center p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group relative"
                    onClick={(e) => toggleFolder(folder.id, e)}
                    onMouseEnter={() => {
                      if (folderRenameTimerRef.current) {
                        clearTimeout(folderRenameTimerRef.current);
                      }
                      
                      folderRenameTimerRef.current = setTimeout(() => {
                        if (editingFolderId !== folder.id) {
                          const renameButton = document.querySelector(`[data-folder-id="${folder.id}"] .rename-button`) as HTMLElement;
                          if (renameButton) {
                            renameButton.classList.remove('opacity-0');
                          }
                        }
                      }, 500);
                    }}
                    onMouseLeave={() => {
                      if (folderRenameTimerRef.current) {
                        clearTimeout(folderRenameTimerRef.current);
                        folderRenameTimerRef.current = null;
                      }
                      
                      if (editingFolderId !== folder.id) {
                        const renameButton = document.querySelector(`[data-folder-id="${folder.id}"] .rename-button`) as HTMLElement;
                        if (renameButton) {
                          renameButton.classList.add('opacity-0');
                        }
                      }
                    }}
                    data-folder-id={folder.id}
                  >
                    <span className="mr-1">
                      {expandedFolders[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <Folder size={16} className="mr-2 text-muted-foreground" />
                    
                    {editingFolderId === folder.id ? (
                      <Input
                        className="h-6 text-sm py-0 px-1"
                        defaultValue={folder.name}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenameFolder(folder.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingFolderId(null);
                          }
                        }}
                        onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <>
                        <span className="text-sm font-medium">{folder.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto opacity-0 transition-opacity rename-button absolute right-2"
                          onClick={(e) => startEditingFolder(folder.id, e)}
                          type="button"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Folder
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>

              {expandedFolders[folder.id] && (
                <div className="ml-6 mt-1 space-y-1">
                  {folder.notes.map(note => (
                    <ContextMenu key={note.id}>
                      <ContextMenuTrigger>
                        <div
                          className={cn(
                            "flex items-center p-2 rounded-md text-sm cursor-pointer",
                            activeNoteId === note.id
                              ? "bg-sidebar-accent font-medium"
                              : "hover:bg-sidebar-accent/50"
                          )}
                          onClick={(e) => handleNoteClick(note.id, e)}
                        >
                          <FileText size={14} className="mr-2 text-muted-foreground" />
                          <span className="truncate">{note.title}</span>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Note
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => handleCreateNote(e, folder.id)}
                    type="button"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Note
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto p-2">
        <Separator className="mb-2" />
        
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettingsOpen}
            className="h-8 w-8"
            type="button"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {mode === 'authenticated' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        {mode === 'authenticated' ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar>
              <AvatarImage src={getAvatarUrl() || ''} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Logged in as</span>
              <span className="text-sm font-medium truncate">{user?.email}</span>
            </div>
          </div>
        ) : (
          <div className="px-2 py-2">
            <div className="mb-2 flex items-center gap-2">
              <Avatar>
                <AvatarFallback>G</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Guest mode</span>
                <span className="text-sm font-medium text-orange-500">No sync</span>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={handleLoginClick}
              type="button"
            >
              Log in to enable sync
            </Button>
          </div>
        )}

        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
}
