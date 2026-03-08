import Link from "next/link";
import { PlaceForm } from "@/components/admin/place-form";
import { PaginationNav } from "@/components/pagination-nav";
import { getAdminBootstrapData, getAdminGroups, getAdminPlaceBySlug, getAdminPlacesPage, getAdminTripsPage, requireAdminSession } from "@/lib/admin-server";

type PlaceListFilters = {
  q?: string;
  status?: string;
  trip?: string;
  assignment?: string;
  page?: number;
};

const PAGE_SIZE = 12;

function normalizeFilter(value: string | undefined): string {
  return value?.trim() ?? "";
}

export async function PlaceListPage({ filters = {} }: { filters?: PlaceListFilters }) {
  const statusFilter = normalizeFilter(filters.status);
  const tripFilter = normalizeFilter(filters.trip);
  const assignmentFilter = normalizeFilter(filters.assignment);
  const currentPage = Math.max(filters.page ?? 1, 1);

  const [pageResult, tripOptions, session] = await Promise.all([
    getAdminPlacesPage({
      q: filters.q,
      status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
      tripId: tripFilter && tripFilter !== "all" ? tripFilter : undefined,
      assignment: assignmentFilter && assignmentFilter !== "all" ? assignmentFilter : undefined,
      page: currentPage,
      pageSize: PAGE_SIZE
    }),
    getAdminTripsPage({ page: 1, pageSize: 100 }),
    requireAdminSession()
  ]);

  const canEdit = session.user.role !== "viewer";

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between gap-4 rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mint/70">places</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Manage places</h2>
          <p className="mt-3 text-sm text-cloud/70">{pageResult.total} matched</p>
        </div>
        {canEdit ? <Link href="/admin/places/new" className="rounded-full bg-accentBrand px-4 py-3 text-sm font-semibold text-ink">New place</Link> : null}
      </div>

      <form className="grid gap-3 rounded-[28px] border border-line/60 bg-panel/70 p-5 shadow-panel md:grid-cols-4" method="get">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Search</span>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Title, city, country, tag" className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Status</span>
          <select name="status" defaultValue={statusFilter || "all"} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="all">All statuses</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="hidden">hidden</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Assignment</span>
          <select name="assignment" defaultValue={assignmentFilter || "all"} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="all">All places</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <label className="block md:col-span-3">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Trip</span>
          <select name="trip" defaultValue={tripFilter || "all"} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="all">All trips</option>
            {tripOptions.items.map((trip) => (
              <option key={trip.id} value={trip.id}>{trip.title}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3 md:justify-end">
          <button type="submit" className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/85">Apply filters</button>
          <Link href="/admin/places" className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/65">Reset</Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-line/60 bg-panel/70 shadow-panel">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-ink/40 text-left text-cloud/60"><tr><th className="px-5 py-4">Title</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Location</th><th className="px-5 py-4">Trip</th><th className="px-5 py-4">{canEdit ? "Edit" : "View"}</th></tr></thead>
          <tbody>
            {pageResult.items.map((place) => {
              const trip = tripOptions.items.find((entry) => entry.id === place.tripId);
              return (
                <tr key={place.id} className="border-t border-line/40">
                  <td className="px-5 py-4 font-semibold text-cloud">{place.title}</td>
                  <td className="px-5 py-4 text-cloud/75">{place.status}</td>
                  <td className="px-5 py-4 text-cloud/75">{place.city}, {place.country}</td>
                  <td className="px-5 py-4 text-cloud/75">{trip?.title ?? "Unassigned"}</td>
                  <td className="px-5 py-4"><Link href={`/admin/places/${place.slug}`} className="text-mint">{canEdit ? "Edit" : "View"}</Link></td>
                </tr>
              );
            })}
            {pageResult.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-cloud/60">No places match the current filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <PaginationNav
        basePath="/admin/places"
        currentPage={pageResult.page}
        totalPages={Math.max(1, Math.ceil(pageResult.total / pageResult.pageSize))}
        totalItems={pageResult.total}
        pageSize={pageResult.pageSize}
        itemLabel="places"
        params={{
          q: filters.q,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          assignment: assignmentFilter && assignmentFilter !== "all" ? assignmentFilter : undefined,
          trip: tripFilter && tripFilter !== "all" ? tripFilter : undefined
        }}
      />
    </main>
  );
}

export async function PlaceCreatePage() {
  const [data, groups] = await Promise.all([getAdminBootstrapData(), getAdminGroups()]);
  return <PlaceForm trips={data.trips} availablePlaces={data.places} groups={groups} />;
}

export async function PlaceEditPage({ slug }: { slug: string }) {
  const [data, place, groups] = await Promise.all([getAdminBootstrapData(), getAdminPlaceBySlug(slug), getAdminGroups()]);
  if (!place) throw new Error("Place not found");
  return <PlaceForm trips={data.trips} availablePlaces={data.places} groups={groups} initialPlace={place} />;
}
