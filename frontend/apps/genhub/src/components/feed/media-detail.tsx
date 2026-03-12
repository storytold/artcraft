import { useState } from "react";
import {
  Heart,
  Bookmark,
  Send,
  Copy,
  Check,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import type { GalleryItem } from "~/data/mock-gallery";

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface MediaDetailProps {
  item: GalleryItem;
}

export function MediaDetail({ item }: MediaDetailProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comment, setComment] = useState("");

  const likeCount = liked ? item.likes + 1 : item.likes;

  function handleCopy() {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky header — author */}
      <div className="flex shrink-0 items-center gap-3 border-b px-5 py-3">
        <Avatar>
          <AvatarFallback className="text-xs font-medium">
            {item.creator[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.creator}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(item.createdAt)}
          </p>
        </div>
      </div>

      {/* Scrollable middle — title, prompt, model, comments */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* Title */}
        <h2 className="text-base font-bold">{item.title}</h2>

        {/* Prompt */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Prompt
            </span>
            <Button
              variant="outline"
              size="xs"
              className="h-7 gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="relative mt-2 rounded-lg bg-muted px-3 py-2.5">
            <p
              className={`text-sm leading-relaxed whitespace-pre-wrap ${
                promptExpanded ? "" : "line-clamp-4"
              }`}
            >
              {item.prompt}
            </p>
            {item.prompt.length > 150 && (
              <button
                onClick={() => setPromptExpanded((p) => !p)}
                className="mt-1 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {promptExpanded ? "Show less" : "See all"}
                <ChevronDown
                  className={`size-3.5 transition-transform ${promptExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Model */}
        <div className="mt-4">
          <span className="text-sm font-medium text-muted-foreground">
            Model
          </span>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
            <BarChart3 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{item.model}</span>
          </div>
        </div>

        {/* Comments */}
        {item.comments.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              {item.comments.map((c, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Avatar className="size-6 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {c.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{c.username}</span>{" "}
                      {c.text}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatRelativeDate(c.date)}</span>
                      {c.likes > 0 && <span>{c.likes} likes</span>}
                    </div>
                  </div>
                  <button className="shrink-0 pt-0.5 text-muted-foreground transition-colors hover:text-foreground">
                    <Heart className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom — likes, save, comment */}
      <div className="shrink-0 border-t px-5 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setLiked((l) => !l)}
            className="flex items-center gap-1.5 transition-colors"
          >
            <Heart
              className={`size-5 ${liked ? "fill-red-500 text-red-500" : "text-foreground"}`}
            />
            <span className="text-sm font-semibold">{likeCount} likes</span>
          </button>
          <button
            onClick={() => setSaved((s) => !s)}
            className="transition-colors"
          >
            <Bookmark
              className={`size-5 ${saved ? "fill-foreground text-foreground" : "text-foreground"}`}
            />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Input
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-9 flex-1 text-sm"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={!comment.trim()}
            className="shrink-0"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
