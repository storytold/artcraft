import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { SEO } from "~/components/seo";
import { CategoryTags } from "~/components/feed/category-tags";
import { MasonryGrid } from "~/components/feed/masonry-grid";
import { GalleryCard } from "~/components/feed/gallery-card";
import {
  generateMockItems,
  SORT_OPTIONS,
  FEED_TABS,
  type FeedTab,
  type GalleryItem,
} from "~/data/mock-gallery";

const PAGE_SIZE = 20;
const INITIAL_ITEMS = generateMockItems(PAGE_SIZE, 0);

export function FeedPage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("featured");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>(SORT_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<GalleryItem[]>(INITIAL_ITEMS);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(() => {
    setItems((prev) => {
      const next = generateMockItems(PAGE_SIZE, prev.length);
      if (next.length < PAGE_SIZE) setHasMore(false);
      return [...prev, ...next];
    });
  }, []);

  // Filter items for display (filtering happens client-side on mock data)
  const filteredItems =
    !activeTag && !searchQuery
      ? items
      : items.filter((item) => {
          const matchesTag = !activeTag || item.tags.includes(activeTag);
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            !q ||
            item.title.toLowerCase().includes(q) ||
            item.creator.toLowerCase().includes(q);
          return matchesTag && matchesSearch;
        });

  return (
    <>
      <SEO description="Community prompt library. Copy, share, and perfect your AI-generated content." />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-10 text-center sm:px-6 sm:pt-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          Explore Prompt Gallery
        </h1>
        <p className="mt-3 text-base sm:text-xl text-muted-foreground">
          Community prompt library. Copy, share, and perfect your AI-generated
          content.
        </p>

        {/* Search */}
        <div className="relative mx-auto mt-10 max-w-lg">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for prompts, model, or inspiration..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-full pl-11 pr-4 text-base"
          />
        </div>
      </section>

      {/* Feed controls + grid */}
      <section className="mx-auto max-w-[1800px] px-4 pb-16 sm:px-6">
        {/* Tabs + Sort row */}
        <div className="flex items-center justify-between gap-4 border-b border-border">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as FeedTab)}
          >
            <TabsList variant="line" className="gap-5">
              {FEED_TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="capitalize text-[15px] px-0 font-semibold"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="hidden items-center gap-2 sm:flex">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto border-none bg-transparent shadow-none focus:outline-none focus:ring-0 hover:opacity-80 transition-all gap-1 px-0 font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category tags */}
        <div className="mt-6">
          <CategoryTags activeTag={activeTag} onTagChange={setActiveTag} />
        </div>

        {/* Masonry grid with infinite scroll */}
        <div className="mt-6">
          <MasonryGrid hasMore={hasMore} onLoadMore={loadMore}>
            {filteredItems.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </MasonryGrid>
        </div>
      </section>
    </>
  );
}
