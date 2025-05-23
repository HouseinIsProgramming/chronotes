import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Folder } from "@/types";
import { generateSampleData } from "@/utils/sampleDataGenerator";
import { welcomeNote } from "@/sampleData/welcome";
import {
  generateGuestSampleData,
  clearGuestData,
} from "@/utils/indexedDBOperations";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user, mode } = useAuth();

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = "light";
    // const currentTheme = html.classList.contains("dark") ? "light" : "dark";
    html.classList.remove("light", "dark");
    html.classList.add(currentTheme);
  };

  const handleDeleteAllData = async () => {
    if (mode === "guest") {
      setIsDeleting(true);
      try {
        const success = await clearGuestData();
        if (success) {
          toast.success("All guest data has been reset");
          onOpenChange(false);
          window.location.href = "/";
        } else {
          toast.error("Failed to reset guest data");
        }
      } catch (error) {
        console.error("Error resetting guest data:", error);
        toast.error("An error occurred while resetting data");
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (!user) return;

    setIsDeleting(true);
    try {
      const { error: notesError } = await withRetry(() =>
        supabase.from("notes").delete().eq("user_id", user.id),
      );

      if (notesError) throw notesError;

      const { error: foldersError } = await withRetry(() =>
        supabase.from("folders").delete().eq("user_id", user.id),
      );

      if (foldersError) throw foldersError;

      // Create the "Welcome" folder instead of "My Notes"
      const { data, error: welcomeFolderError } = await withRetry(() =>
        supabase
          .from("folders")
          .insert({
            name: "Welcome",
            user_id: user.id,
          })
          .select()
          .single(),
      );

      if (welcomeFolderError) throw welcomeFolderError;

      const welcomeFolder = data as Folder;

      if (welcomeFolder) {
        // Use the welcomeNote from sampleData/welcome.ts
        const { error: welcomeNoteError } = await withRetry(() =>
          supabase.from("notes").insert({
            title: welcomeNote.title,
            content: welcomeNote.content,
            tags: welcomeNote.tags,
            user_id: user.id,
            folder_id: welcomeFolder.id,
            created_at: new Date().toISOString(),
            last_reviewed_at: new Date().toISOString(),
          }),
        );

        if (welcomeNoteError) throw welcomeNoteError;
      }

      toast.success("All data has been reset to default state");
      onOpenChange(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateSampleData = async () => {
    if (mode === "guest") {
      setIsGenerating(true);
      try {
        console.log("Generating guest sample data...");
        const success = await generateGuestSampleData();
        if (success) {
          toast.success("Sample data generated successfully");
          onOpenChange(false);
          window.location.href = "/";
        } else {
          toast.error("Failed to generate sample data");
        }
      } catch (error) {
        console.error("Error generating guest sample data:", error);
        toast.error("An error occurred while generating sample data");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (!user) return;

    setIsGenerating(true);
    const success = await generateSampleData(user.id);
    if (success) {
      onOpenChange(false);
      window.location.href = "/"; // This will fully refresh the app state
    }
    setIsGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Dark mode
              <span className="text-primary"> - Work In Progress</span>
            </span>
            <Switch
              className="cursor-not-allowed"
              onCheckedChange={toggleTheme}
              disabled
            />
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGenerateSampleData}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Generating Sample Data...
                </>
              ) : (
                "Generate Sample Data"
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    all your notes and their history.
                    <div className="mt-4 space-y-2">
                      <p className="font-medium">
                        Type "I understand" to confirm:
                      </p>
                      <Input
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="I understand"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllData}
                    disabled={
                      deleteConfirmation !== "I understand" || isDeleting
                    }
                  >
                    {isDeleting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete All Data"
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
