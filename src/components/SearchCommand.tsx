
import * as React from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Note } from "@/types";

interface SearchCommandProps {
  notes: Note[];
  onNoteSelect: (noteId: string) => void;
}

export function SearchCommand({ notes, onNoteSelect }: SearchCommandProps) {
  const [open, setOpen] = React.useState(false);
  const isMac = React.useMemo(() => 
    typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0, 
    []
  );

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
        <CommandInput placeholder="Search all notes..." />
        <CommandList>
          <CommandEmpty>No notes found.</CommandEmpty>
          <CommandGroup heading="Notes">
            {notes.map((note) => (
              <CommandItem
                key={note.id}
                value={note.title}
                onSelect={() => {
                  onNoteSelect(note.id);
                  setOpen(false);
                }}
              >
                {note.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
