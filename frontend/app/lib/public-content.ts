import { boardMembers as boardMemberPreview } from "../data/board-members";
import { galleryPreview } from "../data/gallery";
import { projects as projectPreview } from "../data/projects";
import { services as servicePreview } from "../data/services";
import type { BoardMember } from "../data/board-members";
import type { GalleryItem } from "../data/gallery";
import type { ProjectRecord } from "../data/projects";
import type { Service } from "../data/services";

type PageContent<T> = {
  items: T[];
  source: "api" | "development-preview" | "unavailable";
};

type ApiList<T> = { items: T[]; total: number; limit: number; offset: number };

type ApiProject = {
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
};

type ApiBoardMember = {
  id: number;
  name: string;
  position: string;
  image_url: string | null;
  image_alt: string | null;
};

type ApiGalleryImage = {
  id: number;
  title: string;
  category: string;
  image_url: string;
  image_alt: string;
  caption: string | null;
  featured: boolean;
};

const useDevelopmentPreview = process.env.NODE_ENV !== "production";
export const apiBase = (process.env.NEXT_PUBLIC_API_URL || (useDevelopmentPreview ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");

function unavailable<T>(preview: T[]): PageContent<T> {
  return useDevelopmentPreview
    ? { items: preview, source: "development-preview" }
    : { items: [], source: "unavailable" };
}

async function request<T>(path: string): Promise<T> {
  if (!apiBase) throw new Error("Public API URL is not configured");
  const response = await fetch(`${apiBase}/api/v1${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Public API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getPublicServices(): Promise<PageContent<Service>> {
  if (!apiBase) return unavailable(servicePreview);
  try {
    const result = await request<ApiList<ApiService>>("/services?limit=100");
    return { items: result.items.map(normalizeService), source: "api" };
  } catch {
    return unavailable(servicePreview);
  }
}

type ApiService = Omit<Service, "capacity"> & { capacity: string | null };

function normalizeService(service: ApiService): Service {
  return { ...service, capacity: service.capacity ?? undefined };
}

export async function getPublicService(slug: string): Promise<Service | null> {
  if (!apiBase) return useDevelopmentPreview ? servicePreview.find((item) => item.slug === slug) ?? null : null;
  try {
    const service = await request<ApiService>(`/services/${encodeURIComponent(slug)}`);
    return normalizeService(service);
  } catch {
    return useDevelopmentPreview ? servicePreview.find((item) => item.slug === slug) ?? null : null;
  }
}

function normalizeProject(item: ApiProject, index: number): ProjectRecord {
  const preview = projectPreview[index % projectPreview.length];
  return {
    slug: item.slug,
    number: item.number,
    title: item.title,
    category: item.category,
    image: item.image_url ?? preview.image,
    imageAlt: item.image_alt ?? (item.image_url ? `Project image for ${item.title}` : "Willyfab Engineering project image"),
    shortDescription: item.short_description,
    brief: item.brief,
    scope: item.scope,
    client: item.client,
    location: item.location,
    completion: item.completion_date ?? item.start_date,
    isTemplate: false,
    imageIsPlaceholder: item.image_url === null,
  };
}

export async function getPublicProjects(): Promise<PageContent<ProjectRecord>> {
  if (!apiBase) return unavailable(projectPreview);
  try {
    const result = await request<ApiList<ApiProject>>("/projects?limit=100");
    return { items: result.items.map(normalizeProject), source: "api" };
  } catch {
    return unavailable(projectPreview);
  }
}

function normalizeBoardMember(item: ApiBoardMember): BoardMember {
  return {
    id: item.id,
    name: item.name,
    position: item.position,
    imageUrl: item.image_url,
    imageAlt: item.image_alt,
  };
}

export async function getPublicBoardMembers(): Promise<PageContent<BoardMember>> {
  if (!apiBase) return unavailable(boardMemberPreview);
  try {
    const result = await request<{ items: ApiBoardMember[]; total: number }>("/board-members");
    if (result.items.length === 0 && useDevelopmentPreview) return unavailable(boardMemberPreview);
    return { items: result.items.map(normalizeBoardMember), source: "api" };
  } catch {
    return unavailable(boardMemberPreview);
  }
}

export async function getPublicProject(slug: string): Promise<ProjectRecord | null> {
  if (!apiBase) return useDevelopmentPreview ? projectPreview.find((item) => item.slug === slug) ?? null : null;
  try {
    const result = await request<ApiProject>(`/projects/${encodeURIComponent(slug)}`);
    const index = projectPreview.findIndex((item) => item.slug === result.slug);
    return normalizeProject(result, Math.max(index, 0));
  } catch {
    return useDevelopmentPreview ? projectPreview.find((item) => item.slug === slug) ?? null : null;
  }
}

function normalizeGalleryImage(item: ApiGalleryImage): GalleryItem {
  return {
    id: item.id,
    title: item.title,
    category: item.category,
    imageUrl: item.image_url,
    imageAlt: item.image_alt,
    caption: item.caption,
    featured: item.featured,
  };
}

export async function getPublicGallery(): Promise<PageContent<GalleryItem>> {
  if (!apiBase) return unavailable(galleryPreview);
  try {
    const result = await request<ApiList<ApiGalleryImage>>("/gallery?limit=200");
    if (result.items.length === 0 && useDevelopmentPreview) return unavailable(galleryPreview);
    return { items: result.items.map(normalizeGalleryImage), source: "api" };
  } catch {
    return unavailable(galleryPreview);
  }
}

export type SiteStatus = { maintenance: boolean; message: string | null };

type ApiSiteStatus = { maintenance_mode: boolean; maintenance_message: string | null };

const SITE_OPEN: SiteStatus = { maintenance: false, message: null };

/** Fails open: if the status cannot be read, the public site stays visible. */
export async function getSiteStatus(): Promise<SiteStatus> {
  if (!apiBase) return SITE_OPEN;
  try {
    const result = await request<ApiSiteStatus>("/site-status");
    return { maintenance: result.maintenance_mode === true, message: result.maintenance_message };
  } catch {
    return SITE_OPEN;
  }
}

