import Image from "next/image";
import Link from "next/link";
import { PaginationNav } from "@/components/pagination-nav";
import type { TimelineFacets } from "@/lib/api";

export type TimelineItem =
  | {
      kind: "place";
      id: string;
      date: string;
      title: string;
      subtitle: string;
      summary: string;
      href: string;
      imageUrl: string;
      color: string;
      tags: string[];
      meta: string;
      tripId: string | null;
    }
  | {
      kind: "trip";
      id: string;
      date: string;
      title: string;
      subtitle: string;
      summary: string;
      href: string;
      imageUrl: string;
      color: string;
      tags: string[];
      meta: string;
      tripId: string;
    };

type TimelineViewProps = {
  items: TimelineItem[];
  filters: {
    q: string;
    kind: string;
    year: string;
    tag: string;
    trip: string;
  };
  facets: TimelineFacets;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
};

function formatMonthLabel(date: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(date));
}

export function TimelineView({ items, filters, facets, pagination }: TimelineViewProps) {
  let activeMonth = "";

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
        <section className="rounded-[30px] border border-line/70 bg-panel/70 p-6 shadow-panel md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-mint/75">timeline</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-cloud md:text-6xl">
                Read the archive as a sequence, not just a map.
              </h1>
              <p className="mt-4 text-base leading-7 text-cloud/72">
                The timeline now supports filtering by kind, year, tag, trip, and search, so chronology can be narrowed without losing the narrative view.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Back to map</Link>
              <Link href="/places" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Browse places</Link>
              <Link href="/trips" className="rounded-full bg-accentBrand px-4 py-2 font-semibold text-ink transition hover:opacity-90">Browse trips</Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-line/70 bg-panel/65 p-5 shadow-panel">
            <p className="text-xs uppercase tracking-[0.28em] text-mint/75">filters</p>
            <form action="/timeline" className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Search</span>
                <input name="q" defaultValue={filters.q} placeholder="title, summary, location, tag" className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Kind</span>
                <select name="kind" defaultValue={filters.kind} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  {facets.kinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Year</span>
                <select name="year" defaultValue={filters.year} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All years</option>
                  {facets.years.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Tag</span>
                <select name="tag" defaultValue={filters.tag} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All tags</option>
                  {facets.tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Trip</span>
                <select name="trip" defaultValue={filters.trip} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                  <option value="">All trips</option>
                  {facets.trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink">Apply</button>
                <Link href="/timeline" className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80">Reset</Link>
              </div>
            </form>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-line/70 bg-panel/65 p-6 shadow-panel md:p-8">
              <div className="grid gap-8 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-mint/70">coverage</p>
                  <div className="mt-3 text-4xl font-display font-extrabold text-cloud">{pagination.totalItems}</div>
                  <p className="mt-2 text-sm text-cloud/65">filtered timeline entries</p>
                </div>
                <div className="space-y-8">
                  {items.length === 0 ? (
                    <div className="rounded-[28px] border border-line/70 bg-ink/45 p-6 text-cloud/70">No timeline entries match the current filters.</div>
                  ) : items.map((item) => {
                    const monthLabel = formatMonthLabel(item.date);
                    const shouldRenderMonth = monthLabel !== activeMonth;
                    if (shouldRenderMonth) {
                      activeMonth = monthLabel;
                    }

                    return (
                      <div key={`${item.kind}-${item.id}`} className="space-y-4">
                        {shouldRenderMonth ? (
                          <div className="sticky top-4 z-10 inline-flex rounded-full border border-line/70 bg-ink/85 px-4 py-2 text-xs uppercase tracking-[0.28em] text-mint/78 backdrop-blur">
                            {monthLabel}
                          </div>
                        ) : null}
                        <article className="grid gap-4 rounded-[28px] border border-line/70 bg-ink/45 p-4 shadow-panel md:grid-cols-[260px_minmax(0,1fr)] md:p-5">
                          <div className="relative h-52 overflow-hidden rounded-[22px]">
                            <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
                            <div className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink" style={{ backgroundColor: item.color }}>
                              {item.kind}
                            </div>
                          </div>
                          <div className="flex flex-col justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.24em] text-mint/75">{item.subtitle}</p>
                              <h2 className="mt-2 font-display text-3xl font-bold text-cloud">{item.title}</h2>
                              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-cloud/55">{item.meta}</p>
                              <p className="mt-4 max-w-3xl text-sm leading-7 text-cloud/72">{item.summary}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <span key={tag} className="rounded-full border border-line bg-panel/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-mint/78">{tag}</span>
                                ))}
                              </div>
                              <Link href={item.href} className="ml-auto rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink">
                                Open {item.kind}
                              </Link>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <PaginationNav
              basePath="/timeline"
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              itemLabel="timeline entries"
              params={{
                q: filters.q || undefined,
                kind: filters.kind !== "all" ? filters.kind : undefined,
                year: filters.year || undefined,
                tag: filters.tag || undefined,
                trip: filters.trip || undefined
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}