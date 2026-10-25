
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
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  projectNames,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  projectNames: string[];
}) {
  const { t: translateUi } = useUiTranslation();
  const count = projectNames.length;
  const isSingle = count === 1;
  const singleName = isSingle ? projectNames[0] : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {singleName
              ? translateUi("Delete project {{name}}?", { name: singleName })
              : translateUi("Delete {{count}} projects?", { count })}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <Alert variant="destructive">
            <AlertTitle>{translateUi("Warning")}</AlertTitle>
            <AlertDescription>
              {singleName
                ? translateUi("Permanently delete {{name}} and all associated files.", { name: singleName })
                : translateUi("Permanently delete {{count}} projects and all associated files.", { count })}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3">
            <Label className="text-xs font-semibold text-slate-500">
              {translateUi("Type \"DELETE\" to confirm")}</Label>
            <Input
              type="text"
              placeholder="DELETE"
              size="lg"
              variant="destructive"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translateUi("Cancel")}</Button>
          <Button variant="destructive" onClick={onConfirm}>
            {translateUi("Delete project")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
