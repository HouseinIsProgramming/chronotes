
import * as React from "react";
import { Search, Tag } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Note } from "@/types";

interface SearchCommandProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
}

export function SearchCommand({ notes, onNoteSelect }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const isMac = React.useMemo(() => 
    typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0, 
    []
  );

  const filteredNotes = React.useMemo(() => {
    if (!searchTerm) return notes;

    // Check if it's a tag search
    if (searchTerm.startsWith('(') && searchTerm.endsWith(')')) {
      const tag = searchTerm.slice(1, -1).toLowerCase().trim();
      return notes.filter(note => 
        note.tags.some(noteTag => 
          noteTag.toLowerCase().includes(tag)
        )
      );
    }

    // Regular title search
    return notes.filter(note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  const getMatchedTags = (note: Note): string[] => {
    if (!searchTerm.startsWith('(') || !searchTerm.endsWith(')')) return [];
    
    const searchTag = searchTerm.slice(1, -1).toLowerCase().trim();
    return note.tags.filter(tag => 
      tag.toLowerCase().includes(searchTag)
    );
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        Search notes...
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search notes... or use (tag) to search by tag" 
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList>
          <CommandEmpty>No notes found.</CommandEmpty>
          <CommandGroup heading={searchTerm.startsWith('(') ? "Notes with matching tags" : "Notes"}>
            {filteredNotes.map((note) => {
              const matchedTags = getMatchedTags(note);
              return (
                <CommandItem
                  key={note.id}
                  value={`${note.id}-${note.title}`}
                  onSelect={() => {
                    onNoteSelect(note.id);
                    setOpen(false);
                  }}
                  className="flex justify-between items-center"
                >
                  <span className="flex-1 truncate">{note.title}</span>
                  <div className="flex items-center gap-2">
                    {searchTerm.startsWith('(') && matchedTags.map((tag, idx) => (
                      <Badge key={idx} variant="purple" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground opacity-75 truncate max-w-[30%]">
                      {note.folder_id === "1" ? "Web Development" : "Frontend Essentials"}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
