import { cn } from "~/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted before:absolute before:inset-0 before:animate-[shimmer_2s_ease-in-out_infinite] before:bg-linear-to-r before:from-transparent before:via-foreground/15 before:to-transparent",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
