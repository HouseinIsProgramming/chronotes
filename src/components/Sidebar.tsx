
import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Settings, LogOut, FolderPlus, Pencil, Plus } from 'lucide-react';
import { Folder as FolderType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from './SettingsModal';
import { useNavigate } from 'react-router-dom';
import { Input } from './ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [newFolderName, setNewFolderName] = useState('');
  const { user, mode, signOut } = useAuth();
  const navigate = useNavigate();
  let folderRenameTimer: ReturnType<typeof setTimeout>;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = async () => {
    if (mode === 'guest') {
      toast.error("Please log in to create folders");
      return;
    }

    const folderName = "New Folder";
    try {
      const { data: folder, error } = await supabase
        .from('folders')
        .insert({
          name: folderName,
          user_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Folder created successfully");
      setEditingFolderId(folder.id);
      refreshFolders(); // Call the refresh function instead of navigating
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error("Failed to create folder");
    }
  };

  const handleCreateNote = async (folderId: string) => {
    if (mode === 'guest') {
      toast.error("Please log in to create notes");
      return;
    }

    try {
      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          title: 'New Note',
          content: '',
          folder_id: folderId,
          user_id: user?.id,
          tags: []
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Note created successfully");
      
      if (note) {
        setExpandedFolders(prev => ({
          ...prev,
          [folderId]: true
        }));
        
        // Refresh folders to get the updated list
        refreshFolders();
        
        // After the refresh is complete, select the new note
        onNoteSelect(note.id);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error("Failed to create note");
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId)
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success("Folder renamed successfully");
      setEditingFolderId(null);
      refreshFolders(); // Call the refresh function instead of navigating
    } catch (error) {
      console.error('Error renaming folder:', error);
      toast.error("Failed to rename folder");
    }
  };

  const startEditingFolder = (folderId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingFolderId(folderId);
  };

  const handleLoginClick = () => {
    navigate('/auth');
  };

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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Folders</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCreateFolder}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>

          {folders.map(folder => (
            <div key={folder.id} className="mb-1">
              <div 
                className="flex items-center p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group relative"
                onClick={() => toggleFolder(folder.id)}
                onMouseEnter={(e) => {
                  folderRenameTimer = setTimeout(() => {
                    if (editingFolderId !== folder.id) {
                      e.currentTarget.querySelector('.rename-button')?.classList.remove('opacity-0');
                    }
                  }, 500);
                }}
                onMouseLeave={(e) => {
                  clearTimeout(folderRenameTimer);
                  if (editingFolderId !== folder.id) {
                    e.currentTarget.querySelector('.rename-button')?.classList.add('opacity-0');
                  }
                }}
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
                        handleRenameFolder(folder.id, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
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
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleCreateNote(folder.id)}
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
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8"
          >
            <Settings className="h-4 w-4" />
          </Button>
          {mode === 'authenticated' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
