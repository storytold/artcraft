import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none resize-none",
        "focus-visible:border-primary transition-colors",
        "placeholder:text-muted-foreground dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
