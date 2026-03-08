import { notFound } from "next/navigation";
import { TripDetailView } from "@/components/detail/trip-detail-view";
import { getTripBySlug } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getAdminSession();
  const trip = await getTripBySlug(slug, session?.token);

  if (!trip) {
    notFound();
  }

  return <TripDetailView trip={trip} />;
}
