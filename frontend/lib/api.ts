import { fallbackBootstrap, places as fallbackPlaces, trips as fallbackTrips } from "@/lib/sample-data";
import { API_BASE_URL } from "@/lib/auth";
import type { ContentStatus, Place, TravelBootstrap, Trip } from "@/lib/types";

const FETCH_TIMEOUT_MS = 5000;
const PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_BROWSER_API_BASE_URL ?? "http://localhost:8000";

export type PlaceInput = {
  title: string;
  slug?: string;
  summary: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  marker_color: string;
  trip_id: string | null;
  image_url: string;
  gallery: string[];
  tags: string[];
  visibility: string;
  group_ids: string[];
  companions: string[];
  rating: number;
  trip_order: number;
  status: ContentStatus;
};

export type TripInput = {
  title: string;
  slug?: string;
  summary: string;
  description: string;
  start_date: string;
  end_date: string;
  route_enabled: boolean;
  color: string;
  cover_image_url: string;
  tags: string[];
  visibility: string;
  group_ids: string[];
  status: ContentStatus;
};

export type PlaceSearchParams = {
  q?: string;
  tripId?: string;
  country?: string;
  tag?: string;
  token?: string;
};

export type TripSearchParams = {
  q?: string;
  tag?: string;
  year?: number;
  token?: string;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PlaceFacets = {
  countries: string[];
  tags: string[];
  trips: Array<{ id: string; title: string }>;
};

export type TripFacets = {
  tags: string[];
  years: string[];
};

export type TimelineFacets = {
  years: string[];
  tags: string[];
  trips: Array<{ id: string; title: string }>;
  kinds: string[];
};

export function resolveAssetUrl(url: string): string {
  if (!url) {
    return url;
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "backend") {
        return `${PUBLIC_API_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return url;
    }
    return url;
  }

  if (url.startsWith("/")) {
    return `${PUBLIC_API_BASE_URL}${url}`;
  }
  return url;
}

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

async function buildApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json() as { detail?: string | { msg?: string }[] };
    if (typeof payload.detail === "string") {
      return new Error(payload.detail);
    }
    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const firstMessage = payload.detail[0]?.msg;
      if (firstMessage) {
        return new Error(firstMessage);
      }
    }
  } catch {
    // ignore parse failure and use fallback
  }
  return new Error(fallback);
}

export function mapPlace(payload: Record<string, unknown>): Place {
  const imageUrl = resolveAssetUrl(String(payload.image_url));
  return {
    id: String(payload.id),
    title: String(payload.title),
    slug: String(payload.slug),
    summary: String(payload.summary),
    description: String(payload.description ?? payload.summary),
    city: String(payload.city),
    country: String(payload.country),
    latitude: Number(payload.latitude),
    longitude: Number(payload.longitude),
    startDate: String(payload.start_date),
    endDate: String(payload.end_date),
    markerColor: String(payload.marker_color),
    tripId: payload.trip_id ? String(payload.trip_id) : null,
    imageUrl,
    gallery: Array.isArray(payload.gallery)
      ? payload.gallery.map((item) => resolveAssetUrl(String(item)))
      : [imageUrl],
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
    visibility: (payload.visibility as Place["visibility"]) ?? "public",
    groupIds: Array.isArray(payload.group_ids) ? payload.group_ids.map(String) : [],
    companions: Array.isArray(payload.companions) ? payload.companions.map(String) : [],
    rating: Number(payload.rating ?? 0),
    tripOrder: Number(payload.trip_order ?? 0),
    status: (payload.status as ContentStatus) ?? "published"
  };
}

export function mapTrip(payload: Record<string, unknown>): Trip {
  return {
    id: String(payload.id),
    title: String(payload.title),
    slug: String(payload.slug),
    summary: String(payload.summary),
    description: String(payload.description ?? payload.summary),
    startDate: String(payload.start_date),
    endDate: String(payload.end_date),
    color: String(payload.color ?? "#7dd8c6"),
    coverImageUrl: resolveAssetUrl(String(payload.cover_image_url ?? "")),
    routeEnabled: Boolean(payload.route_enabled),
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
    visibility: (payload.visibility as Trip["visibility"]) ?? "public",
    groupIds: Array.isArray(payload.group_ids) ? payload.group_ids.map(String) : [],
    status: (payload.status as ContentStatus) ?? "published",
    places: Array.isArray(payload.places)
      ? payload.places.map((place) => mapPlace(place as Record<string, unknown>))
      : undefined
  };
}

async function fetchJson<T>(path: string, options: { token?: string; revalidate?: number } = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
    ...(options.token ? { cache: "no-store" as const } : { next: { revalidate: options.revalidate ?? 60 } }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });

  if (!response.ok) {
    throw await buildApiError(response, `Request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

async function mutateJson<T>(path: string, method: "POST" | "PATCH" | "DELETE", body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin"
  });

  if (!response.ok) {
    throw await buildApiError(response, `Mutation failed: ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function fetchBootstrap(path: string, fallback: TravelBootstrap, token?: string): Promise<TravelBootstrap> {
  try {
    const payload = await fetchJson<{ places: Record<string, unknown>[]; trips: Record<string, unknown>[] }>(path, { token });
    return {
      places: payload.places.map(mapPlace),
      trips: payload.trips.map(mapTrip)
    };
  } catch {
    return fallback;
  }
}

export async function uploadAdminMedia(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    body: formData,
    credentials: "same-origin"
  });

  if (!response.ok) {
    throw await buildApiError(response, "Upload failed");
  }

  const payload = await response.json() as { url: string };
  return resolveAssetUrl(payload.url);
}

export async function getBootstrapData(token?: string): Promise<TravelBootstrap> {
  return fetchBootstrap("/api/bootstrap", fallbackBootstrap, token);
}

export async function getPlaces(params: PlaceSearchParams = {}): Promise<Place[]> {
  try {
    const query = buildQueryString({
      q: params.q,
      trip_id: params.tripId,
      country: params.country,
      tag: params.tag
    });
    const payload = await fetchJson<Record<string, unknown>[]>(`/api/places${query}`, { token: params.token });
    return payload.map(mapPlace);
  } catch {
    return fallbackPlaces.filter((place) => {
      if (place.status !== "published") return false;
      if (params.tripId && place.tripId !== params.tripId) return false;
      if (params.country && place.country.toLowerCase() !== params.country.toLowerCase()) return false;
      if (params.tag && !place.tags.some((tag) => tag.toLowerCase() === params.tag?.toLowerCase())) return false;
      if (params.q) {
        const query = params.q.toLowerCase();
        const haystack = [place.title, place.city, place.country, place.summary, ...place.tags].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }
}

export async function getPlaceFacets(params: PlaceSearchParams = {}): Promise<PlaceFacets> {
  try {
    const query = buildQueryString({
      q: params.q,
      trip_id: params.tripId,
      country: params.country,
      tag: params.tag
    });
    return await fetchJson<PlaceFacets>(`/api/facets/places${query}`, { token: params.token });
  } catch {
    const places = await getPlaces(params);
    return {
      countries: [...new Set(places.map((place) => place.country))].sort((left, right) => left.localeCompare(right)),
      tags: [...new Set(places.flatMap((place) => place.tags))].sort((left, right) => left.localeCompare(right)),
      trips: fallbackTrips.map((trip) => ({ id: trip.id, title: trip.title }))
    };
  }
}

export async function getPlacesPage(params: PlaceSearchParams & { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<Place>> {
  try {
    const query = buildQueryString({
      q: params.q,
      trip_id: params.tripId,
      country: params.country,
      tag: params.tag,
      page: params.page,
      page_size: params.pageSize
    });
    const payload = await fetchJson<{ items: Record<string, unknown>[]; total: number; page: number; page_size: number }>(`/api/places/query${query}`, { token: params.token });
    return {
      items: payload.items.map(mapPlace),
      total: payload.total,
      page: payload.page,
      pageSize: payload.page_size
    };
  } catch {
    const items = await getPlaces(params);
    const pageSize = params.pageSize ?? 9;
    const page = Math.max(params.page ?? 1, 1);
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize
    };
  }
}

export async function getTrips(params: TripSearchParams = {}): Promise<Trip[]> {
  try {
    const query = buildQueryString({
      q: params.q,
      tag: params.tag,
      year: params.year
    });
    const payload = await fetchJson<Record<string, unknown>[]>(`/api/trips${query}`, { token: params.token });
    return payload.map(mapTrip);
  } catch {
    return fallbackTrips.filter((trip) => {
      if (trip.status !== "published") return false;
      if (params.tag && !trip.tags.some((tag) => tag.toLowerCase() === params.tag?.toLowerCase())) return false;
      if (params.year && !trip.startDate.startsWith(String(params.year))) return false;
      if (params.q) {
        const query = params.q.toLowerCase();
        const haystack = [trip.title, trip.summary, trip.description, ...trip.tags].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }
}

export async function getTripFacets(params: TripSearchParams = {}): Promise<TripFacets> {
  try {
    const query = buildQueryString({
      q: params.q,
      tag: params.tag,
      year: params.year
    });
    return await fetchJson<TripFacets>(`/api/facets/trips${query}`, { token: params.token });
  } catch {
    const trips = await getTrips(params);
    return {
      tags: [...new Set(trips.flatMap((trip) => trip.tags))].sort((left, right) => left.localeCompare(right)),
      years: [...new Set(trips.map((trip) => trip.startDate.slice(0, 4)))].sort((left, right) => Number(right) - Number(left))
    };
  }
}

export async function getTimelineFacets(token?: string): Promise<TimelineFacets> {
  try {
    return await fetchJson<TimelineFacets>("/api/facets/timeline", { token });
  } catch {
    const years = [...new Set([...fallbackPlaces, ...fallbackTrips].map((item) => item.startDate.slice(0, 4)))].sort((left, right) => Number(right) - Number(left));
    const tags = [...new Set([...fallbackPlaces.flatMap((place) => place.tags), ...fallbackTrips.flatMap((trip) => trip.tags)])].sort((left, right) => left.localeCompare(right));
    return {
      years,
      tags,
      trips: fallbackTrips.map((trip) => ({ id: trip.id, title: trip.title })),
      kinds: ["all", "place", "trip"]
    };
  }
}

export async function getTripsPage(params: TripSearchParams & { page?: number; pageSize?: number } = {}): Promise<PaginatedResult<Trip>> {
  try {
    const query = buildQueryString({
      q: params.q,
      tag: params.tag,
      year: params.year,
      page: params.page,
      page_size: params.pageSize
    });
    const payload = await fetchJson<{ items: Record<string, unknown>[]; total: number; page: number; page_size: number }>(`/api/trips/query${query}`, { token: params.token });
    return {
      items: payload.items.map(mapTrip),
      total: payload.total,
      page: payload.page,
      pageSize: payload.page_size
    };
  } catch {
    const items = await getTrips(params);
    const pageSize = params.pageSize ?? 9;
    const page = Math.max(params.page ?? 1, 1);
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize
    };
  }
}

export async function getPlaceBySlug(slug: string, token?: string): Promise<Place | null> {
  try {
    const payload = await fetchJson<Record<string, unknown>>(`/api/places/slug/${slug}`, { token });
    return mapPlace(payload);
  } catch {
    return fallbackPlaces.find((place) => place.slug === slug && place.status === "published") ?? null;
  }
}

export async function getRelatedPlaces(slug: string, token?: string): Promise<Place[]> {
  try {
    const payload = await fetchJson<Record<string, unknown>[]>(`/api/places/slug/${slug}/related`, { token });
    return payload.map(mapPlace);
  } catch {
    const place = fallbackPlaces.find((entry) => entry.slug === slug && entry.status === "published");
    if (!place) {
      return [];
    }
    if (!place.tripId) {
      return [];
    }
    return fallbackPlaces.filter((entry) => entry.tripId === place.tripId && entry.slug !== slug && entry.status === "published");
  }
}

export async function getTripBySlug(slug: string, token?: string): Promise<Trip | null> {
  try {
    const payload = await fetchJson<Record<string, unknown>>(`/api/trips/slug/${slug}`, { token });
    return mapTrip(payload);
  } catch {
    const trip = fallbackTrips.find((entry) => entry.slug === slug && entry.status === "published") ?? null;
    if (!trip) {
      return null;
    }
    return {
      ...trip,
      places: fallbackPlaces.filter((place) => place.tripId === trip.id && place.status === "published")
    };
  }
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const payload = await mutateJson<Record<string, unknown>>("/api/admin/places", "POST", input);
  return mapPlace(payload);
}

export async function updatePlace(slug: string, input: Partial<PlaceInput>): Promise<Place> {
  const payload = await mutateJson<Record<string, unknown>>(`/api/admin/places/${slug}`, "PATCH", input);
  return mapPlace(payload);
}

export async function deletePlace(slug: string): Promise<void> {
  await mutateJson<void>(`/api/admin/places/${slug}`, "DELETE");
}

export async function createTrip(input: TripInput): Promise<Trip> {
  const payload = await mutateJson<Record<string, unknown>>("/api/admin/trips", "POST", input);
  return mapTrip(payload);
}

export async function updateTrip(slug: string, input: Partial<TripInput>): Promise<Trip> {
  const payload = await mutateJson<Record<string, unknown>>(`/api/admin/trips/${slug}`, "PATCH", input);
  return mapTrip(payload);
}

export async function deleteTrip(slug: string): Promise<void> {
  await mutateJson<void>(`/api/admin/trips/${slug}`, "DELETE");
}
export type AdminUserInput = {
  email: string;
  name: string;
  password: string;
  role: import("@/lib/auth").AdminRole;
  is_active: boolean;
  group_ids: string[];
};

export type AdminUserUpdateInput = Partial<AdminUserInput>;

export async function createAdminUser(input: AdminUserInput): Promise<Record<string, unknown>> {
  return mutateJson<Record<string, unknown>>("/api/admin/users", "POST", input);
}

export async function updateAdminUser(userId: string, input: AdminUserUpdateInput): Promise<Record<string, unknown>> {
  return mutateJson<Record<string, unknown>>(`/api/admin/users/${userId}`, "PATCH", input);
}


export type AdminGroupInput = {
  name: string;
  slug?: string;
  description: string;
  member_ids: string[];
  status?: "active" | "archived";
};

export type AdminGroupUpdateInput = Partial<AdminGroupInput>;

export async function createAdminGroup(input: AdminGroupInput): Promise<Record<string, unknown>> {
  return mutateJson<Record<string, unknown>>("/api/admin/groups", "POST", input);
}

export async function updateAdminGroup(groupId: string, input: AdminGroupUpdateInput): Promise<Record<string, unknown>> {
  return mutateJson<Record<string, unknown>>(`/api/admin/groups/${groupId}`, "PATCH", input);
}

export async function deleteAdminGroup(groupId: string): Promise<void> {
  await mutateJson<void>(`/api/admin/groups/${groupId}`, "DELETE");
}

