"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { PlaceList } from "@/components/place-list";
import { PlacePreviewCard } from "@/components/place-preview-card";
import { TravelMapStage } from "@/components/travel-map-stage";
import type { AdminUser } from "@/lib/auth";
import type { Place, Trip } from "@/lib/types";

type TravelMapShellProps = {
  places: Place[];
  trips: Trip[];
  initialQuery?: string;
  initialTripId?: string;
  currentUser?: AdminUser | null;
};

export function TravelMapShell({ places, trips, initialQuery = "", initialTripId = "", currentUser = null }: TravelMapShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [activeTripId, setActiveTripId] = useState<string>(initialTripId || "all");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveTripId(initialTripId || "all");
  }, [initialTripId]);

  useEffect(() => {
    setSelectedId((current) => {
      if (current && places.some((place) => place.id === current)) {
        return current;
      }
      return null;
    });
  }, [places]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (cardRef.current?.contains(target)) {
        return;
      }
      if (target.closest("[data-map-marker='true']")) {
        return;
      }
      setSelectedId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [selectedId]);

  function pushFilters(nextQuery: string, nextTripId: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    const normalizedQuery = nextQuery.trim();

    if (normalizedQuery) {
      nextParams.set("q", normalizedQuery);
    } else {
      nextParams.delete("q");
    }

    if (nextTripId && nextTripId !== "all") {
      nextParams.set("trip", nextTripId);
    } else {
      nextParams.delete("trip");
    }

    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  const selectedPlace = useMemo(() => {
    return places.find((place) => place.id === selectedId) ?? null;
  }, [places, selectedId]);

  const canManage = currentUser?.role === "editor" || currentUser?.role === "admin";

  return (
    <main className="min-h-screen px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <section className="overflow-hidden rounded-[28px] border border-line/60 bg-panel/70 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-5 border-b border-line/60 px-5 py-5 md:px-8 md:py-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="mb-2 text-xs uppercase tracking-[0.35em] text-mint/80">
                  map-first archive
                </p>
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-cloud md:text-6xl">
                  Travel memories arranged by place, not folders.
                </h1>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                {currentUser ? (
                  <>
                    <div className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80">
                      {currentUser.name} | {currentUser.role}
                    </div>
                    {canManage ? (
                      <Link href="/admin" className="rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-sm text-mint transition hover:border-mint/70">
                        Manage content
                      </Link>
                    ) : null}
                    <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 transition hover:border-mint/60 disabled:opacity-50">
                      {isLoggingOut ? "Logging out..." : "Log out"}
                    </button>
                  </>
                ) : (
                  <Link href="/admin/login" className="rounded-full border border-mint/40 bg-mint/10 px-4 py-2 text-sm text-mint transition hover:border-mint/70">
                    Log in
                  </Link>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/places" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Browse places</Link>
              <Link href="/trips" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Browse trips</Link>
              <Link href="/timeline" className="rounded-full border border-line/70 px-4 py-2 text-cloud/80 transition hover:border-mint/60">Timeline</Link>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  pushFilters(nextQuery, activeTripId);
                }}
                placeholder="Search places, cities, countries, trips, tags"
                className="h-12 rounded-2xl border border-line bg-ink/70 px-4 text-sm text-cloud outline-none transition focus:border-accentBrand"
              />
              <select
                value={activeTripId}
                onChange={(event) => {
                  const nextTripId = event.target.value;
                  setActiveTripId(nextTripId);
                  pushFilters(query, nextTripId);
                }}
                className="h-12 rounded-2xl border border-line bg-ink/70 px-4 text-sm text-cloud outline-none transition focus:border-accentBrand"
              >
                <option value="all">All trips</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs uppercase tracking-[0.22em] text-cloud/45">
              {isNavigating ? "Refreshing filtered map..." : `${places.length} places in current result set`}
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[380px_minmax(0,1fr)]">
            <aside className="border-r border-line/60 bg-ink/55">
              <PlaceList
                places={places}
                selectedId={selectedPlace?.id ?? null}
                onSelect={setSelectedId}
              />
            </aside>
            <div className="relative min-h-[620px]">
              <TravelMapStage
                places={places}
                trips={trips}
                selectedId={selectedPlace?.id ?? null}
                onSelect={setSelectedId}
              />
              {selectedPlace ? (
                <div className="pointer-events-none absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[360px]">
                  <div ref={cardRef} className="pointer-events-auto">
                    <PlacePreviewCard
                      place={selectedPlace}
                      trip={trips.find((trip) => trip.id === selectedPlace.tripId) ?? null}
                      onClose={() => setSelectedId(null)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
