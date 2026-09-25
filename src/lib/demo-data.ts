/** Demo data used while the real backend is not connected yet (Phase 1). */

export type DemoUser = { id: string; name: string; email: string };
export type DemoGroup = {
  id: string;
  name: string;
  members: number;
  balance: number; // + you are owed, - you owe
};
export type DemoFriend = { id: string; name: string; email: string; balance: number };
export type DemoActivity = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  when: string;
};

export const demoUser: DemoUser = {
  id: "u-1",
  name: "Rishva Davariya",
  email: "rishva@example.com",
};

export const demoGroups: DemoGroup[] = [
  { id: "g-1", name: "Goa Trip", members: 5, balance: 1840 },
  { id: "g-2", name: "Flat 204", members: 3, balance: -620 },
  { id: "g-3", name: "Office Lunch", members: 8, balance: 245 },
  { id: "g-4", name: "Weekend Movies", members: 4, balance: 0 },
];

export const demoFriends: DemoFriend[] = [
  { id: "f-1", name: "Aarav Shah", email: "aarav@example.com", balance: 750 },
  { id: "f-2", name: "Priya Mehta", email: "priya@example.com", balance: -320 },
  { id: "f-3", name: "Kabir Patel", email: "kabir@example.com", balance: 0 },
  { id: "f-4", name: "Isha Rao", email: "isha@example.com", balance: 1200 },
];

export const demoActivity: DemoActivity[] = [
  {
    id: "a-1",
    title: "Aarav added “Beach shack dinner”",
    detail: "Goa Trip · split equally",
    amount: 2400,
    when: "2 hours ago",
  },
  {
    id: "a-2",
    title: "You paid Priya",
    detail: "Settlement",
    amount: -500,
    when: "Yesterday",
  },
  {
    id: "a-3",
    title: "Isha added “Electricity bill”",
    detail: "Flat 204 · split unequally",
    amount: 1860,
    when: "2 days ago",
  },
  {
    id: "a-4",
    title: "You added “Cab to airport”",
    detail: "Goa Trip · split by percentage",
    amount: 980,
    when: "4 days ago",
  },
];

export const demoTotals = {
  owed: demoFriends.filter((f) => f.balance > 0).reduce((s, f) => s + f.balance, 0),
  owe: Math.abs(demoFriends.filter((f) => f.balance < 0).reduce((s, f) => s + f.balance, 0)),
};

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
