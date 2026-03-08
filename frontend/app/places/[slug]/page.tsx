import { notFound } from "next/navigation";
import { PlaceDetailView } from "@/components/detail/place-detail-view";
import { getBootstrapData, getPlaceBySlug, getRelatedPlaces } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAdminSession();
  const token = session?.token;
  const [place, relatedPlaces, bootstrap] = await Promise.all([
    getPlaceBySlug(slug, token),
    getRelatedPlaces(slug, token),
    getBootstrapData(token)
  ]);

  if (!place) {
    notFound();
  }

  const trip = bootstrap.trips.find((entry) => entry.id === place.tripId) ?? null;

  return <PlaceDetailView place={place} trip={trip} relatedPlaces={relatedPlaces} />;
}
