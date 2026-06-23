import { IconBriefcase } from "@tabler/icons-react";
import { TokenSearchForm } from "@/components/TokenSearchForm";
import { usePageTitle } from "@/hooks/usePageTitle";

export function JobTokenSearch() {
  usePageTitle("Search Job by Token");
  return (
    <TokenSearchForm
      title="Search Job by Token"
      description="Look up a single inference job by its token to see its full state and any debug logs."
      inputLabel="Job Token"
      placeholder="Paste a job token..."
      buttonLabel="Open"
      icon={IconBriefcase}
      buildHref={(token) => `/moderation/job/${encodeURIComponent(token)}`}
    />
  );
}
