import Image from "next/image";
import Link from "next/link";
import { formatDateRange } from "@/lib/format";
import type { Place, Trip } from "@/lib/types";

type PlacePreviewCardProps = {
  place: Place;
  trip: Trip | null;
  onClose: () => void;
};

export function PlacePreviewCard({ place, trip, onClose }: PlacePreviewCardProps) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-line/70 bg-ink/85 shadow-panel backdrop-blur">
      <div className="relative h-44 w-full">
        <Image src={place.imageUrl} alt={place.title} fill className="object-cover" unoptimized />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-white/25 bg-ink/70 px-3 py-1 text-sm font-semibold text-cloud transition hover:border-white/50"
          aria-label="Close place card"
        >
          X
        </button>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accentSoft">
              {place.city}, {place.country}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-cloud">{place.title}</h2>
          </div>
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: place.markerColor }}
            aria-hidden
          />
        </div>
        <p className="text-sm uppercase tracking-[0.24em] text-cloud/55">
          {formatDateRange(place.startDate, place.endDate)}
        </p>
        <p className="text-sm leading-6 text-cloud/75">{place.summary}</p>
        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line bg-panel px-3 py-1 text-xs uppercase tracking-[0.18em] text-mint/80"
            >
              {tag}
            </span>
          ))}
        </div>
        {trip ? (
          <div className="rounded-2xl border border-line/70 bg-panel/70 px-3 py-3 text-sm text-cloud/75">
            Part of <span className="font-semibold text-cloud">{trip.title}</span>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Link href={`/places/${place.slug}`} className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink transition hover:opacity-90">
            View place
          </Link>
          {trip ? (
            <Link href={`/trips/${trip.slug}`} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 transition hover:border-mint/60">
              Open trip
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
