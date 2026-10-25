
import { useTranslation as useUiTranslation } from "@storyteller/i18n";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { useState } from "react";
import { Label } from "../../components/ui/label";

export function RenameProjectDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  projectName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newName: string) => void;
  projectName: string;
}) {
  const { t: translateUi } = useUiTranslation();
  const [name, setName] = useState(projectName);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setName(projectName);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translateUi("Rename project")}</DialogTitle>
        </DialogHeader>

        <DialogBody className="gap-3">
          <Label>{translateUi("New name")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onConfirm(name);
              }
            }}
            placeholder={translateUi("Enter a new name")}
          />
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
          >
            {translateUi("Cancel")}</Button>
          <Button onClick={() => onConfirm(name)}>{translateUi("Rename")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
