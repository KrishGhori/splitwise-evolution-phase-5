/**
 * Phase 1 config.
 *
 * DEMO_MODE = true  -> app runs on local demo data (no backend needed)
 * DEMO_MODE = false -> app talks to the FastAPI backend at API_BASE_URL
 *
 * When the real backend URL is available, set VITE_API_BASE_URL and flip
 * VITE_DEMO_MODE to "false". Nothing else in the app needs to change.
 */
export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export const DEMO_MODE: boolean =
  (import.meta.env["VITE_DEMO_MODE"] as string | undefined) !== "false" || !API_BASE_URL;

export const TOKEN_STORAGE_KEY = "splitwise.access_token";
