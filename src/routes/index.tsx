import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Users, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { demoActivity, demoGroups, demoTotals, formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Splitly" },
      {
        name: "description",
        content: "See what you owe, what you are owed, and your latest shared expenses.",
      },
      { property: "og:title", content: "Dashboard — Splitly" },
      {
        property: "og:description",
        content: "See what you owe, what you are owed, and your latest shared expenses.",
      },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "neutral" | "positive" | "negative";
  icon: typeof Wallet;
}) {
  const toneClass =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className={`mt-3 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const net = demoTotals.owed - demoTotals.owe;

  return (
    <AppShell title="Dashboard" description="Aapka overall balance aur recent activity">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total balance"
          value={formatMoney(net)}
          tone={net >= 0 ? "positive" : "negative"}
          icon={Wallet}
        />
        <StatCard
          label="You are owed"
          value={formatMoney(demoTotals.owed)}
          tone="positive"
          icon={ArrowDownLeft}
        />
        <StatCard
          label="You owe"
          value={formatMoney(demoTotals.owe)}
          tone="negative"
          icon={ArrowUpRight}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="surface-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent activity</h2>
            <Link to="/activity" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {demoActivity.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.detail} · {item.when}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    item.amount >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatMoney(item.amount)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Your groups</h2>
            <Link to="/groups" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {demoGroups.slice(0, 4).map((group) => (
              <li key={group.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Users className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.members} members</p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    group.balance === 0
                      ? "text-muted-foreground"
                      : group.balance > 0
                        ? "text-success"
                        : "text-destructive"
                  }`}
                >
                  {group.balance === 0 ? "settled" : formatMoney(group.balance)}
                </span>
              </li>
            ))}
          </ul>
          <div className="p-4">
            <Button variant="secondary" className="w-full gap-1.5">
              <Plus className="size-4" /> Create a group
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
