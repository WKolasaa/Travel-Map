import Image from "next/image";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import type { Place, Trip } from "@/lib/types";

type PlaceDetailViewProps = {
  place: Place;
  trip: Trip | null;
  relatedPlaces: Place[];
};

export function PlaceDetailView({ place, trip, relatedPlaces }: PlaceDetailViewProps) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-[1300px] flex-col gap-6">
        <div className="flex flex-wrap gap-3 text-sm uppercase tracking-[0.28em] text-mint/80">
          <Link href="/" className="transition hover:text-cloud">back to map</Link>
          <Link href="/places" className="transition hover:text-cloud">browse places</Link>
          <Link href="/trips" className="transition hover:text-cloud">browse trips</Link>
          <Link href="/timeline" className="transition hover:text-cloud">timeline</Link>
        </div>

        <section className="grid overflow-hidden rounded-[30px] border border-line/70 bg-panel/70 shadow-panel lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[360px]">
            <Image src={place.imageUrl} alt={place.title} fill className="object-cover" unoptimized />
          </div>
          <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
                {place.city}, {place.country}
              </p>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-cloud md:text-5xl">
                {place.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-cloud/75">{place.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-line/70 bg-ink/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-mint/70">dates</p>
                <p className="mt-2 text-lg text-cloud">{formatDateRange(place.startDate, place.endDate)}</p>
              </div>
              <div className="rounded-3xl border border-line/70 bg-ink/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-mint/70">coordinates</p>
                <p className="mt-2 text-lg text-cloud">
                  {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                </p>
              </div>
              <div className="rounded-3xl border border-line/70 bg-ink/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-mint/70">companions</p>
                <p className="mt-2 text-lg text-cloud">{place.companions.join(", ")}</p>
              </div>
              <div className="rounded-3xl border border-line/70 bg-ink/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-mint/70">rating</p>
                <p className="mt-2 text-lg text-cloud">{place.rating}/5</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-[28px] border border-line/70 bg-panel/65 p-6 shadow-panel">
            <div className="flex flex-wrap gap-2">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line bg-ink/60 px-3 py-1 text-xs uppercase tracking-[0.18em] text-mint/80"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {place.gallery.map((image, index) => (
                <div key={image} className="relative h-56 overflow-hidden rounded-[24px] border border-line/70">
                  <Image src={image} alt={`${place.title} gallery image ${index + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            {trip ? (
              <div className="rounded-[28px] border border-line/70 bg-panel/65 p-5 shadow-panel">
                <p className="text-xs uppercase tracking-[0.28em] text-mint/75">trip</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-cloud">{trip.title}</h2>
                <p className="mt-3 text-sm leading-6 text-cloud/75">{trip.summary}</p>
                <Link href={`/trips/${trip.slug}`} className="mt-4 inline-flex rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink">
                  Open trip
                </Link>
              </div>
            ) : null}
            <div className="rounded-[28px] border border-line/70 bg-panel/65 p-5 shadow-panel">
              <p className="text-xs uppercase tracking-[0.28em] text-mint/75">related places</p>
              <div className="mt-4 space-y-3">
                {relatedPlaces.map((related) => (
                  <Link
                    key={related.id}
                    href={`/places/${related.slug}`}
                    className="block rounded-2xl border border-line/60 bg-ink/50 px-4 py-3 transition hover:border-mint/50"
                  >
                    <div className="text-sm font-semibold text-cloud">{related.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.22em] text-cloud/55">
                      {related.city}, {related.country}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}