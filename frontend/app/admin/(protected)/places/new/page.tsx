import { PlaceCreatePage } from "@/components/admin/place-pages";
import { requireMinimumRole } from "@/lib/admin-server";

export default async function AdminPlaceCreatePage() {
  await requireMinimumRole("editor");
  return <PlaceCreatePage />;
}
