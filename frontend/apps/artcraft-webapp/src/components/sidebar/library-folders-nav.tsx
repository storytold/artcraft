import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBorderAll,
  faFolder,
  faPlus,
  faStar,
} from "@fortawesome/pro-solid-svg-icons";
import { compareFolders } from "@storyteller/ui-gallery-modal";
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
 * The "Library" sidebar section: Unsorted + Folders entries, plus the user's
 * root folders while in the library area. Folder rows carry `data-folder-id`
 * (drag-drop target) and right-click opens the page's folder context menu.
 */
export function LibraryFoldersNav({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick: () => void;
}) {
  const navigate = useNavigate();
  const onFolders =
    pathname === "/library/folders" ||
    pathname.startsWith("/library/folder_");
  const onUnsorted =
    !onFolders &&
    (pathname === "/library" || pathname.startsWith("/library/"));
  const inLibraryArea = onUnsorted || onFolders;

  const folders = useLibraryFoldersStore((s) => s.folders);
  const activeFolderId = useLibraryFoldersStore((s) => s.activeFolderId);
  const openNewFolderModal = useLibraryFoldersStore((s) => s.openNewFolderModal);
  const setContextMenu = useLibraryFoldersStore((s) => s.setContextMenu);

  const rootFolders = useMemo(
    () => folders.filter((f) => !f.parentId).sort(compareFolders),
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

  const goToFolder = (id: string) => {
    navigate(`/library/${id}`);
    onNavClick();
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>Assets</SidebarGroupLabel>
        {inLibraryArea && (
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
            <SidebarMenuButton asChild isActive={onUnsorted} tooltip="Library">
              <Link to="/library" onClick={onNavClick}>
                <FontAwesomeIcon icon={faBorderAll} />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={onFolders && !activeFolderId}
              tooltip="Folders"
            >
              <Link to="/library/folders" onClick={onNavClick}>
                <FontAwesomeIcon icon={faFolder} />
                <span>Folders</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {inLibraryArea &&
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
                  className="pl-5 [&.folder-drag-over]:bg-primary/20 [&.folder-drag-over]:text-sidebar-foreground"
                >
                  <FontAwesomeIcon
                    icon={faFolder}
                    className={folder.colorCode ? "" : "text-primary"}
                    style={
                      folder.colorCode ? { color: folder.colorCode } : undefined
                    }
                  />
                  <span className="truncate">{folder.name}</span>
                  {folder.hasStar && (
                    <FontAwesomeIcon
                      icon={faStar}
                      className="ml-auto text-[10px] text-amber-400"
                    />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
