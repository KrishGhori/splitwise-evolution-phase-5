import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createGroup, listGroups } from "@/lib/groups";
import { listFriends } from "@/lib/friends";
import { formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/groups/")({
  head: () => ({
    meta: [
      { title: "Groups — Splitly" },
      { name: "description", content: "All your shared expense groups and their balances." },
      { property: "og:title", content: "Groups — Splitly" },
      { property: "og:description", content: "All your shared expense groups and their balances." },
    ],
  }),
  component: GroupsPage,
});

export function BalanceText({ value, className = "" }: { value: number; className?: string }) {
  if (Math.abs(value) < 0.01)
    return <span className={`text-muted-foreground ${className}`}>All settled up</span>;
  return value > 0 ? (
    <span className={`text-success ${className}`}>You are owed {formatMoney(value)}</span>
  ) : (
    <span className={`text-destructive ${className}`}>You owe {formatMoney(Math.abs(value))}</span>
  );
}

function GroupsPage() {
  const groups = useQuery({ queryKey: ["groups"], queryFn: listGroups });
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      title="Groups"
      description="Trips, flats, teams — sab kuch ek jagah"
      action={
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">New group</span>
        </Button>
      }
    >
      {groups.error ? (
        <p className="surface-card p-6 text-sm text-destructive">{groups.error.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)
          : null}
        {groups.data?.map((group) => (
          <article key={group.group_name} className="surface-card p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-center gap-3">
              <span className="bg-brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground">
                <Users className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{group.group_name}</h2>
                <p className="text-xs text-muted-foreground">{group.member} members</p>
              </div>
            </div>
            {group.group_description ? (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{group.group_description}</p>
            ) : null}
            <p className="mt-4 text-lg font-semibold">
              <BalanceText value={group.your_balance} />
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
              <Link to="/groups/$groupName" params={{ groupName: group.group_name }}>
                Open group
              </Link>
            </Button>
          </article>
        ))}
      </div>

      {groups.data?.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 p-10 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">No groups yet</p>
          <p className="text-sm text-muted-foreground">Create a group to start splitting with friends.</p>
          <Button onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="size-4" /> Create group
          </Button>
        </div>
      ) : null}

      <CreateGroupDialog open={open} onOpenChange={setOpen} />
    </AppShell>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const friends = useQuery({ queryKey: ["friends"], queryFn: listFriends, enabled: open });
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  const create = useMutation({
    mutationFn: () => createGroup({ group_name: name.trim(), group_description: desc.trim(), groupmember: members }),
    onSuccess: () => {
      toast.success(`Group "${name.trim()}" created.`);
      qc.invalidateQueries({ queryKey: ["groups"] });
      setName("");
      setDesc("");
      setMembers([]);
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = (u: string) =>
    setMembers((m) => (m.includes(u) ? m.filter((x) => x !== u) : [...m, u]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>Only your accepted friends can be added.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="gname">Group name</Label>
            <Input id="gname" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gdesc">Description (optional)</Label>
            <Textarea id="gdesc" value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Members</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {friends.isLoading ? <Skeleton className="h-8" /> : null}
              {friends.data?.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">Add friends first to invite them.</p>
              ) : null}
              {friends.data?.map((f) => (
                <label key={f.username} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent">
                  <Checkbox checked={members.includes(f.username)} onCheckedChange={() => toggle(f.username)} />
                  <span className="text-sm">@{f.username}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || create.isPending}>
              {create.isPending ? "Creating…" : "Create group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
