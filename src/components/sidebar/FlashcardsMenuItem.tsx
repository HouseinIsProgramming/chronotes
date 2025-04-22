
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashcardsMenuItemProps {
  isActive: boolean;
  onClick: () => void;
  onRefresh: () => void;
}

export const FlashcardsMenuItem = ({
  isActive,
  onClick,
  onRefresh,
}: FlashcardsMenuItemProps) => {
  const handleClick = () => {
    onClick();
    onRefresh();
  };

  return (
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn(
        "w-full justify-start gap-2 h-9 px-2 bg-[#FEF7CD] border border-[#E5DFB9] hover:bg-[#F5EDB8]",
        isActive && "bg-[#F5EDB8] text-[#222]"
      )}
    >
      <Search className="h-4 w-4 text-[#333]" />
      <span className="text-[#222]">Flashcards</span>
    </Button>
  );
};

