import { TripCreatePage } from "@/components/admin/trip-pages";
import { requireMinimumRole } from "@/lib/admin-server";

export default async function AdminTripCreatePage() {
  await requireMinimumRole("editor");
  return <TripCreatePage />;
}
