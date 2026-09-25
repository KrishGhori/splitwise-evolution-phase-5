import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserRound,
  Activity,
  Settings,
  Plus,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_MODE } from "@/lib/config";
import { demoUser } from "@/lib/demo-data";
import { getToken } from "@/lib/api-client";
import { logout } from "@/lib/auth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/friends", label: "Friends", icon: UserRound },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/profile", label: "Profile", icon: Settings },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2 py-1">
        <span className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl text-base font-bold text-primary-foreground">
          S
        </span>
        <span className="text-lg font-semibold tracking-tight">Splitly</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-none",
            }}
          >
            <Icon className="size-4.5" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="rounded-xl border border-sidebar-border bg-card p-3">
        <p className="text-sm font-medium">{demoUser.name}</p>
        <p className="truncate text-xs text-muted-foreground">{demoUser.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 px-2"
          onClick={async () => {
            await logout();
            navigate({ to: "/auth" });
          }}
        >
          <LogOut className="size-4" /> Logout
        </Button>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/auth" });
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
            {description ? (
              <p className="truncate text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          {DEMO_MODE ? (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Demo data
            </Badge>
          ) : null}

          {action ?? (
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add expense</span>
            </Button>
          )}
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
