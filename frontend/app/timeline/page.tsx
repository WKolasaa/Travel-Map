import { TimelineView, type TimelineItem } from "@/components/browse/timeline-view";
import { getPlaces, getTimelineFacets, getTrips } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";
import type { Place, Trip } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type TimelineSearchParams = {
  page?: string;
  q?: string;
  kind?: string;
  year?: string;
  tag?: string;
  trip?: string;
};

type TimelinePageProps = {
  searchParams?: Promise<TimelineSearchParams>;
};

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

function buildTimelineItems(places: Place[], trips: Trip[]): TimelineItem[] {
  const tripItems: TimelineItem[] = trips.map((trip) => ({
    kind: "trip",
    id: trip.id,
    date: trip.startDate,
    title: trip.title,
    subtitle: `${trip.startDate} -> ${trip.endDate}`,
    summary: trip.summary,
    href: `/trips/${trip.slug}`,
    imageUrl: trip.coverImageUrl,
    color: trip.color,
    tags: trip.tags,
    meta: trip.routeEnabled ? "Route enabled" : "Trip overview",
    tripId: trip.id,
  }));

  const placeItems: TimelineItem[] = places.map((place) => ({
    kind: "place",
    id: place.id,
    date: place.startDate,
    title: place.title,
    subtitle: `${place.city}, ${place.country}`,
    summary: place.summary,
    href: `/places/${place.slug}`,
    imageUrl: place.imageUrl,
    color: place.markerColor,
    tags: place.tags,
    meta: place.companions.length > 0 ? `With ${place.companions.join(", ")}` : "Solo memory",
    tripId: place.tripId,
  }));

  return [...tripItems, ...placeItems].sort((left, right) => {
    return new Date(right.date).getTime() - new Date(left.date).getTime();
  });
}

function matchesQuery(item: TimelineItem, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [item.title, item.subtitle, item.summary, item.meta, ...item.tags]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const params = (await searchParams) ?? {};
  const filters = {
    q: params.q?.trim() ?? "",
    kind: params.kind === "place" || params.kind === "trip" ? params.kind : "all",
    year: params.year?.trim() ?? "",
    tag: params.tag?.trim() ?? "",
    trip: params.trip?.trim() ?? "",
  };
  const session = await getAdminSession();
  const token = session?.token;

  const [places, trips, facets] = await Promise.all([
    getPlaces({ token }),
    getTrips({ token }),
    getTimelineFacets(token),
  ]);

  const filteredItems = buildTimelineItems(places, trips).filter((item) => {
    if (filters.kind !== "all" && item.kind !== filters.kind) {
      return false;
    }
    if (filters.year && !item.date.startsWith(filters.year)) {
      return false;
    }
    if (filters.tag && !item.tags.some((tag) => tag.toLowerCase() === filters.tag.toLowerCase())) {
      return false;
    }
    if (filters.trip && item.tripId !== filters.trip) {
      return false;
    }
    if (!matchesQuery(item, filters.q)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(parsePage(params.page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const items = filteredItems.slice(start, start + PAGE_SIZE);

  return (
    <TimelineView
      items={items}
      filters={filters}
      facets={facets}
      pagination={{
        currentPage,
        totalPages,
        totalItems: filteredItems.length,
        pageSize: PAGE_SIZE,
      }}
    />
  );
}
