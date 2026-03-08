import Link from "next/link";
import { TripForm } from "@/components/admin/trip-form";
import { PaginationNav } from "@/components/pagination-nav";
import { getAdminBootstrapData, getAdminGroups, getAdminTripBySlug, getAdminTripsPage, requireAdminSession } from "@/lib/admin-server";

type TripListFilters = {
  q?: string;
  status?: string;
  route?: string;
  page?: number;
};

const PAGE_SIZE = 12;

function normalizeFilter(value: string | undefined): string {
  return value?.trim() ?? "";
}

export async function TripListPage({ filters = {} }: { filters?: TripListFilters }) {
  const statusFilter = normalizeFilter(filters.status);
  const routeFilter = normalizeFilter(filters.route);
  const currentPage = Math.max(filters.page ?? 1, 1);

  const [pageResult, session] = await Promise.all([
    getAdminTripsPage({
      q: filters.q,
      status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
      route: routeFilter && routeFilter !== "all" ? routeFilter : undefined,
      page: currentPage,
      pageSize: PAGE_SIZE
    }),
    requireAdminSession()
  ]);

  const canEdit = session.user.role !== "viewer";

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between gap-4 rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-mint/70">trips</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Manage trips</h2>
          <p className="mt-3 text-sm text-cloud/70">{pageResult.total} matched</p>
        </div>
        {canEdit ? <Link href="/admin/trips/new" className="rounded-full bg-accentBrand px-4 py-3 text-sm font-semibold text-ink">New trip</Link> : null}
      </div>

      <form className="grid gap-3 rounded-[28px] border border-line/60 bg-panel/70 p-5 shadow-panel md:grid-cols-3" method="get">
        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Search</span>
          <input name="q" defaultValue={filters.q ?? ""} placeholder="Title, summary, tag" className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
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
        <label className="block md:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Route mode</span>
          <select name="route" defaultValue={routeFilter || "all"} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
            <option value="all">All trips</option>
            <option value="enabled">Route enabled</option>
            <option value="disabled">Route disabled</option>
          </select>
        </label>
        <div className="flex items-end gap-3 md:justify-end">
          <button type="submit" className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/85">Apply filters</button>
          <Link href="/admin/trips" className="rounded-full border border-line/70 px-4 py-3 text-sm font-semibold text-cloud/65">Reset</Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-[28px] border border-line/60 bg-panel/70 shadow-panel">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-ink/40 text-left text-cloud/60"><tr><th className="px-5 py-4">Title</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Dates</th><th className="px-5 py-4">Tags</th><th className="px-5 py-4">{canEdit ? "Edit" : "View"}</th></tr></thead>
          <tbody>
            {pageResult.items.map((trip) => (
              <tr key={trip.id} className="border-t border-line/40">
                <td className="px-5 py-4 font-semibold text-cloud">{trip.title}</td>
                <td className="px-5 py-4 text-cloud/75">{trip.status}</td>
                <td className="px-5 py-4 text-cloud/75">{trip.startDate} to {trip.endDate}</td>
                <td className="px-5 py-4 text-cloud/75">{trip.tags.join(", ")}</td>
                <td className="px-5 py-4"><Link href={`/admin/trips/${trip.slug}`} className="text-mint">{canEdit ? "Edit" : "View"}</Link></td>
              </tr>
            ))}
            {pageResult.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-cloud/60">No trips match the current filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <PaginationNav
        basePath="/admin/trips"
        currentPage={pageResult.page}
        totalPages={Math.max(1, Math.ceil(pageResult.total / pageResult.pageSize))}
        totalItems={pageResult.total}
        pageSize={pageResult.pageSize}
        itemLabel="trips"
        params={{
          q: filters.q,
          status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
          route: routeFilter && routeFilter !== "all" ? routeFilter : undefined
        }}
      />
    </main>
  );
}

export async function TripCreatePage() {
  const groups = await getAdminGroups();
  return <TripForm groups={groups} />;
}

export async function TripEditPage({ slug }: { slug: string }) {
  const [trip, data, groups] = await Promise.all([getAdminTripBySlug(slug), getAdminBootstrapData(), getAdminGroups()]);

  if (!trip) {
    throw new Error("Trip not found");
  }

  return <TripForm initialTrip={trip} availablePlaces={data.places} groups={groups} />;
}
