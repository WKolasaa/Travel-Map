import { TripListPage } from "@/components/admin/trip-pages";

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

export default async function AdminTripsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;

  return <TripListPage filters={{
    q: typeof params.q === "string" ? params.q : undefined,
    status: typeof params.status === "string" ? params.status : undefined,
    route: typeof params.route === "string" ? params.route : undefined,
    page: parsePage(params.page)
  }} />;
}