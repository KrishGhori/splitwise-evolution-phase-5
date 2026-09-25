/** Shared localStorage demo database used by Friends (Phase 4) and Groups (Phase 5) while DEMO_MODE is on. */

export const DEMO_ME = "RISHVA01";

export type DemoPerson = { firstname: string; lastname: string; username: string };
export type DemoRelation = { from: string; to: string; status: "pending" | "accepted" | "rejected" };
export type DemoExpense = {
  id: number;
  amount: number;
  paid_by_name: string;
  split_method: string;
  description: string;
  date: string;
  split_details: Record<string, number>;
};
export type DemoGroupRow = {
  group_name: string;
  group_description: string | null;
  groupmember: string[];
  admins: string[];
  expenses: DemoExpense[];
};
export type DemoDB = {
  users: DemoPerson[];
  relations: DemoRelation[];
  groups: DemoGroupRow[];
};

const KEY = "splitwise.demo_db.v2";

const seed: DemoDB = {
  users: [
    { firstname: "Rishva", lastname: "Davariya", username: DEMO_ME },
    { firstname: "Aarav", lastname: "Shah", username: "AARAV01" },
    { firstname: "Priya", lastname: "Patel", username: "PRIYA22" },
    { firstname: "Rohan", lastname: "Mehta", username: "ROHAN7" },
    { firstname: "Neha", lastname: "Joshi", username: "NEHA99" },
    { firstname: "Kabir", lastname: "Desai", username: "KABIR5" },
  ],
  relations: [
    { from: DEMO_ME, to: "AARAV01", status: "accepted" },
    { from: "PRIYA22", to: DEMO_ME, status: "accepted" },
    { from: DEMO_ME, to: "KABIR5", status: "accepted" },
    { from: "ROHAN7", to: DEMO_ME, status: "pending" },
    { from: "NEHA99", to: DEMO_ME, status: "pending" },
  ],
  groups: [
    {
      group_name: "Goa Trip",
      group_description: "Beach, shacks and scooters",
      groupmember: [DEMO_ME, "AARAV01", "PRIYA22"],
      admins: [DEMO_ME],
      expenses: [
        {
          id: 1,
          amount: 2400,
          paid_by_name: DEMO_ME,
          split_method: "equally",
          description: "Beach shack dinner",
          date: "2026-09-20",
          split_details: { [DEMO_ME]: 800, AARAV01: 800, PRIYA22: 800 },
        },
        {
          id: 2,
          amount: 900,
          paid_by_name: "AARAV01",
          split_method: "equally",
          description: "Scooter rent",
          date: "2026-09-21",
          split_details: { [DEMO_ME]: 300, AARAV01: 300, PRIYA22: 300 },
        },
      ],
    },
    {
      group_name: "Weekend Movies",
      group_description: null,
      groupmember: [DEMO_ME, "KABIR5"],
      admins: ["KABIR5"],
      expenses: [],
    },
  ],
};

export function readDB(): DemoDB {
  if (typeof window === "undefined") return structuredClone(seed);
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as DemoDB) : structuredClone(seed);
}

export function writeDB(db: DemoDB) {
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export function areFriends(db: DemoDB, a: string, b: string) {
  return db.relations.some(
    (r) =>
      r.status === "accepted" &&
      ((r.from === a && r.to === b) || (r.from === b && r.to === a)),
  );
}

/** Same math as backend get_group_balances (no settlements in demo yet). */
export function groupBalances(g: DemoGroupRow): Record<string, number> {
  const bal: Record<string, number> = Object.fromEntries(g.groupmember.map((m) => [m, 0]));
  for (const e of g.expenses) {
    if (e.paid_by_name in bal) bal[e.paid_by_name] += e.amount;
    for (const [m, s] of Object.entries(e.split_details)) if (m in bal) bal[m] -= s;
  }
  return bal;
}

export function friendBalance(db: DemoDB, me: string, friend: string) {
  let total = 0;
  for (const g of db.groups) {
    if (!g.groupmember.includes(me) || !g.groupmember.includes(friend)) continue;
    for (const e of g.expenses) {
      if (e.paid_by_name === me) total += e.split_details[friend] ?? 0;
      if (e.paid_by_name === friend) total -= e.split_details[me] ?? 0;
    }
  }
  return Math.round(total * 100) / 100;
}
