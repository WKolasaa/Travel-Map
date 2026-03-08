import Image from "next/image";
import Link from "next/link";
import type { Place } from "@/lib/types";

type PlaceListProps = {
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function PlaceList({ places, selectedId, onSelect }: PlaceListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line/60 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.3em] text-mint/70">visible places</p>
        <p className="mt-1 text-sm text-cloud/70">{places.length} markers in current view</p>
      </div>
      <div className="max-h-[620px] overflow-y-auto p-3">
        <div className="space-y-3">
          {places.map((place) => {
            const isActive = place.id === selectedId;

            return (
              <div
                key={place.id}
                className={`rounded-3xl border p-3 transition ${
                  isActive
                    ? "border-accentBrand/60 bg-accentBrand/10"
                    : "border-line/60 bg-panel/60 hover:border-mint/40 hover:bg-panelSoft/70"
                }`}
              >
                <button type="button" onClick={() => onSelect(place.id)} className="flex w-full gap-3 text-left">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    <Image src={place.imageUrl} alt={place.title} fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-cloud">{place.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-mint/70">
                      {place.city}, {place.country}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-cloud/70">{place.summary}</p>
                  </div>
                </button>
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/places/${place.slug}`}
                    className="rounded-full border border-line/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cloud/75 transition hover:border-accentBrand hover:text-cloud"
                  >
                    open place
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}