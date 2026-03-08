"use client";

import { useMemo } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
} from "@/components/ui/map";
import { getMapcnStyles, hasMapcnStyleOverride } from "@/lib/mapcn";
import type { Place, Trip } from "@/lib/types";

type TravelMapStageProps = {
  places: Place[];
  trips: Trip[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function buildRouteCoordinates(places: Place[], tripId: string) {
  return places
    .filter((place) => place.tripId === tripId)
    .sort((left, right) => left.tripOrder - right.tripOrder)
    .map((place) => [place.longitude, place.latitude] as [number, number]);
}

export function TravelMapStage({ places, trips, selectedId, onSelect }: TravelMapStageProps) {
  const styles = getMapcnStyles();
  const activeTripId = places.find((place) => place.id === selectedId)?.tripId;
  const tripRoutes = useMemo(() => {
    return trips
      .map((trip) => ({
        trip,
        coordinates: buildRouteCoordinates(places, trip.id)
      }))
      .filter((entry) => entry.coordinates.length > 1);
  }, [places, trips]);

  return (
    <div className="relative h-full min-h-[620px] overflow-hidden bg-ink">
      <Map
        className="h-full min-h-[620px] w-full"
        projection={{ type: "globe" }}
        center={[36, 34]}
        zoom={1.55}
        minZoom={1.2}
        maxZoom={14}
        dragRotate={false}
        touchPitch={false}
        styles={styles}
      >
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          showFullscreen
          className="bottom-5 right-5"
        />

        {tripRoutes.map(({ trip, coordinates }) => (
          <MapRoute
            key={trip.id}
            id={trip.id}
            coordinates={coordinates}
            color={trip.color}
            width={activeTripId === trip.id ? 4 : 2.5}
            opacity={0.82}
            dashArray={[2, 2]}
          />
        ))}

        {places.map((place) => {
          const isActive = place.id === selectedId;

          return (
            <MapMarker
              key={place.id}
              longitude={place.longitude}
              latitude={place.latitude}
              onClick={() => onSelect(place.id)}
            >
              <MarkerContent>
                <div data-map-marker="true" className="relative flex flex-col items-center">
                  <div
                    className="rounded-full border-2 border-white/90 shadow-[0_0_0_6px_rgba(8,17,24,0.24)] transition-all"
                    style={{
                      width: isActive ? 22 : 16,
                      height: isActive ? 22 : 16,
                      backgroundColor: place.markerColor
                    }}
                  />
                  <div className="mt-1 h-3 w-[2px] rounded-full bg-white/65" aria-hidden />
                </div>
              </MarkerContent>
              <MarkerTooltip className="border border-line/60 bg-ink/90 px-3 py-2 text-cloud">
                <div className="text-xs uppercase tracking-[0.24em] text-mint/80">
                  {place.city}, {place.country}
                </div>
                <div className="mt-1 text-sm font-semibold text-cloud">{place.title}</div>
              </MarkerTooltip>
            </MapMarker>
          );
        })}
      </Map>

      <div className="pointer-events-none absolute left-5 top-5 max-w-sm rounded-[24px] border border-line/70 bg-panel/75 p-4 backdrop-blur hidden">
        <p className="text-xs uppercase tracking-[0.3em] text-mint/75">mapcn layer</p>
        <p className="mt-2 text-sm leading-6 text-cloud/75">
          {hasMapcnStyleOverride()
            ? "Custom MapCN style URL loaded from environment."
            : "MapCN component installed. Using its default MapLibre-backed basemap until you provide a custom MapCN style URL."}
        </p>
      </div>
    </div>
  );
}
