import { TripEditPage } from "@/components/admin/trip-pages";
import { requireMinimumRole } from "@/lib/admin-server";

export default async function AdminTripEditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireMinimumRole("editor");
  const { slug } = await params;
  return <TripEditPage slug={slug} />;
}
