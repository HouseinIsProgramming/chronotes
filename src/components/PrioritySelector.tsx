
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
    // Convert "none" string to actual null value
    const priority = value === "none" ? null : value as 'high' | 'medium' | 'low';
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
        <SelectItem value="none">None</SelectItem>
      </SelectContent>
    </Select>
  );
}
