
import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Settings, LogOut } from 'lucide-react';
import { Folder as FolderType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SettingsModal } from './SettingsModal';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  folders: FolderType[];
  activeNoteId: string | null;
  onNoteSelect: (noteId: string) => void;
  viewMode: 'notes' | 'review';
  onViewModeChange: (mode: 'notes' | 'review') => void;
}

export function Sidebar({ folders, activeNoteId, onNoteSelect, viewMode, onViewModeChange }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, mode, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
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

  const handleLoginClick = () => {
    navigate('/auth');
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
