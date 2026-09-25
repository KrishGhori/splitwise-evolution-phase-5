import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Crown, LogOut, Pencil, Trash2, UserMinus, UserPlus, Users } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addMembers, deleteGroup, getGroupBalances, getGroupDetails, leaveGroup, updateGroup,
  type GroupDetails,
} from "@/lib/groups";
import { listFriends } from "@/lib/friends";
import { getProfile } from "@/lib/profile";
import { formatMoney } from "@/lib/demo-data";

export const Route = createFileRoute("/groups/$groupName")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.groupName} — Groups — Splitly` },
      { name: "description", content: `Members, expenses and balances for ${params.groupName}.` },
      { property: "og:title", content: `${params.groupName} — Splitly` },
      { property: "og:description", content: `Members, expenses and balances for ${params.groupName}.` },
    ],
  }),
  component: GroupDetailPage,
});

type Confirm = { kind: "leave" } | { kind: "delete" } | { kind: "remove"; member: string } | null;

function GroupDetailPage() {
  const { groupName } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const details = useQuery({ queryKey: ["group", groupName], queryFn: () => getGroupDetails(groupName) });
  const balances = useQuery({ queryKey: ["group-balances", groupName], queryFn: () => getGroupBalances(groupName) });
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const me = profile.data?.username ?? "";
  const isAdmin = !!details.data?.admins?.includes(me);

  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["group", groupName] });
    qc.invalidateQueries({ queryKey: ["group-balances", groupName] });
    qc.invalidateQueries({ queryKey: ["groups"] });
  };

  const act = useMutation({
    mutationFn: async (c: NonNullable<Confirm>) => {
      if (c.kind === "delete") await deleteGroup(groupName);
      else if (c.kind === "leave") await leaveGroup(groupName);
      else await leaveGroup(groupName, c.member);
      return c;
    },
    onSuccess: (c) => {
      if (c.kind === "remove") {
        toast.success(`@${c.member} removed from the group.`);
        refresh();
      } else {
        toast.success(c.kind === "delete" ? "Group deleted." : `You left ${groupName}.`);
        qc.invalidateQueries({ queryKey: ["groups"] });
        navigate({ to: "/groups" });
      }
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setConfirm(null),
  });

  const d = details.data;

  return (
    <AppShell
      title={groupName}
      description={d?.group_description ?? "Group details"}
      action={
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)} disabled={!d}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Add member</span>
        </Button>
      }
    >
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All groups
      </Link>

      {details.error ? (
        <div className="surface-card p-6">
          <p className="text-sm text-destructive">{details.error.message}</p>
        </div>
      ) : null}

      {details.isLoading ? <Skeleton className="h-28 rounded-xl" /> : null}

      {d ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <Stat label="Total spend" value={formatMoney(d.total_spend)} />
            <Stat label="Expenses" value={String(d.total_expenses)} />
            <Stat
              label="Your balance"
              value={
                balances.data
                  ? (balances.data[me] ?? 0) === 0
                    ? "Settled"
                    : formatMoney(balances.data[me] ?? 0)
                  : "—"
              }
              tone={(balances.data?.[me] ?? 0) > 0 ? "text-success" : (balances.data?.[me] ?? 0) < 0 ? "text-destructive" : ""}
            />
          </section>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit group
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfirm({ kind: "leave" })}>
              <LogOut className="size-4" /> Leave group
            </Button>
            {isAdmin ? (
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setConfirm({ kind: "delete" })}>
                <Trash2 className="size-4" /> Delete group
              </Button>
            ) : null}
          </div>

          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members ({d.total_members})</TabsTrigger>
              <TabsTrigger value="expenses">Expenses ({d.total_expenses})</TabsTrigger>
              <TabsTrigger value="balances">Balances</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <ul className="surface-card divide-y divide-border overflow-hidden">
                {d.members.map((m) => (
                  <li key={m} className="flex items-center gap-3 px-5 py-3">
                    <Initials name={m} />
                    <p className="flex-1 text-sm font-medium">
                      @{m} {m === me ? <span className="text-muted-foreground">(you)</span> : null}
                    </p>
                    {d.admins?.includes(m) ? (
                      <Badge variant="secondary" className="gap-1"><Crown className="size-3" /> Admin</Badge>
                    ) : null}
                    {isAdmin && m !== me ? (
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Remove ${m}`} onClick={() => setConfirm({ kind: "remove", member: m })}>
                        <UserMinus className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="expenses" className="mt-4">
              <div className="surface-card overflow-hidden">
                {d.expenses.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No expenses yet. Adding expenses comes in the next phase.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {d.expenses.map((e) => (
                      <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{e.description || "Expense"}</p>
                          <p className="text-xs text-muted-foreground">
                            Paid by @{e.paid_by_name} · split {e.split_method} · {formatDate(e.date)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold">{formatMoney(e.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="balances" className="mt-4">
              <div className="surface-card overflow-hidden">
                {balances.isLoading ? <Skeleton className="m-4 h-10" /> : null}
                {balances.error ? <p className="p-6 text-sm text-destructive">{balances.error.message}</p> : null}
                <ul className="divide-y divide-border">
                  {Object.entries(balances.data ?? {}).map(([u, b]) => (
                    <li key={u} className="flex items-center gap-3 px-5 py-3">
                      <Initials name={u} />
                      <p className="flex-1 text-sm font-medium">@{u}</p>
                      <span className={`text-sm font-semibold ${Math.abs(b) < 0.01 ? "text-muted-foreground" : b > 0 ? "text-success" : "text-destructive"}`}>
                        {Math.abs(b) < 0.01 ? "Settled" : b > 0 ? `gets back ${formatMoney(b)}` : `owes ${formatMoney(Math.abs(b))}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <EditGroupDialog open={editOpen} onOpenChange={setEditOpen} group={d} />
          <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} group={d} onDone={refresh} />
        </>
      ) : null}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "delete" ? `Delete ${groupName}?` : confirm?.kind === "leave" ? `Leave ${groupName}?` : `Remove @${confirm?.kind === "remove" ? confirm.member : ""}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "delete"
                ? "This removes the group for everyone. All balances must be settled first."
                : "This only works once the balance in this group is settled."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={act.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm) act.mutate(confirm);
              }}
            >
              {confirm?.kind === "delete" ? "Delete" : confirm?.kind === "leave" ? "Leave" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Initials({ name }: { name: string }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
      {name.slice(0, 2)}
    </span>
  );
}

function formatDate(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function EditGroupDialog({ open, onOpenChange, group }: { open: boolean; onOpenChange: (o: boolean) => void; group: GroupDetails }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState(group.group_name);
  const [desc, setDesc] = useState(group.group_description ?? "");

  const save = useMutation({
    mutationFn: () =>
      updateGroup({
        group_name: group.group_name,
        new_group_name: name.trim() !== group.group_name ? name.trim() : undefined,
        group_description: desc.trim() !== (group.group_description ?? "") ? desc.trim() : undefined,
      }),
    onSuccess: () => {
      toast.success("Group updated.");
      qc.invalidateQueries({ queryKey: ["groups"] });
      onOpenChange(false);
      if (name.trim() !== group.group_name) navigate({ to: "/groups/$groupName", params: { groupName: name.trim() } });
      else qc.invalidateQueries({ queryKey: ["group", group.group_name] });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) { setName(group.group_name); setDesc(group.group_description ?? ""); } onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit group</DialogTitle>
          <DialogDescription>Change the name or description.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim()) save.mutate(); }}>
          <div className="space-y-2">
            <Label htmlFor="ename">Group name</Label>
            <Input id="ename" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edesc">Description</Label>
            <Textarea id="edesc" value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={save.isPending || !name.trim()}>{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ open, onOpenChange, group, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; group: GroupDetails; onDone: () => void }) {
  const friends = useQuery({ queryKey: ["friends"], queryFn: listFriends, enabled: open });
  const [picked, setPicked] = useState<string[]>([]);
  const available = (friends.data ?? []).filter((f) => !group.members.includes(f.username));

  const add = useMutation({
    mutationFn: () => addMembers(group.group_name, picked),
    onSuccess: () => {
      toast.success(`Added ${picked.map((p) => "@" + p).join(", ")}.`);
      setPicked([]);
      onDone();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add members</DialogTitle>
          <DialogDescription>Pick friends who aren't in {group.group_name} yet.</DialogDescription>
        </DialogHeader>
        <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {friends.isLoading ? <Skeleton className="h-8" /> : null}
          {friends.data && available.length === 0 ? (
            <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground"><Users className="size-4" /> All your friends are already in this group.</p>
          ) : null}
          {available.map((f) => (
            <label key={f.username} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent">
              <Checkbox
                checked={picked.includes(f.username)}
                onCheckedChange={() => setPicked((p) => (p.includes(f.username) ? p.filter((x) => x !== f.username) : [...p, f.username]))}
              />
              <span className="text-sm">@{f.username}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!picked.length || add.isPending} onClick={() => add.mutate()}>
            {add.isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
