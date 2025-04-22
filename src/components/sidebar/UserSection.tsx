
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface UserSectionProps {
  onSettingsOpen: () => void;
}

export const UserSection = ({ onSettingsOpen }: UserSectionProps) => {
  const { user, mode } = useAuth();

  const handleClick = () => {
    onSettingsOpen();
  };

  return (
    <div className="p-2">
      <div
        role="button"
        onClick={handleClick}
        className="flex items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent transition-colors cursor-pointer"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.user_metadata?.avatar_url || ''} alt={user?.email || 'User'} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {user?.email?.charAt(0)?.toUpperCase() || (mode === 'guest' ? 'G' : 'U')}
          </AvatarFallback>
        </Avatar>
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">
            {user?.email || (mode === 'guest' ? 'Guest User' : 'Unknown User')}
          </p>
          <p className="text-xs text-muted-foreground">
            {mode === 'guest' ? 'Limited functionality' : 'All features available'}
          </p>
        </div>
      </div>
    </div>
  );
};
