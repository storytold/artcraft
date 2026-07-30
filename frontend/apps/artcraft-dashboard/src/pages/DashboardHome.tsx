import { useEffect, useState } from "react";
import { IconDashboard } from "@tabler/icons-react";
import { ModerationApi, type DataboxDashboard } from "@/api/ModerationApi";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";

function databoxEmbedUrl(id: string): string {
  return `https://app.databox.com/datawall/${encodeURIComponent(id)}?i`;
}

export function DashboardHome() {
  usePageTitle("Dashboard");
  const [databoards, setDataboards] = useState<DataboxDashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const api = new ModerationApi();
    api.ListDataboxDashboards().then((resp) => {
      if (cancelled) return;
      setDataboards(resp.success && resp.data ? resp.data : []);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconDashboard className="size-6 text-muted-foreground" />
          Artcraft Dashboard Overview
        </h1>
        <p className="text-muted-foreground">Welcome to the admin dashboard.</p>
      </div>

      {isLoading ? (
        <Skeleton className="w-full rounded-xl" style={{ paddingTop: "63%" }} />
      ) : (
        databoards.map((databoard) => (
          <div key={databoard.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{databoard.name}</h2>
            <div
              className="relative w-full overflow-hidden rounded-xl border"
              style={{ paddingTop: "63%" }}
            >
              <iframe
                src={databoxEmbedUrl(databoard.id)}
                title={databoard.name}
                className="absolute inset-0 h-full w-full"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
