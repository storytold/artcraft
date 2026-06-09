import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGrid2, faFolder, faPlus } from "@fortawesome/pro-solid-svg-icons";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { useLibraryFoldersStore } from "../../pages/library/library-folders-store";

/**
 * The "Library" sidebar section. The root entry is always shown; the user's
 * folders appear (and are navigable) only while on a /library route. Folder
 * rows carry `data-folder-id` so gallery tiles can be dragged onto them, and
 * right-click opens the shared folder context menu rendered by the page.
 */
export function LibraryFoldersNav({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick: () => void;
}) {
  const navigate = useNavigate();
  const isLibrary =
    pathname === "/library" || pathname.startsWith("/library/");

  const folders = useLibraryFoldersStore((s) => s.folders);
  const activeFolderId = useLibraryFoldersStore((s) => s.activeFolderId);
  const setActiveFolder = useLibraryFoldersStore((s) => s.setActiveFolder);
  const openNewFolderModal = useLibraryFoldersStore((s) => s.openNewFolderModal);
  const setContextMenu = useLibraryFoldersStore((s) => s.setContextMenu);

  const rootFolders = useMemo(
    () => folders.filter((f) => !f.parentId),
    [folders],
  );

  // Highlight whichever root branch the active folder lives in.
  const activeRootId = useMemo(() => {
    if (!activeFolderId) return null;
    const byId = new Map(folders.map((f) => [f.id, f]));
    const seen = new Set<string>();
    let cursor = byId.get(activeFolderId);
    while (cursor && cursor.parentId && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      cursor = byId.get(cursor.parentId);
    }
    return cursor?.id ?? null;
  }, [folders, activeFolderId]);

  const goToFolder = (id: string | null) => {
    setActiveFolder(id);
    if (!isLibrary) navigate("/library");
    onNavClick();
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Library</SidebarGroupLabel>
        {isLibrary && (
          <button
            type="button"
            onClick={() => openNewFolderModal(null)}
            aria-label="New folder"
            className="mr-1 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
          </button>
        )}
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isLibrary && !activeFolderId}
              tooltip="Library"
            >
              <Link to="/library" onClick={() => goToFolder(null)}>
                <FontAwesomeIcon icon={faGrid2} />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isLibrary &&
            rootFolders.map((folder) => (
              <SidebarMenuItem
                key={folder.id}
                className="group-data-[collapsible=icon]:hidden"
              >
                <SidebarMenuButton
                  isActive={activeRootId === folder.id}
                  tooltip={folder.name}
                  data-folder-id={folder.id}
                  onClick={() => goToFolder(folder.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      folderId: folder.id,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className="[&.folder-drag-over]:bg-primary/20 [&.folder-drag-over]:text-sidebar-foreground"
                >
                  <FontAwesomeIcon icon={faFolder} className="text-primary" />
                  <span>{folder.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
