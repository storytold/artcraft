import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRightIcon, EllipsisIcon, TagIcon, TagsIcon } from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import {
  compareTagsByUseCount,
  useLibraryTagsStore,
} from "../../pages/library/library-tags-store";
import { EASE_EMPHASIS } from "../../lib/motion";

const MAX_SIDEBAR_TAGS = 5;

/**
 * The "Tags" rows of the Assets sidebar group, rendered below the folders
 * list: a Tags entry plus the user's most-used tags (collapsed by default)
 * while in the library area. Hidden entirely until the user has tags — the
 * tag editor in the media details panel is where tags get created.
 * Right-click opens the library page's tag context menu (same contract as
 * the folder rows). Renders bare menu items; the parent supplies the
 * `SidebarMenu` list.
 */
export function LibraryTagsNav({
  pathname,
  onNavClick,
}: {
  pathname: string;
  onNavClick: () => void;
}) {
  const navigate = useNavigate();
  const tags = useLibraryTagsStore((s) => s.tags);
  const tagsLoaded = useLibraryTagsStore((s) => s.tagsLoaded);
  const setContextMenu = useLibraryTagsStore((s) => s.setContextMenu);

  // Folders are the primary organization tool — tags start collapsed.
  const [expanded, setExpanded] = useState(false);

  const inLibraryArea =
    pathname === "/library" || pathname.startsWith("/library/");

  const topTags = useMemo(
    () => [...tags].sort(compareTagsByUseCount).slice(0, MAX_SIDEBAR_TAGS),
    [tags],
  );

  if (!tagsLoaded || tags.length === 0) return null;

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={pathname === "/library/tags"}
          tooltip="Tags"
        >
          <Link to="/library/tags" onClick={onNavClick}>
            <TagsIcon />
            <span>Tags</span>
          </Link>
        </SidebarMenuButton>
        {inLibraryArea && topTags.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse tags" : "Expand tags"}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors group-data-[collapsible=icon]:hidden"
          >
            <ChevronRightIcon
              
              className={`text-[10px] transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}
      </SidebarMenuItem>

      <AnimatePresence initial={false}>
        {inLibraryArea && expanded && topTags.length > 0 && (
          <motion.li
            key="tag-rows"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_EMPHASIS }}
            className="list-none overflow-hidden group-data-[collapsible=icon]:hidden"
          >
            <ul className="flex w-full min-w-0 flex-col gap-0.5">
              {topTags.map((tag) => (
                <SidebarMenuItem key={tag.token}>
                  <SidebarMenuButton
                    isActive={pathname === `/library/${tag.token}`}
                    tooltip={tag.value}
                    onClick={() => {
                      navigate(`/library/${tag.token}`);
                      onNavClick();
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        tagToken: tag.token,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    className="pl-5"
                  >
                    <TagIcon
                      
                      className="text-violet-400" />
                    <span className="truncate">{tag.value}</span>
                    <span className="ml-auto text-[10px] text-sidebar-foreground/40 transition-opacity group-hover/menu-item:opacity-0">
                      {tag.useCount}
                    </span>
                  </SidebarMenuButton>
                  {/* Hover-revealed rename/delete menu (swaps with the count). */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenu({
                        tagToken: tag.token,
                        x: rect.left,
                        y: rect.bottom + 4,
                      });
                    }}
                    aria-label={`Options for tag "${tag.value}"`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-sidebar-foreground/50 opacity-0 transition-opacity group-hover/menu-item:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <EllipsisIcon  className="text-xs" />
                  </button>
                </SidebarMenuItem>
              ))}
              {tags.length > MAX_SIDEBAR_TAGS && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="See all tags">
                    <Link
                      to="/library/tags"
                      onClick={onNavClick}
                      className="pl-5 text-sidebar-foreground/60"
                    >
                      <EllipsisIcon />
                      <span>See all tags</span>
                      <span className="ml-auto text-[10px] text-sidebar-foreground/40">
                        {tags.length}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </ul>
          </motion.li>
        )}
      </AnimatePresence>
    </>
  );
}
