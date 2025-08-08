"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QuickSeriesSetup from "@/components/provider/QuickSeriesSetup";

interface QuickSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  onSuccess: () => void;
}

export default function QuickSeriesModal({
  open,
  onOpenChange,
  providerId,
  onSuccess
}: QuickSeriesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <QuickSeriesSetup
          providerId={providerId}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
} 