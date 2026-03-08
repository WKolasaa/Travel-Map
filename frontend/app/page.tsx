import { TravelMapShell } from "@/components/travel-map-shell";
import { getPlaces, getTrips } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string;
    trip?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};
  const filters = {
    q: params.q ?? "",
    tripId: params.trip ?? ""
  };
  const session = await getAdminSession();
  const token = session?.token;

  const [places, trips] = await Promise.all([
    getPlaces({
      q: filters.q || undefined,
      tripId: filters.tripId || undefined,
      token,
    }),
    getTrips({ token })
  ]);

  return (
    <TravelMapShell
      places={places}
      trips={trips}
      initialQuery={filters.q}
      initialTripId={filters.tripId}
      currentUser={session?.user ?? null}
    />
  );
}
