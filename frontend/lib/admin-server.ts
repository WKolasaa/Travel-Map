import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, API_BASE_URL, type AdminDirectoryUser, type AdminGroup, type AdminRole, type AdminUser } from "@/lib/auth";
import { mapPlace, mapTrip } from "@/lib/api";
import type { Place, TravelBootstrap, Trip } from "@/lib/types";

const FETCH_TIMEOUT_MS = 5000;

const ROLE_RANK: Record<AdminRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

export type AdminSession = {
  token: string;
  user: AdminUser;
};

export type AdminPlacesPageParams = {
  q?: string;
  status?: string;
  tripId?: string;
  assignment?: string;
  page?: number;
  pageSize?: number;
};

export type AdminTripsPageParams = {
  q?: string;
  status?: string;
  route?: string;
  tag?: string;
  year?: number;
  page?: number;
  pageSize?: number;
};

export type PaginatedAdminResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function mapAdminGroup(payload: Record<string, unknown>): AdminGroup {
  return {
    id: String(payload.id),
    name: String(payload.name),
    slug: String(payload.slug),
    description: String(payload.description ?? ""),
    status: payload.status === "archived" ? "archived" : "active",
    memberCount: Number(payload.member_count ?? 0),
    createdAt: String(payload.created_at),
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
    memberIds: Array.isArray(payload.member_ids) ? payload.member_ids.map(String) : []
  };
}

function mapAdminUser(payload: Record<string, unknown>): AdminDirectoryUser {
  return {
    id: String(payload.id),
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as AdminRole,
    isActive: Boolean(payload.is_active),
    createdAt: String(payload.created_at),
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
    groups: Array.isArray(payload.groups) ? payload.groups.map((group) => mapAdminGroup(group as Record<string, unknown>)) : []
  };
}

async function fetchAdminJson<T>(path: string): Promise<T> {
  const session = await requireAdminSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${session.token}`
    },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  if (response.status === 401) {
    redirect("/admin/login");
  }

  if (!response.ok) {
    throw new Error(`Admin request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  if (!response.ok) {
    return null;
  }

  const user = await response.json() as AdminUser;
  return { token, user };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireMinimumRole(role: AdminRole): Promise<AdminSession> {
  const session = await requireAdminSession();
  if (ROLE_RANK[session.user.role] < ROLE_RANK[role]) {
    redirect("/admin");
  }
  return session;
}

export async function getAdminBootstrapData(): Promise<TravelBootstrap> {
  const payload = await fetchAdminJson<{ places: Record<string, unknown>[]; trips: Record<string, unknown>[] }>("/api/admin/bootstrap");
  return {
    places: payload.places.map(mapPlace),
    trips: payload.trips.map(mapTrip)
  };
}

export async function getAdminPlacesPage(params: AdminPlacesPageParams = {}): Promise<PaginatedAdminResult<Place>> {
  const query = buildQueryString({
    q: params.q,
    status: params.status,
    trip_id: params.tripId,
    assignment: params.assignment,
    page: params.page,
    page_size: params.pageSize
  });
  const payload = await fetchAdminJson<{ items: Record<string, unknown>[]; total: number; page: number; page_size: number }>(`/api/admin/places${query}`);
  return {
    items: payload.items.map(mapPlace),
    total: payload.total,
    page: payload.page,
    pageSize: payload.page_size
  };
}

export async function getAdminTripsPage(params: AdminTripsPageParams = {}): Promise<PaginatedAdminResult<Trip>> {
  const query = buildQueryString({
    q: params.q,
    status: params.status,
    route: params.route,
    tag: params.tag,
    year: params.year,
    page: params.page,
    page_size: params.pageSize
  });
  const payload = await fetchAdminJson<{ items: Record<string, unknown>[]; total: number; page: number; page_size: number }>(`/api/admin/trips${query}`);
  return {
    items: payload.items.map(mapTrip),
    total: payload.total,
    page: payload.page,
    pageSize: payload.page_size
  };
}

export async function getAdminUsers(): Promise<AdminDirectoryUser[]> {
  const payload = await fetchAdminJson<Record<string, unknown>[]>("/api/admin/users");
  return payload.map(mapAdminUser);
}

export async function getAdminGroups(): Promise<AdminGroup[]> {
  const payload = await fetchAdminJson<Record<string, unknown>[]>("/api/admin/groups");
  return payload.map(mapAdminGroup);
}

export async function getAdminPlaceBySlug(slug: string): Promise<Place | null> {
  try {
    const payload = await fetchAdminJson<Record<string, unknown>>(`/api/admin/places/slug/${slug}`);
    return mapPlace(payload);
  } catch {
    return null;
  }
}

export async function getAdminTripBySlug(slug: string): Promise<Trip | null> {
  try {
    const payload = await fetchAdminJson<Record<string, unknown>>(`/api/admin/trips/slug/${slug}`);
    return mapTrip(payload);
  } catch {
    return null;
  }
}
