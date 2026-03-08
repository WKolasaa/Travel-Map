import Image from "next/image";
import Link from "next/link";
import { PaginationNav } from "@/components/pagination-nav";
import { formatDateRange } from "@/lib/format";
import type { Place, Trip } from "@/lib/types";

type PlacesBrowseViewProps = {
  places: Place[];
  trips: Trip[];
  filters: {
    q: string;
    tripId: string;
    country: string;
    tag: string;
  };
  filterOptions: {
    countries: string[];
    tags: string[];
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
};

export function PlacesBrowseView({ places, trips, filters, filterOptions, pagination }: PlacesBrowseViewProps) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <section className="rounded-[30px] border border-line/70 bg-panel/70 p-6 shadow-panel md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-mint/75">browse places</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-cloud md:text-6xl">
                Search the archive by city, route, country, or tag.
              </h1>
              <p className="mt-4 text-base leading-7 text-cloud/72">
                This view is powered by backend filters, so query states can be shared directly and scaled beyond the in-browser map shell.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Back to map</Link>
              <Link href="/trips" className="rounded-full bg-accentBrand px-4 py-2 font-semibold text-ink transition hover:opacity-90">Browse trips</Link>
              <Link href="/timeline" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Timeline</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-line/70 bg-panel/65 p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.28em] text-mint/75">filters</p>
            <form action="/places" className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Search</span>
                <input name="q" defaultValue={filters.q} placeholder="city, country, title, tag" className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Trip</span>
                <select name="trip" defaultValue={filters.tripId} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All trips</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Country</span>
                <select name="country" defaultValue={filters.country} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All countries</option>
                  {filterOptions.countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Tag</span>
                <select name="tag" defaultValue={filters.tag} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All tags</option>
                  {filterOptions.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink">Apply</button>
                <Link href="/places" className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80">Reset</Link>
              </div>
            </form>
          </aside>

          <div className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4 rounded-[28px] border border-line/70 bg-panel/65 px-5 py-4 shadow-panel">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-mint/70">results</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-cloud">{pagination.totalItems} places</h2>
              </div>
              <p className="max-w-xl text-sm text-cloud/65">
                Filters are applied server-side. Share this URL to keep the same discovery state.
              </p>
            </div>

            {places.length === 0 ? (
              <div className="rounded-[28px] border border-line/70 bg-panel/65 p-8 text-cloud/70 shadow-panel">
                No places match the current filters.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {places.map((place) => {
                  const trip = trips.find((entry) => entry.id === place.tripId) ?? null;
                  return (
                    <article key={place.id} className="overflow-hidden rounded-[26px] border border-line/70 bg-panel/65 shadow-panel">
                      <div className="relative h-56">
                        <Image src={place.imageUrl} alt={place.title} fill className="object-cover" unoptimized />
                      </div>
                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-mint/75">{place.city}, {place.country}</p>
                            <h3 className="mt-2 font-display text-2xl font-bold text-cloud">{place.title}</h3>
                          </div>
                          <div className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: place.markerColor }} aria-hidden />
                        </div>
                        <p className="text-sm uppercase tracking-[0.18em] text-cloud/55">{formatDateRange(place.startDate, place.endDate)}</p>
                        <p className="text-sm leading-6 text-cloud/72">{place.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {place.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-line bg-ink/55 px-3 py-1 text-xs uppercase tracking-[0.18em] text-mint/78">{tag}</span>
                          ))}
                        </div>
                        {trip ? <p className="text-sm text-cloud/60">Part of <span className="font-semibold text-cloud">{trip.title}</span></p> : null}
                        <div className="flex gap-3 pt-2">
                          <Link href={`/places/${place.slug}`} className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink">Open place</Link>
                          {trip ? <Link href={`/trips/${trip.slug}`} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80">Trip</Link> : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <PaginationNav
              basePath="/places"
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              itemLabel="places"
              params={{
                q: filters.q || undefined,
                trip: filters.tripId || undefined,
                country: filters.country || undefined,
                tag: filters.tag || undefined
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}