
import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(currentTheme);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete all notes and their history for the current user
      const { error: notesError } = await withRetry(() => 
        supabase
          .from('notes')
          .delete()
          .eq('user_id', user.id)
      );

      if (notesError) throw notesError;

      // Delete all folders for the current user
      const { error: foldersError } = await withRetry(() => 
        supabase
          .from('folders')
          .delete()
          .eq('user_id', user.id)
      );

      if (foldersError) throw foldersError;

      // Create a default folder instead of using the RPC function that doesn't exist
      const { error: createFolderError } = await withRetry(() =>
        supabase
          .from('folders')
          .insert({ name: 'Default', user_id: user.id })
      );

      if (createFolderError) throw createFolderError;

      toast.success("All data has been reset to default state");
      onOpenChange(false); // Close the settings modal
      navigate('/'); // Redirect to default view
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark mode</span>
            <Switch onCheckedChange={toggleTheme} />
          </div>

          <div className="space-y-2">
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
                    This action cannot be undone. This will permanently delete all your notes
                    and their history.
                    <div className="mt-4 space-y-2">
                      <p className="font-medium">Type "I understand" to confirm:</p>
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
                    disabled={deleteConfirmation !== "I understand" || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete All Data'
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
