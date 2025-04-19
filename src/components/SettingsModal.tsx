
import { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase, withRetry } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const { user } = useAuth();

  const toggleTheme = () => {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'light' : 'dark';
    html.classList.remove('light', 'dark');
    html.classList.add(currentTheme);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    
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

      // Create default folders and notes
      const { error: defaultError } = await withRetry(() => 
        supabase
          .rpc('create_default_data_for_user', { user_id_param: user.id })
      );

      if (defaultError) throw defaultError;

      toast.success("All data has been reset to default state");
      onOpenChange(false); // Close the settings modal
    } catch (error) {
      console.error("Error resetting data:", error);
      toast.error("Failed to reset data");
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
                    disabled={deleteConfirmation !== "I understand"}
                  >
                    Delete All Data
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
