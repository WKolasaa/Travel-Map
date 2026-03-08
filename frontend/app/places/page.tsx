import { PlacesBrowseView } from "@/components/browse/places-browse-view";
import { getPlaceFacets, getPlacesPage, getTrips } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

type PlacesPageProps = {
  searchParams?: Promise<{
    q?: string;
    trip?: string;
    country?: string;
    tag?: string;
    page?: string;
  }>;
};

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = parsePage(params.page);
  const filters = {
    q: params.q ?? "",
    tripId: params.trip ?? "",
    country: params.country ?? "",
    tag: params.tag ?? ""
  };
  const session = await getAdminSession();
  const token = session?.token;

  const [pageResult, facets, trips] = await Promise.all([
    getPlacesPage({ ...filters, page: currentPage, pageSize: PAGE_SIZE, token }),
    getPlaceFacets({ ...filters, token }),
    getTrips({ token })
  ]);

  return (
    <PlacesBrowseView
      places={pageResult.items}
      trips={trips}
      filters={filters}
      filterOptions={facets}
      pagination={{
        currentPage: pageResult.page,
        totalPages: Math.max(1, Math.ceil(pageResult.total / pageResult.pageSize)),
        totalItems: pageResult.total,
        pageSize: pageResult.pageSize
      }}
    />
  );
}
