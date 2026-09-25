import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/layout/AppShell";
import { demoActivity, formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — Splitly" },
      { name: "description", content: "A timeline of every expense and settlement." },
      { property: "og:title", content: "Activity — Splitly" },
      { property: "og:description", content: "A timeline of every expense and settlement." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <AppShell title="Activity" description="Har expense aur settlement ka record">
      <section className="surface-card overflow-hidden">
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
    </AppShell>
  );
}
