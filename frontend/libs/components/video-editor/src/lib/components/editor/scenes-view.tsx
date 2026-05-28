"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Check, ListCheck, Trash2 } from "lucide-react";
import { cn } from "../../utils/ui";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { canDeleteScene, getMainScene } from "../../timeline/scenes";
import { useEditorAdapters } from "../../EditorProvider";
import { useEditor } from "../../editor/use-editor";

export function ScenesView({ children }: { children: React.ReactNode }) {
  const editor = useEditor();
  const scenes = editor.scenes.getScenes();
  const currentScene = editor.scenes.getActiveScene();
  const { toast } = useEditorAdapters();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());

  const handleSceneSwitch = async (sceneId: string) => {
    if (isSelectMode) {
      toggleSceneSelection({ sceneId });
      return;
    }

    try {
      await editor.scenes.switchToScene({ sceneId });
    } catch (error) {
      console.error("Failed to switch scene:", error);
    }
  };

  const toggleSceneSelection = ({ sceneId }: { sceneId: string }) => {
    setSelectedScenes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sceneId)) {
        newSet.delete(sceneId);
      } else {
        newSet.add(sceneId);
      }
      return newSet;
    });
  };

  const handleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedScenes(new Set());
  };

  const handleDeleteSelected = async () => {
    for (const sceneId of selectedScenes) {
      const scene = scenes.find((scene) => scene.id === sceneId);
      if (!scene) {
        continue;
      }

      const { canDelete, reason } = canDeleteScene({ scene });
      if (!canDelete) {
        toast.error(reason || "Failed to delete scene");
        continue;
      }

      try {
        await editor.scenes.deleteScene({ sceneId });
      } catch (error) {
        console.error("Failed to delete scene:", error);
      }
    }
    setSelectedScenes(new Set());
    setIsSelectMode(false);
  };

  const isMainSceneSelected = (() => {
    const mainScene = getMainScene({ scenes });
    return Boolean(mainScene?.id && selectedScenes.has(mainScene.id));
  })();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isSelectMode ? `Select scenes (${selectedScenes.size})` : "Scenes"}
          </SheetTitle>
          <SheetDescription>
            {isSelectMode
              ? "Select scenes to delete"
              : "Switch between scenes in your project"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Button
              className="rounded-md"
              variant={isSelectMode ? "default" : "outline"}
              size="sm"
              onClick={handleSelectMode}
            >
              <ListCheck />
              {isSelectMode ? "Cancel" : "Select"}
            </Button>
            {isSelectMode && (
              <DeleteDialog
                count={selectedScenes.size}
                onDelete={handleDeleteSelected}
                disabled={isMainSceneSelected}
                trigger={
                  <Button
                    className="rounded-md"
                    variant="destructive"
                    disabled={isMainSceneSelected}
                    size="sm"
                  >
                    <Trash2 />
                    Delete ({selectedScenes.size})
                  </Button>
                }
              />
            )}
          </div>
          {scenes.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No scenes available
            </div>
          ) : (
            <div className="space-y-2">
              {scenes.map((scene) => (
                <Button
                  key={scene.id}
                  variant="outline"
                  className={cn(
                    "w-full justify-between font-normal",
                    currentScene?.id === scene.id &&
                      !isSelectMode &&
                      "border-primary !text-primary",
                    isSelectMode &&
                      selectedScenes.has(scene.id) &&
                      "bg-accent border-foreground/30",
                  )}
                  onClick={() => handleSceneSwitch(scene.id)}
                >
                  <span>{scene.name}</span>
                  <div className="flex items-center gap-2">
                    {((isSelectMode && selectedScenes.has(scene.id)) ||
                      (!isSelectMode && currentScene?.id === scene.id)) && (
                      <Check className="size-4" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DeleteDialog({
  count,
  onDelete,
  disabled,
  trigger,
}: {
  count: number;
  onDelete: () => void;
  disabled?: boolean;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Scenes</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {count} scene
            {count === 1 ? "" : "s"}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={disabled}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
