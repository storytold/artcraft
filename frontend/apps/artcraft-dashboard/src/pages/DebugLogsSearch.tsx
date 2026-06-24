import { IconBug } from "@tabler/icons-react";
import { TokenSearchForm } from "@/components/TokenSearchForm";
import { usePageTitle } from "@/hooks/usePageTitle";

export function DebugLogsSearch() {
  usePageTitle("Search Debug Logs");
  return (
    <TokenSearchForm
      title="Search Debug Logs"
      description="Look up every debug log row that shares a given event token. Useful when chasing a single request through the system."
      inputLabel="Debug Event Token"
      placeholder="Paste a debug event token..."
      buttonLabel="Open"
      icon={IconBug}
      buildHref={(token) =>
        `/moderation/debug-logs/${encodeURIComponent(token)}`
      }
    />
  );
}
