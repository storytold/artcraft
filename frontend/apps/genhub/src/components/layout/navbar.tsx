import { Link } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuth } from "~/hooks/use-auth";
import { ThemeToggle } from "~/components/layout/theme-toggle";

const NAV_LINKS = [
  { to: "/", label: "Browse" },
  { to: "/create", label: "Create" },
] as const;

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="mx-auto flex h-14 max-w-[1800px] items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="shrink-0"
          >
            <path d="M14 2L26 8v12l-12 6L2 20V8l12-6z" fill="currentColor" />
            <path d="M14 6l8 4v8l-8 4-8-4V10l8-4z" fill="white" />
            <path d="M14 10l4 2v4l-4 2-4-2v-4l4-2z" fill="currentColor" />
          </svg>
          <span className="text-lg font-bold">GenHub</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          {NAV_LINKS.map((link) => (
            <Button key={link.to} variant="ghost" size="sm" asChild>
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}

          <ThemeToggle />

          {loading ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 rounded-full"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">
                      {user.display_name?.[0]?.toUpperCase() ??
                        user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onSelect={logout}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="ml-1">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Button
                key={link.to}
                variant="ghost"
                size="sm"
                asChild
                className="justify-start"
                onClick={() => setMobileOpen(false)}
              >
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
            {!loading && !user && (
              <Button
                size="sm"
                asChild
                className="mt-2"
                onClick={() => setMobileOpen(false)}
              >
                <Link to="/login">Login</Link>
              </Button>
            )}
            {!loading && user && (
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
              >
                <LogOut className="mr-2 size-4" />
                Log out
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
