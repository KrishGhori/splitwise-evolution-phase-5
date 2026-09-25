import { DEMO_MODE } from "./config";
import { ApiError, api } from "./api-client";
import { DEMO_ME, areFriends, groupBalances, readDB, wait, writeDB } from "./demo-store";

export type GroupSummary = {
  group_name: string;
  group_description: string | null;
  groupmember: string[];
  member: number;
  your_balance: number;
};

export type GroupExpense = {
  id: number;
  amount: number;
  paid_by_name: string;
  split_method: string;
  description: string;
  date: string;
};

export type GroupDetails = {
  group_name: string;
  group_description: string | null;
  members: string[];
  admins: string[];
  total_members: number;
  total_spend: number;
  total_expenses: number;
  expenses: GroupExpense[];
};

const enc = encodeURIComponent;

function demoGroup(name: string) {
  const db = readDB();
  const g = db.groups.find((x) => x.group_name === name);
  if (!g) throw new ApiError("Group not found", 404);
  return { db, g };
}

export async function listGroups(): Promise<GroupSummary[]> {
  if (DEMO_MODE) {
    await wait();
    return readDB()
      .groups.filter((g) => g.groupmember.includes(DEMO_ME))
      .map((g) => ({
        group_name: g.group_name,
        group_description: g.group_description,
        groupmember: g.groupmember,
        member: g.groupmember.length,
        your_balance: groupBalances(g)[DEMO_ME] ?? 0,
      }));
  }
  const res = await api.get<Record<string, GroupSummary>>("/get_groups/");
  return Object.values(res ?? {});
}

export async function createGroup(input: {
  group_name: string;
  group_description?: string;
  groupmember: string[];
}) {
  if (DEMO_MODE) {
    await wait();
    const db = readDB();
    if (db.groups.some((g) => g.group_name === input.group_name))
      throw new ApiError(`A group named '${input.group_name}' already exists. Choose a different name.`, 400);
    const bad = input.groupmember.filter((m) => m !== DEMO_ME && !areFriends(db, DEMO_ME, m));
    if (bad.length) throw new ApiError(`${bad.join(", ")} is/are not your accepted friend(s).`, 400);
    db.groups.push({
      group_name: input.group_name,
      group_description: input.group_description || null,
      groupmember: [...new Set([...input.groupmember, DEMO_ME])],
      admins: [DEMO_ME],
      expenses: [],
    });
    writeDB(db);
    return;
  }
  await api.post("/add_group/", {
    group_name: input.group_name,
    group_description: input.group_description || null,
    groupmember: input.groupmember,
  });
}

export async function getGroupDetails(name: string): Promise<GroupDetails> {
  if (DEMO_MODE) {
    await wait();
    const { g } = demoGroup(name);
    if (!g.groupmember.includes(DEMO_ME)) throw new ApiError("You are not a member of this group.", 403);
    return {
      group_name: g.group_name,
      group_description: g.group_description,
      members: g.groupmember,
      admins: g.admins,
      total_members: g.groupmember.length,
      total_spend: g.expenses.reduce((s, e) => s + e.amount, 0),
      total_expenses: g.expenses.length,
      expenses: g.expenses.map(({ split_details: _s, ...e }) => e),
    };
  }
  const res = await api.get<GroupDetails & { error?: string }>(`/groups/${enc(name)}/details/`);
  if (res.error) throw new ApiError("Group not found", 404);
  return res;
}

export async function getGroupBalances(name: string): Promise<Record<string, number>> {
  if (DEMO_MODE) {
    await wait();
    return groupBalances(demoGroup(name).g);
  }
  const res = await api.get<Record<string, unknown>>(`/balances/group/${enc(name)}/`);
  // Accept either a flat {user: amount} map or {balances: {...}}
  const map = (res["balances"] ?? res) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => typeof v === "number") as [string, number][],
  );
}

export async function updateGroup(input: {
  group_name: string;
  new_group_name?: string | undefined;
  group_description?: string | undefined;
}) {
  if (DEMO_MODE) {
    await wait();
    const { db, g } = demoGroup(input.group_name);
    if (input.new_group_name && input.new_group_name !== g.group_name) {
      if (db.groups.some((x) => x.group_name === input.new_group_name))
        throw new ApiError("A group with that name already exists.", 400);
      g.group_name = input.new_group_name;
    }
    if (input.group_description !== undefined) g.group_description = input.group_description;
    writeDB(db);
    return;
  }
  const res = await api.put<{ error?: string }>("/update_group/", input);
  if (res?.error) throw new ApiError(res.error, 404);
}

export async function addMembers(group_name: string, members: string[]) {
  if (DEMO_MODE) {
    await wait();
    const { db, g } = demoGroup(group_name);
    const dup = members.find((m) => g.groupmember.includes(m));
    if (dup) throw new ApiError(`${dup} is already in the group`, 400);
    const bad = members.filter((m) => !areFriends(db, DEMO_ME, m));
    if (bad.length) throw new ApiError(`${bad.join(", ")} is/are not your accepted friend(s).`, 400);
    g.groupmember = [...g.groupmember, ...members];
    writeDB(db);
    return;
  }
  const qs = new URLSearchParams({ group_name });
  const res = await api.post<{ msg?: string; error?: string }>(`/add_members/?${qs}`, members);
  if (res?.error) throw new ApiError(res.error, 404);
  if (res?.msg?.includes("already in the group")) throw new ApiError(res.msg.trim(), 400);
}

/** Leave the group yourself, or (admins) remove another member. */
export async function leaveGroup(group_name: string, member?: string) {
  if (DEMO_MODE) {
    await wait();
    const { db, g } = demoGroup(group_name);
    const target = member ?? DEMO_ME;
    if (member && member !== DEMO_ME && !g.admins.includes(DEMO_ME))
      throw new ApiError("Only admins can remove other members.", 403);
    const bal = groupBalances(g)[target] ?? 0;
    if (Math.abs(bal) > 0.01)
      throw new ApiError(`Cannot leave — balance in this group is not settled (₹${bal}). Settle up first.`, 400);
    if (target === DEMO_ME && g.admins.length === 1 && g.admins[0] === DEMO_ME && g.groupmember.length > 1)
      throw new ApiError("You are the only admin. Delete the group or make someone else admin first.", 400);
    g.groupmember = g.groupmember.filter((m) => m !== target);
    g.admins = g.admins.filter((m) => m !== target);
    writeDB(db);
    return;
  }
  const qs = new URLSearchParams({ group_name });
  if (member) qs.set("member", member);
  const res = await api.post<{ error?: string }>(`/leave_group/?${qs}`);
  if (res?.error) throw new ApiError(res.error, 404);
}

export async function deleteGroup(group_name: string) {
  if (DEMO_MODE) {
    await wait();
    const { db, g } = demoGroup(group_name);
    if (!g.admins.includes(DEMO_ME)) throw new ApiError("Only group admins can delete this group.", 403);
    const open = Object.entries(groupBalances(g)).filter(([, b]) => Math.abs(b) > 0.01);
    if (open.length) throw new ApiError("Cannot delete group — balances are not settled.", 400);
    db.groups = db.groups.filter((x) => x !== g);
    writeDB(db);
    return;
  }
  const res = await api.delete<{ error?: string }>(`/delete_group/?${new URLSearchParams({ group_name })}`);
  if (res?.error) throw new ApiError(res.error, 404);
}

/** Current username (for admin checks). */
export function currentUsernameDemo() {
  return DEMO_ME;
}
