import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../utils/ui";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 duration-150",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        background: "bg-background text-foreground hover:bg-background/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        "destructive-foreground":
          "border bg-background hover:bg-destructive/15 text-destructive",
        caution: "text-caution hover:bg-caution/10",
        outline: "border border-border bg-background hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary-border",
        text: "bg-transparent rounded-none opacity-100 hover:opacity-75",
        ghost: "bg-transparent hover:bg-accent",
        link: "text-primary underline-offset-4 hover:underline !p-0 !h-auto",
      },
      size: {
        default: "h-8 px-4 py-2",
        sm: "h-7 p-1 px-2.5 text-sm rounded-lg",
        lg: "h-10 p-5 px-6 rounded-lg",
        icon: "size-7 rounded-lg",
        text: "p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? SlotPrimitive.Slot : "button";
    const effectiveSize = size ?? (variant === "text" ? "text" : "default");
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size: effectiveSize, className }),
        )}
        ref={ref}
        type="button"
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
