import { TripsBrowseView } from "@/components/browse/trips-browse-view";
import { getTripFacets, getTripsPage } from "@/lib/api";
import { getAdminSession } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

type TripsPageProps = {
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    year?: string;
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

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = (await searchParams) ?? {};
  const currentPage = parsePage(params.page);
  const filters = {
    q: params.q ?? "",
    tag: params.tag ?? "",
    year: params.year ?? ""
  };
  const session = await getAdminSession();
  const token = session?.token;

  const [pageResult, facets] = await Promise.all([
    getTripsPage({
      q: filters.q || undefined,
      tag: filters.tag || undefined,
      year: filters.year ? Number(filters.year) : undefined,
      page: currentPage,
      pageSize: PAGE_SIZE,
      token,
    }),
    getTripFacets({
      q: filters.q || undefined,
      tag: filters.tag || undefined,
      year: filters.year ? Number(filters.year) : undefined,
      token,
    })
  ]);

  return (
    <TripsBrowseView
      trips={pageResult.items}
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
