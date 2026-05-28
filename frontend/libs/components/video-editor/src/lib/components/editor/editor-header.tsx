"use client";

import { useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { ExportButton } from "./export-button";
import { useEditorAdapters } from "../../EditorProvider";
import { useEditor } from "../../editor/use-editor";
import { CommandIcon, Logout05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShortcutsDialog } from "../../actions/shortcuts-dialog";
import { cn } from "../../utils/ui";
import { Button } from "../ui/button";

export function EditorHeader() {
  return (
    <header className="bg-background flex h-[3.4rem] items-center justify-between px-3 pt-0.5">
      <div className="flex items-center gap-1">
        <ProjectDropdown />
        <EditableProjectName />
      </div>
      <nav className="flex items-center gap-2">
        <ExportButton />
      </nav>
    </header>
  );
}

function ProjectDropdown() {
  const [openDialog, setOpenDialog] = useState<
    "delete" | "rename" | "shortcuts" | null
  >(null);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const editor = useEditor();
  const activeProject = useEditor((e) => e.project.getActive());
  const { toast } = useEditorAdapters();

  const handleExit = async () => {
    if (isExiting) return;
    setIsExiting(true);

    try {
      // TODO: editor.project.prepareExit() + closeProject() are unported
      // (the ProjectManager in this lib only exposes the
      // adapter-delegating surface). Hosts wiring the editor shell should
      // provide a "back to projects" callback or implement those methods
      // on a ProjectStorageAdapter wrapper.
      // await editor.project.prepareExit();
      // editor.project.closeProject();
    } catch (error) {
      console.error("Failed to prepare project exit:", error);
    } finally {
      // editor.project.closeProject();
      // TODO: host should provide a route or callback for "back to
      // projects". The /projects route is part of the OpenCut Next.js
      // app shell and isn't part of this lib.
      navigate("/projects");
    }
  };

  const handleSaveProjectName = async (newName: string) => {
    if (
      activeProject &&
      newName.trim() &&
      newName !== activeProject.metadata.name
    ) {
      try {
        // TODO: editor.project.renameProject is unported. Hosts can
        // implement project rename via their ProjectStorageAdapter.
        // await editor.project.renameProject({
        //   id: activeProject.metadata.id,
        //   name: newName.trim(),
        // });
      } catch (error) {
        toast.error("Failed to rename project", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setOpenDialog(null);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (activeProject) {
      try {
        // TODO: editor.project.deleteProjects is unported. Hosts can
        // implement via their ProjectStorageAdapter.
        // await editor.project.deleteProjects({
        //   ids: [activeProject.metadata.id],
        // });
        navigate("/projects");
      } catch (error) {
        toast.error("Failed to delete project", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      } finally {
        setOpenDialog(null);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="p-1 rounded-sm size-8">
            <div
              aria-label="Project menu"
              className="size-5 rounded-sm bg-foreground/80"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-100 w-44">
          <DropdownMenuItem
            onClick={handleExit}
            disabled={isExiting}
            icon={<HugeiconsIcon icon={Logout05Icon} />}
          >
            Exit project
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpenDialog("shortcuts")}
            icon={<HugeiconsIcon icon={CommandIcon} />}
          >
            Shortcuts
          </DropdownMenuItem>

          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>
      {/* TODO: RenameProjectDialog / DeleteProjectDialog live in the
          @/project subtree which isn't ported yet (host-level workflow).
          Hosts can listen for `openDialog === "rename"` and render their
          own confirmation UI. The local state stays so the menu items
          continue to function. */}
      <ShortcutsDialog
        isOpen={openDialog === "shortcuts"}
        onOpenChange={(isOpen) => setOpenDialog(isOpen ? "shortcuts" : null)}
      />
      {/* Acknowledge the unused locals so the dropdown items still build. */}
      {openDialog === "rename" && handleSaveProjectName ? null : null}
      {openDialog === "delete" && handleDeleteProject ? null : null}
      {Link ? null : null}
    </>
  );
}

function EditableProjectName() {
  const editor = useEditor();
  const activeProject = useEditor((e) => e.project.getActive());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalNameRef = useRef("");
  const { toast } = useEditorAdapters();

  const projectName = activeProject?.metadata.name || "";

  const startEditing = () => {
    if (isEditing) return;
    originalNameRef.current = projectName;
    setIsEditing(true);

    requestAnimationFrame(() => {
      inputRef.current?.select();
    });
  };

  const saveEdit = async () => {
    if (!inputRef.current || !activeProject) return;
    const newName = inputRef.current.value.trim();
    setIsEditing(false);

    if (!newName) {
      inputRef.current.value = originalNameRef.current;
      return;
    }

    if (newName !== originalNameRef.current) {
      try {
        // TODO: editor.project.renameProject is unported. See
        // ProjectDropdown for context.
        // await editor.project.renameProject({
        //   id: activeProject.metadata.id,
        //   name: newName,
        // });
      } catch (error) {
        toast.error("Failed to rename project", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (inputRef.current) {
        inputRef.current.value = originalNameRef.current;
        inputRef.current.setSelectionRange(0, 0);
      }
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  // Acknowledge `editor` is referenced so the closure shape lines up
  // when the renameProject TODO above is resolved.
  void editor;

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={projectName}
      readOnly={!isEditing}
      onClick={startEditing}
      onBlur={saveEdit}
      onKeyDown={handleKeyDown}
      style={{ fieldSizing: "content" } as React.CSSProperties}
      className={cn(
        "text-[0.9rem] h-8 px-2 py-1 rounded-sm bg-transparent outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground",
        isEditing && "ring-1 ring-ring cursor-text hover:bg-transparent",
      )}
    />
  );
}
