import Image from "next/image";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import type { Trip } from "@/lib/types";

type TripDetailViewProps = {
  trip: Trip;
};

export function TripDetailView({ trip }: TripDetailViewProps) {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-[1300px] flex-col gap-6">
        <div className="flex flex-wrap gap-3 text-sm uppercase tracking-[0.28em] text-mint/80">
          <Link href="/" className="transition hover:text-cloud">back to map</Link>
          <Link href="/places" className="transition hover:text-cloud">browse places</Link>
          <Link href="/trips" className="transition hover:text-cloud">browse trips</Link>
          <Link href="/timeline" className="transition hover:text-cloud">timeline</Link>
        </div>

        <section className="relative overflow-hidden rounded-[30px] border border-line/70 bg-panel/70 shadow-panel">
          <div className="absolute inset-0">
            <Image src={trip.coverImageUrl} alt={trip.title} fill className="object-cover opacity-30" unoptimized />
          </div>
          <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">trip route</p>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-cloud md:text-6xl">
                {trip.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-cloud/80">{trip.description}</p>
            </div>
            <div className="rounded-[28px] border border-line/70 bg-ink/65 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-mint/70">range</p>
              <p className="mt-2 text-lg text-cloud">{formatDateRange(trip.startDate, trip.endDate)}</p>
              <p className="mt-5 text-xs uppercase tracking-[0.24em] text-mint/70">tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {trip.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-panel px-3 py-1 text-xs uppercase tracking-[0.18em] text-mint/80">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-line/70 bg-panel/65 p-6 shadow-panel">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-mint/70">places in route</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-cloud">Ordered stops</h2>
            </div>
            <div className="text-sm text-cloud/60">{trip.places?.length ?? 0} places</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {(trip.places ?? []).map((place, index) => (
              <Link
                key={place.id}
                href={`/places/${place.slug}`}
                className="group overflow-hidden rounded-[24px] border border-line/70 bg-ink/55 transition hover:border-mint/50"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image src={place.imageUrl} alt={place.title} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-cloud/55">stop {index + 1}</div>
                  <div className="mt-2 text-xl font-semibold text-cloud">{place.title}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.22em] text-mint/75">
                    {place.city}, {place.country}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-cloud/70">{place.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}