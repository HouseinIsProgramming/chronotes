import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileOverlayProps {
  onClose?: () => void;
}

export function MobileOverlay({ onClose }: MobileOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6 animate-in fade-in-50 zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Desktop Only</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-4">
          <p>
            Chronotes is currently optimized for desktop use only. Please switch
            to a desktop device for a usable experience.
          </p>
          <p className="text-muted-foreground text-sm">
            I am working on making Chronotes fully responsive for mobile
            devices. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  );
}
