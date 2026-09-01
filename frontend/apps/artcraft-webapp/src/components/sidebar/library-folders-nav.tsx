import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRightIcon, FolderIcon, FolderOpenIcon, Grid3x3Icon, PlusIcon, StarIcon } from "lucide-react";
import { compareFolders } from "@storyteller/ui-gallery-modal";
import { EASE_EMPHASIS } from "../../lib/motion";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { useLibraryFoldersStore } from "../../pages/library/library-folders-store";
import { LibraryTagsNav } from "./library-tags-nav";

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
  const onFolderless = pathname === "/library/folderless";
  const onTags =
    pathname === "/library/tags" || pathname.startsWith("/library/tag_");
  const onUnsorted =
    !onFolders &&
    !onFolderless &&
    !onTags &&
    (pathname === "/library" || pathname.startsWith("/library/"));
  const inLibraryArea = onUnsorted || onFolders || onFolderless || onTags;

  const folders = useLibraryFoldersStore((s) => s.folders);
  const activeFolderId = useLibraryFoldersStore((s) => s.activeFolderId);
  const openNewFolderModal = useLibraryFoldersStore((s) => s.openNewFolderModal);
  const setContextMenu = useLibraryFoldersStore((s) => s.setContextMenu);

  // Folders are the primary organization tool — default expanded.
  const [expanded, setExpanded] = useState(true);

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
            className="mr-1 flex h-5 w-5 items-center justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
          >
            <PlusIcon  className="text-xs" />
          </button>
        )}
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={onUnsorted} tooltip="Library">
              <Link to="/library" onClick={onNavClick}>
                <Grid3x3Icon />
                <span>Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={onFolderless}
              tooltip="Unfoldered"
            >
              <Link to="/library/folderless" onClick={onNavClick}>
                <FolderOpenIcon />
                <span>Unfoldered</span>
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
                <FolderIcon />
                <span>Folders</span>
              </Link>
            </SidebarMenuButton>
            {inLibraryArea && rootFolders.length > 0 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Collapse folders" : "Expand folders"}
                className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
              >
                <ChevronRightIcon
                  
                  className={`text-[10px] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
              </button>
            )}
          </SidebarMenuItem>

          <AnimatePresence initial={false}>
            {inLibraryArea && expanded && rootFolders.length > 0 && (
              <motion.li
                key="folder-rows"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: EASE_EMPHASIS }}
                className="list-none overflow-hidden group-data-[collapsible=icon]:hidden"
              >
                <ul className="flex w-full min-w-0 flex-col gap-0.5">
                  {rootFolders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
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
                        <FolderIcon
                          
                          className={folder.colorCode ? "" : "text-primary"}
                          style={
                            folder.colorCode
                              ? { color: folder.colorCode }
                              : undefined
                          } />
                        <span className="truncate">{folder.name}</span>
                        {folder.hasStar && (
                          <StarIcon
                            
                            className="ml-auto text-[10px] text-amber-400" />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </ul>
              </motion.li>
            )}
          </AnimatePresence>

          <LibraryTagsNav pathname={pathname} onNavClick={onNavClick} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
