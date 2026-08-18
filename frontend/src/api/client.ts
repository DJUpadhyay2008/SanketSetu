import { supabase } from "../lib/supabase";

// Support both VITE_API_BASE_URL (preferred, matches .env.local.example) and
// legacy VITE_API_URL key so existing environments don't break.
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (import.meta.env.VITE_API_URL as string) ||
  "http://localhost:8000/api";

/**
 * Custom fetch wrapper for Sanket Setu backend API
 */
export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Dynamically fetch session token from Supabase Auth
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token || localStorage.getItem("sanket_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch (error) {
    console.error("Failed to append Supabase auth token:", error);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "An error occurred while fetching API data";
    try {
      const errorData = await response.json();
      errorMessage = errorData?.detail || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle empty or 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * POST helper — thin wrapper around fetchFromApi for JSON bodies.
 */
export async function postToApi<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
  return fetchFromApi<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * PATCH helper — for partial resource updates.
 */
export async function patchToApi<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
  return fetchFromApi<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * PUT helper — for full resource replacement.
 */
export async function putToApi<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
  return fetchFromApi<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * DELETE helper — sends an authenticated DELETE request.
 */
export async function deleteFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchFromApi<T>(endpoint, {
    method: "DELETE",
    ...options,
  });
}

/**
 * Register the Sanket Setu Service Worker (Phase 9 Offline).
 * Call once at app startup (main.tsx).
 */
export function registerServiceWorker(): void {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[SanketSW] Registered:", reg.scope);

          // Prompt reload when new SW is waiting
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[SanketSW] New version available — reload to update.");
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });
        })
        .catch((err) => console.error("[SanketSW] Registration failed:", err));
    });
  }
}
