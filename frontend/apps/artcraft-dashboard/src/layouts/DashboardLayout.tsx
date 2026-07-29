import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Crumb {
  label: string;
  href?: string;
}

function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  if (pathname === "/stripe-lookup") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Stripe Lookup" },
    ];
  }

  if (pathname === "/user/search") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Search" },
    ];
  }

  if (pathname === "/user-signups") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Signups" },
    ];
  }

  if (pathname === "/subscriber-signups") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Subscriber Signups" },
    ];
  }

  if (pathname === "/feature-flags") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Feature Flags" },
    ];
  }

  if (pathname === "/referrals") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Referrals" },
    ];
  }

  if (pathname === "/moderation/job-search") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Search Job by Token" },
    ];
  }

  const jobInfoMatch = pathname.match(/^\/moderation\/job\/(.+)$/);
  if (jobInfoMatch) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Search Job by Token", href: "/moderation/job-search" },
      { label: "Job" },
    ];
  }

  if (pathname === "/moderation/debug-logs-search") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Search Debug Logs" },
    ];
  }

  const debugLogsMatch = pathname.match(/^\/moderation\/debug-logs\/(.+)$/);
  if (debugLogsMatch) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Search Debug Logs", href: "/moderation/debug-logs-search" },
      { label: "Debug Logs" },
    ];
  }

  const mediaMatch = pathname.match(/^\/explore\/media\/(.+)$/);
  if (mediaMatch) {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Explore Media", href: "/explore/media" },
      { label: `Media` },
    ];
  }

  if (pathname === "/explore/media") {
    return [
      { label: "Dashboard", href: "/" },
      { label: "Explore Media" },
    ];
  }

  const jobsMatch = pathname.match(/^\/user\/profile\/([^/]+)\/jobs$/);
  if (jobsMatch) {
    const username = decodeURIComponent(jobsMatch[1]);
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Search", href: "/user/search" },
      { label: `@${username}`, href: `/user/profile/${username}` },
      { label: "Jobs" },
    ];
  }

  const walletMatch = pathname.match(/^\/user\/profile\/([^/]+)\/wallet$/);
  if (walletMatch) {
    const username = decodeURIComponent(walletMatch[1]);
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Search", href: "/user/search" },
      { label: `@${username}`, href: `/user/profile/${username}` },
      { label: "Wallet" },
    ];
  }

  const referralsMatch = pathname.match(/^\/user\/profile\/([^/]+)\/referrals$/);
  if (referralsMatch) {
    const username = decodeURIComponent(referralsMatch[1]);
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Search", href: "/user/search" },
      { label: `@${username}`, href: `/user/profile/${username}` },
      { label: "Referrals" },
    ];
  }

  const profileMatch = pathname.match(/^\/user\/profile\/(.+)$/);
  if (profileMatch) {
    const username = decodeURIComponent(profileMatch[1]);
    return [
      { label: "Dashboard", href: "/" },
      { label: "User Search", href: "/user/search" },
      { label: `@${username}` },
    ];
  }

  return [{ label: "Dashboard", href: "/" }];
}

export function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const crumbs = useBreadcrumbs();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((crumb, i) => (
                <BreadcrumbItem key={i}>
                  {i > 0 && <BreadcrumbSeparator />}
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
