import { apiBase } from "../lib/public-content";

export const SESSION_KEY = "willyfab-admin-token";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type BoardMemberRecord = {
  id: number;
  name: string;
  position: string;
  image_url: string | null;
  image_alt: string | null;
  sort_order: number;
  is_published: boolean;
};

export type GalleryRecord = {
  id: number;
  title: string;
  category: string;
  image_url: string;
  image_alt: string;
  caption: string | null;
  featured: boolean;
  sort_order: number;
  is_published: boolean;
};

export type ProjectRecord = {
  id: number;
  slug: string;
  number: string;
  title: string;
  category: string;
  image_url: string | null;
  image_alt: string | null;
  short_description: string;
  brief: string;
  scope: string;
  client: string | null;
  location: string | null;
  start_date: string | null;
  completion_date: string | null;
  featured: boolean;
  sort_order: number;
  is_published: boolean;
};

export type ServiceRecord = {
  id: number;
  slug: string;
  number: string;
  title: string;
  category: string;
  capacity: string | null;
  summary: string;
  description: string;
  sort_order: number;
  is_published: boolean;
};

export type InquiryStatus = "new" | "contacted" | "archived";

export type InquiryRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_interest: string | null;
  message: string;
  status: InquiryStatus;
  created_at: string;
};

export type ListResponse<T> = { items: T[]; total: number };

export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function isAuthLost(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 401;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item ? String((item as { msg: unknown }).msg) : "",
        )
        .filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }
  }
  return fallback;
}

function requireApi(): string {
  if (!apiBase) {
    throw new AdminApiError(0, "The API address is not configured. Set NEXT_PUBLIC_API_URL.");
  }
  return apiBase;
}

export async function signIn(email: string, password: string): Promise<string> {
  const base = requireApi();
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    throw new AdminApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AdminApiError(response.status, extractMessage(body, "Incorrect email or password."));
  }
  return (body as { access_token: string }).access_token;
}

export async function adminRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const base = requireApi();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");

  let fallback = "The information could not be loaded.";
  if (init.method === "DELETE") fallback = "The item could not be deleted.";
  else if (init.method && init.method !== "GET") fallback = "The changes could not be saved.";

  let response: Response;
  try {
    response = await fetch(`${base}/api/v1/admin${path}`, { ...init, headers, cache: "no-store" });
  } catch {
    throw new AdminApiError(0, "Could not reach the server. Check your connection and try again.");
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      response.status === 401 ? "Your session has ended. Sign in again to continue." : extractMessage(body, fallback);
    throw new AdminApiError(response.status, message);
  }
  return body as T;
}

export function saveRecord<T>(path: string, token: string, id: number | null, payload: unknown): Promise<T> {
  return adminRequest<T>(id === null ? path : `${path}/${id}`, token, {
    method: id === null ? "POST" : "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteRecord(path: string, token: string, id: number): Promise<void> {
  return adminRequest<void>(`${path}/${id}`, token, { method: "DELETE" });
}

export async function uploadImage(token: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const result = await adminRequest<{ url: string }>("/uploads", token, { method: "POST", body: form });
  return result.url;
}
