import { API_BASE_URL, DEMO_MODE } from "./config";
import { ApiError, api, setToken } from "./api-client";

const REFRESH_KEY = "splitwise.refresh_token";

export type RegisterInput = {
  firstname: string;
  lastname: string;
  username: string;
  gender: "male" | "female" | "other";
  mobile_no: string;
  email: string;
  password: string;
};

export async function login(username: string, password: string) {
  if (DEMO_MODE) {
    setToken("demo-token");
    return;
  }
  const body = new URLSearchParams({ username, password });
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(readDetail(data) ?? "Login failed", res.status);
  setToken(data.access_token);
  window.localStorage.setItem(REFRESH_KEY, data.refresh_token);
}

export async function register(input: RegisterInput) {
  if (DEMO_MODE) return;
  const res = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(readDetail(data) ?? "Registration failed", res.status);
}

export async function logout() {
  const refresh = window.localStorage.getItem(REFRESH_KEY);
  if (!DEMO_MODE && refresh) {
    try {
      await api.post("/logout/", refresh);
    } catch {
      /* ignore */
    }
  }
  setToken(null);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function googleLoginUrl() {
  return `${API_BASE_URL}/auth/google/login`;
}

function readDetail(data: unknown): string | null {
  const d = (data as { detail?: unknown })?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d))
    return d.map((e: { msg?: string }) => e?.msg?.replace("Value error, ", "")).join(", ");
  return null;
}
