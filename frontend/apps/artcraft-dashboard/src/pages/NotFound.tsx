import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export function NotFoundPage() {
  usePageTitle("Not Found");
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <p className="text-8xl font-bold font-outfit tracking-tight text-muted-foreground/30">
        404
      </p>
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild variant="ghost" className="mt-2">
        <Link to="/">
          <IconArrowLeft className="size-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}
