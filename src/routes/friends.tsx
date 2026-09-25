import { createFileRoute } from "@tanstack/react-router";
import { Search, UserPlus } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoFriends, formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends — Splitly" },
      { name: "description", content: "Your friends and what each of you owes the other." },
      { property: "og:title", content: "Friends — Splitly" },
      {
        property: "og:description",
        content: "Your friends and what each of you owes the other.",
      },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  return (
    <AppShell
      title="Friends"
      description="Dosto ke saath hisaab"
      action={
        <Button size="sm" className="gap-1.5">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Add friend</span>
        </Button>
      }
    >
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search friends by name or email" className="pl-9" />
      </div>

      <section className="surface-card overflow-hidden">
        <ul className="divide-y divide-border">
          {demoFriends.map((friend) => (
            <li key={friend.id} className="flex items-center gap-4 px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                {friend.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{friend.name}</p>
                <p className="truncate text-xs text-muted-foreground">{friend.email}</p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  friend.balance === 0
                    ? "text-muted-foreground"
                    : friend.balance > 0
                      ? "text-success"
                      : "text-destructive"
                }`}
              >
                {friend.balance === 0 ? "settled" : formatMoney(friend.balance)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
