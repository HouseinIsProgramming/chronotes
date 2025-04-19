
import React, { useState } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagsEditorProps {
  tags: string[];
  onSave: (tags: string[]) => void;
}

export function TagsEditor({ tags, onSave }: TagsEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTags = [...tags, inputValue.trim()];
      onSave(newTags);
      setInputValue('');
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onSave(newTags);
  };

  if (!isEditing) {
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => setIsEditing(true)}
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
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="purple" className="text-xs group">
            {tag}
            <X
              size={14}
              className="ml-1 cursor-pointer hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
            />
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            onSave([...tags, inputValue.trim()]);
          }
          setIsEditing(false);
          setInputValue('');
        }}
        placeholder="Add a tag..."
        className="w-full"
        autoFocus
      />
    </div>
  );
}
