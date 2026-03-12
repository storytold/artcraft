import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "~/components/ui/drawer";
import { useMediaQuery } from "~/hooks/use-media-query";
import { MediaDetail } from "~/components/feed/media-detail";
import type { GalleryItem } from "~/data/mock-gallery";

interface MediaDialogProps {
  item: GalleryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MediaDialog({ item, open, onOpenChange }: MediaDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!item) return null;

  if (isDesktop) {
    return <DesktopDialog item={item} open={open} onOpenChange={onOpenChange} />;
  }

  return <MobileDrawer item={item} open={open} onOpenChange={onOpenChange} />;
}

const PANEL_WIDTH = 400;

function DesktopDialog({ item, open, onOpenChange }: MediaDialogProps & { item: GalleryItem }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {item.title}
          </DialogPrimitive.Title>

          <div className="flex overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-foreground/10">
            {/*
              Media wrapper uses aspect-ratio from the image so it scales up to fill
              the viewport. height: 90dvh makes it as tall as possible, then
              max-width caps the width (and CSS shrinks height to maintain ratio).
              The image inside uses object-cover to fill — no black bars.
            */}
            <div
              className="shrink overflow-hidden"
              style={{
                aspectRatio: item.imageWidth / item.imageHeight,
                height: "90dvh",
                maxWidth: `calc(90dvw - ${PANEL_WIDTH}px)`,
              }}
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Detail side — stretches to match media height */}
            <div
              className="flex shrink-0 flex-col border-l"
              style={{ width: PANEL_WIDTH }}
            >
              <MediaDetail item={item} />
            </div>
          </div>

          {/* Close button */}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute -right-3 -top-3 rounded-full bg-background shadow-md ring-1 ring-foreground/10 hover:bg-muted"
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function MobileDrawer({ item, open, onOpenChange }: MediaDialogProps & { item: GalleryItem }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[95dvh]">
        <DrawerTitle className="sr-only">{item.title}</DrawerTitle>

        {/* Media */}
        <div className="flex items-center justify-center bg-black">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-[40dvh] w-full object-contain"
          />
        </div>

        {/* Detail */}
        <div className="flex-1 overflow-hidden">
          <MediaDetail item={item} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
