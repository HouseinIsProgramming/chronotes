
import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface EditableContentProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  multiline?: boolean;
  alwaysEditable?: boolean;
}

export function EditableContent({ 
  value, 
  onSave, 
  className, 
  multiline = false,
  alwaysEditable = false
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(alwaysEditable);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Reset edit value when value prop changes (switching between notes)
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if ((isEditing || alwaysEditable) && inputRef.current) {
      // For textareas, adjust height to fit content
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline, alwaysEditable]);

  // Update height on content change
  useEffect(() => {
    if ((isEditing || alwaysEditable) && multiline && inputRef.current instanceof HTMLTextAreaElement) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [editValue, isEditing, multiline, alwaysEditable]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape' && !alwaysEditable) {
      setIsEditing(false);
      setEditValue(value);
    }
  };

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    if (!alwaysEditable) {
      setIsEditing(false);
    }
  };

  if (isEditing || alwaysEditable) {
    const Component = multiline ? 'textarea' : 'input';
    return (
      <Component
        ref={inputRef as any}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={alwaysEditable ? () => onSave(editValue) : handleSave}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-background border rounded-md p-2",
          multiline && "resize-none overflow-hidden min-h-[100px]",
          className
        )}
        style={multiline ? { height: 'auto' } : {}}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn("cursor-text", multiline && "whitespace-pre-wrap", className)}
    >
      {value}
    </div>
  );
}
