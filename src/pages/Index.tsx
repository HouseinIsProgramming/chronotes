import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { NoteView } from "@/components/NoteView";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SearchCommand } from "@/components/SearchCommand";
import { useNotes } from "@/hooks/useNotes";
import { useFlashcards } from "@/hooks/useFlashcards";
import { FlashcardsView } from "@/components/FlashcardsView";
import type { ViewMode } from "@/types";

export default function Index() {
  const { mode, user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('notes');

  const {
    folders,
    activeNoteId,
    activeNote,
    setActiveNoteId,
    handleReview,
    handleNoteUpdate,
    fetchUserData
  } = useNotes(mode, user);

  const { flashcards, isLoading: isLoadingFlashcards, refreshFlashcards } = useFlashcards(mode, user);

  useEffect(() => {
    if (!mode) {
      navigate('/auth');
    }
  }, [mode, navigate]);

  const handleNoteSelect = (noteId: string) => {
    setActiveNoteId(noteId);
    // When selecting a note, always go back to notes view
    setViewMode('notes');
  };

  const handleViewModeChange = (newMode: ViewMode) => {
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
        refreshFlashcards={refreshFlashcards}
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
        ) : viewMode === 'review' ? (
          <KanbanBoard 
            notes={folders.flatMap(folder => folder.notes)} 
            onNoteSelect={handleNoteSelect}
            onReview={handleReview}
            onViewModeChange={handleViewModeChange}
          />
        ) : (
          <FlashcardsView 
            flashcards={flashcards}
            onNoteSelect={handleNoteSelect}
            isLoading={isLoadingFlashcards}
          />
        )}
      </div>
    </div>
  );
}
