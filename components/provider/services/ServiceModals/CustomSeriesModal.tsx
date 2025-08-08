"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CustomSeriesCreator from "@/components/provider/CustomSeriesCreator";

interface CustomSeriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  onSuccess: () => void;
}

export default function CustomSeriesModal({
  open,
  onOpenChange,
  providerId,
  onSuccess
}: CustomSeriesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <CustomSeriesCreator
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