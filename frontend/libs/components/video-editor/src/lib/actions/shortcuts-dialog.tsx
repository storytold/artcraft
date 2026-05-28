"use client";

import { useEffect, useState } from "react";
import {
  type KeyboardShortcut,
  useKeyboardShortcutsHelp,
} from "./use-keyboard-shortcuts-help";
import { useKeybindingsStore } from "./keybindings-store";
import { useEditorAdapters } from "../EditorProvider";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function ShortcutsDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [recordingShortcut, setRecordingShortcut] =
    useState<KeyboardShortcut | null>(null);
  const { toast } = useEditorAdapters();

  const {
    updateKeybinding,
    removeKeybinding,
    getKeybindingString,
    validateKeybinding,
    getKeybindingsForAction,
    setIsRecording,
    resetToDefaults,
    isRecording,
  } = useKeybindingsStore();

  const { shortcuts } = useKeyboardShortcutsHelp();

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  useEffect(() => {
    if (!isRecording || !recordingShortcut) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keyString = getKeybindingString(e);
      if (keyString) {
        const conflict = validateKeybinding({
          key: keyString,
          action: recordingShortcut.action,
        });
        if (conflict) {
          toast.error(
            `Key "${keyString}" is already bound to "${conflict.existingAction}"`,
          );
          setRecordingShortcut(null);
          return;
        }

        const oldKeys = getKeybindingsForAction(recordingShortcut.action);
        for (const key of oldKeys) {
          removeKeybinding(key);
        }

        updateKeybinding({
          key: keyString,
          action: recordingShortcut.action,
        });

        setIsRecording(false);
        setRecordingShortcut(null);
      }
    };

    const handleClickOutside = () => {
      setRecordingShortcut(null);
      setIsRecording(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    recordingShortcut,
    getKeybindingString,
    updateKeybinding,
    removeKeybinding,
    validateKeybinding,
    getKeybindingsForAction,
    setIsRecording,
    isRecording,
    toast,
  ]);

  const handleStartRecording = (shortcut: KeyboardShortcut) => {
    setRecordingShortcut(shortcut);
    setIsRecording(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col p-0">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>

        <DialogBody className="scrollbar-thin grow overflow-y-auto">
          <div className="flex flex-col gap-6">
            {categories.map((category) => (
              <div key={category} className="flex flex-col gap-1">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {category}
                </h3>
                <div className="flex flex-col gap-1">
                  {shortcuts
                    .filter((shortcut) => shortcut.category === category)
                    .map((shortcut) => (
                      <ShortcutItem
                        key={shortcut.action}
                        shortcut={shortcut}
                        isRecording={
                          shortcut.action === recordingShortcut?.action
                        }
                        onStartRecording={() => handleStartRecording(shortcut)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="destructive" onClick={resetToDefaults}>
            Reset to default
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutItem({
  shortcut,
  isRecording,
  onStartRecording,
}: {
  shortcut: KeyboardShortcut;
  isRecording: boolean;
  onStartRecording: (params: { shortcut: KeyboardShortcut }) => void;
}) {
  const displayKeys = shortcut.keys.filter((key: string) => {
    if (
      key.includes("Cmd") &&
      shortcut.keys.includes(key.replace("Cmd", "Ctrl"))
    )
      return false;

    return true;
  });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {shortcut.icon && (
          <div className="text-muted-foreground">{shortcut.icon}</div>
        )}
        <span className="text-sm">{shortcut.description}</span>
      </div>
      <div className="flex items-center gap-2">
        {displayKeys.map((key: string, index: number) => (
          <div key={key} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {key.split("+").map((keyPart: string, partIndex: number) => {
                const keyId = `${shortcut.id}-${index}-${partIndex}`;
                return (
                  <EditableShortcutKey
                    key={keyId}
                    isRecording={isRecording}
                    onStartRecording={() => onStartRecording({ shortcut })}
                  >
                    {keyPart}
                  </EditableShortcutKey>
                );
              })}
            </div>
            {index < displayKeys.length - 1 && (
              <span className="text-muted-foreground text-xs">or</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableShortcutKey({
  children,
  isRecording,
  onStartRecording,
}: {
  children: React.ReactNode;
  isRecording: boolean;
  onStartRecording: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartRecording();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      title={
        isRecording ? "Press any key combination..." : "Click to edit shortcut"
      }
    >
      {children}
    </Button>
  );
}
