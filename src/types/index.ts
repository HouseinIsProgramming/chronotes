export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  last_reviewed_at: string;
  folder_id: string;
  priority?: 'high' | 'medium' | 'low';  // Added optional priority
}

export interface Folder {
  id: string;
  name: string;
  notes: Note[];
}

export type ReviewPriority = 'urgent' | 'medium' | 'low' | 'reviewed';

export interface KanbanColumn {
  title: string;
  priority: ReviewPriority;
  notes: Note[];
}
