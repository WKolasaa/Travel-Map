import { PlaceListPage } from "@/components/admin/place-pages";

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") {
    return 1;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function AdminPlacesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return <PlaceListPage filters={{
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    trip: typeof params.trip === "string" ? params.trip : undefined,
    assignment: typeof params.assignment === "string" ? params.assignment : undefined,
    page: parsePage(params.page)
  }} />;
}