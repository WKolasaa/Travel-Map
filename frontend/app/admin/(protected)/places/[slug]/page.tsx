import { PlaceEditPage } from "@/components/admin/place-pages";
import { requireMinimumRole } from "@/lib/admin-server";

export default async function AdminPlaceEditPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireMinimumRole("editor");
  const { slug } = await params;
  return <PlaceEditPage slug={slug} />;
}
