
import React from 'react';
import {
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PrioritySelectorProps {
  onPriorityUpdate: (priority: 'high' | 'medium' | 'low' | null) => void;
}

export function PrioritySelector({ onPriorityUpdate }: PrioritySelectorProps) {
  const handlePriorityChange = (value: string) => {
    const priority = value as 'high' | 'medium' | 'low' | null;
    onPriorityUpdate(priority);
  };

  return (
    <Select onValueChange={handlePriorityChange}>
      <SelectTrigger className="w-[120px]">
        <SelectValue placeholder="Priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="high">High</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="">None</SelectItem>
      </SelectContent>
    </Select>
  );
}

