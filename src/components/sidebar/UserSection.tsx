
import React from 'react';
import { LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UserSectionProps {
  onSettingsOpen: (e: React.MouseEvent) => void;
}

export function UserSection({ onSettingsOpen }: UserSectionProps) {
  const { user, mode, signOut } = useAuth();
  const navigate = useNavigate();

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

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/auth');
  };

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    signOut();
  };

  return (
    <div className="mt-auto p-2">
      <div className="flex items-center justify-between px-2 py-2 mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsOpen}
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
    </div>
  );
}
