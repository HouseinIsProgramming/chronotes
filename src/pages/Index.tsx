
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { NoteView } from "@/components/NoteView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SearchCommand } from "@/components/SearchCommand";
import { useNotes } from "@/hooks/useNotes";

export default function Index() {
  const { mode, user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'notes' | 'review'>('notes');

  const {
    folders,
    activeNoteId,
    activeNote,
    setActiveNoteId,
    handleReview,
    handleNoteUpdate,
    fetchUserData
  } = useNotes(mode, user);

  useEffect(() => {
    if (!mode) {
      navigate('/auth');
    }
  }, [mode, navigate]);

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
  };

  const handleViewModeChange = (newMode: 'notes' | 'review') => {
    setViewMode(newMode);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        folders={folders}
        activeNoteId={activeNoteId}
        onNoteSelect={handleNoteSelect}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        refreshFolders={fetchUserData}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b p-4 flex justify-end">
          <SearchCommand 
            notes={folders.flatMap(folder => folder.notes)} 
            onNoteSelect={handleNoteSelect}
          />
        </div>
        {viewMode === 'notes' ? (
          <NoteView 
            note={activeNote} 
            onReview={handleReview}
            onUpdateNote={handleNoteUpdate}
          />
        ) : (
          <KanbanBoard 
            notes={folders.flatMap(folder => folder.notes)} 
            onNoteSelect={handleNoteSelect}
            onReview={handleReview}
            onViewModeChange={handleViewModeChange}
          />
        )}
      </div>
    </div>
  );
}
