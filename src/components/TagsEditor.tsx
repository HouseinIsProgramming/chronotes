
import React, { useState } from 'react';
import { Tag as TagIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagsEditorProps {
  tags: string[];
  onSave: (tags: string[]) => void;
}

export function TagsEditor({ tags, onSave }: TagsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(tags.join(', '));

  const handleSave = () => {
    const newTags = inputValue
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    onSave(newTags);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(tags.join(', '));
    }
  };

  if (!isEditing) {
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => {
          setIsEditing(true);
          setInputValue(tags.join(', '));
        }}
      >
        <TagIcon size={16} className="text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge key={index} variant="purple" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder="Enter tags separated by commas..."
        className="w-full"
        autoFocus
      />
    </div>
  );
}

