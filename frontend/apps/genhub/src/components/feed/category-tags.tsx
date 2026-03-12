import { cn } from "~/lib/utils";
import { CATEGORIES } from "~/data/mock-gallery";

interface CategoryTagsProps {
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function CategoryTags({ activeTag, onTagChange }: CategoryTagsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {CATEGORIES.map((tag) => {
        const isActive = activeTag === tag;
        return (
          <button
            key={tag}
            onClick={() => onTagChange(isActive ? null : tag)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors cursor-pointer",
              isActive
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-foreground/4 text-foreground hover:bg-foreground/8 dark:bg-foreground/6 dark:hover:bg-foreground/12",
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
