import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { demoGroups, formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/groups/")({
  head: () => ({
    meta: [
      { title: "Groups — Splitly" },
      { name: "description", content: "All your shared expense groups and their balances." },
      { property: "og:title", content: "Groups — Splitly" },
      {
        property: "og:description",
        content: "All your shared expense groups and their balances.",
      },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  return (
    <AppShell
      title="Groups"
      description="Trips, flats, teams — sab kuch ek jagah"
      action={
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New group</span>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {demoGroups.map((group) => (
          <article key={group.id} className="surface-card p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-3">
              <span className="bg-brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                <Users className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{group.name}</h2>
                <p className="text-xs text-muted-foreground">{group.members} members</p>
              </div>
            </div>
            <p
              className={`mt-5 text-lg font-semibold ${
                group.balance === 0
                  ? "text-muted-foreground"
                  : group.balance > 0
                    ? "text-success"
                    : "text-destructive"
              }`}
            >
              {group.balance === 0
                ? "All settled up"
                : group.balance > 0
                  ? `You are owed ${formatMoney(group.balance)}`
                  : `You owe ${formatMoney(Math.abs(group.balance))}`}
            </p>
            <Button variant="secondary" size="sm" className="mt-4 w-full">
              Open group
            </Button>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
