import { DEMO_MODE } from "./config";
import { ApiError, api, apiRequest } from "./api-client";
import { DEMO_ME, areFriends, friendBalance, readDB, wait, writeDB } from "./demo-store";

export type SearchUser = { firstname: string; lastname: string; username: string };
export type Friend = { username: string; balance: number };
export type FriendAction = "accepted" | "rejected";

const pair = (r: { from: string; to: string }, a: string, b: string) =>
  (r.from === a && r.to === b) || (r.from === b && r.to === a);

export async function searchUsers(query: string): Promise<SearchUser[]> {
  if (DEMO_MODE) {
    await wait();
    const q = query.toLowerCase();
    return readDB()
      .users.filter(
        (u) =>
          u.username !== DEMO_ME &&
          `${u.username} ${u.firstname} ${u.lastname}`.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }
  const res = await api.post<{ data: SearchUser[] }>("/friend/search/", { query });
  return res.data ?? [];
}

export async function sendFriendRequest(friend_username: string) {
  if (DEMO_MODE) {
    await wait();
    const d = readDB();
    const ex = d.relations.find((r) => pair(r, DEMO_ME, friend_username));
    if (ex && ex.status !== "rejected")
      throw new ApiError(`relationship or request already exists with status: '${ex.status}'.`, 400);
    d.relations = d.relations.filter((r) => r !== ex);
    d.relations.push({ from: DEMO_ME, to: friend_username, status: "pending" });
    writeDB(d);
  } else {
    await api.post("/friend/send_request/", { friend_username });
  }
  rememberSent(friend_username);
}

export async function respondFriendRequest(friend_username: string, action: FriendAction) {
  if (DEMO_MODE) {
    await wait();
    const d = readDB();
    const r = d.relations.find(
      (x) => x.from === friend_username && x.to === DEMO_ME && x.status === "pending",
    );
    if (!r) throw new ApiError(`No pending friend request found from user '${friend_username}'`, 404);
    r.status = action;
    writeDB(d);
    return;
  }
  await api.put("/friend/respond_request/", { friend_username, action });
}

export async function listFriends(): Promise<Friend[]> {
  if (DEMO_MODE) {
    await wait();
    const d = readDB();
    return d.users
      .filter((u) => u.username !== DEMO_ME && areFriends(d, DEMO_ME, u.username))
      .map((u) => ({ username: u.username, balance: friendBalance(d, DEMO_ME, u.username) }));
  }
  const res = await api.get<{ friends: Friend[] }>("/friend/list/");
  return res.friends ?? [];
}

export async function removeFriend(friend_username: string) {
  if (DEMO_MODE) {
    await wait();
    const d = readDB();
    if (Math.abs(friendBalance(d, DEMO_ME, friend_username)) > 0.01)
      throw new ApiError(`Cannot remove ${friend_username} — balance is not settled. Settle up first.`, 400);
    d.relations = d.relations.filter(
      (r) => !(r.status === "accepted" && pair(r, DEMO_ME, friend_username)),
    );
    writeDB(d);
    return;
  }
  await apiRequest("/friend/remove/", { method: "DELETE", body: { friend_username } });
}

/** Backend has no "list incoming" endpoint yet — only demo mode can list them. */
export const CAN_LIST_INCOMING = DEMO_MODE;
export async function listIncoming(): Promise<string[]> {
  if (!DEMO_MODE) return [];
  await wait();
  return readDB()
    .relations.filter((r) => r.to === DEMO_ME && r.status === "pending")
    .map((r) => r.from);
}

const SENT = "splitwise.sent_requests";
export function getSent(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem(SENT) || "[]") as string[];
}
function rememberSent(u: string) {
  window.localStorage.setItem(SENT, JSON.stringify([...new Set([u, ...getSent()])]));
}
export function forgetSent(u: string) {
  window.localStorage.setItem(SENT, JSON.stringify(getSent().filter((x) => x !== u)));
}
