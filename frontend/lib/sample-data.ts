import type { Place, TravelBootstrap, Trip } from "@/lib/types";

export const trips: Trip[] = [
  {
    id: "trip-japan-2023",
    title: "Japan Autumn 2023",
    slug: "japan-autumn-2023",
    summary: "Cities, onsen towns, and coastal stops across a two-week route.",
    description:
      "A two-week route built around high-contrast rhythm changes: Tokyo density, Kyoto quiet, and a final coastal reset before flying home.",
    startDate: "2023-10-03",
    endDate: "2023-10-17",
    color: "#f3b544",
    coverImageUrl:
      "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1600&q=80",
    routeEnabled: true,
    tags: ["autumn", "rail", "cities"],
    visibility: "public",
    groupIds: [],
    status: "published"
  },
  {
    id: "trip-italy-2022",
    title: "Italy Summer 2022",
    slug: "italy-summer-2022",
    summary: "A dense train itinerary through Rome, Florence, and the Amalfi Coast.",
    description:
      "Fast transfers, long dinners, and a route that moved from city weight to bright coastal air without losing momentum.",
    startDate: "2022-06-08",
    endDate: "2022-06-18",
    color: "#7dd8c6",
    coverImageUrl:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
    routeEnabled: true,
    tags: ["summer", "food", "rail"],
    visibility: "public",
    groupIds: [],
    status: "published"
  }
];

export const places: Place[] = [
  {
    id: "tokyo-shinjuku",
    title: "Tokyo, Shinjuku Nights",
    slug: "tokyo-shinjuku-nights",
    summary: "Neon streets, late ramen, and the first reset after landing.",
    description:
      "Shinjuku was the decompression zone after the flight: narrow ramen counters, fluorescent crossings, and a pace that forced attention back into the present.",
    city: "Tokyo",
    country: "Japan",
    latitude: 35.6938,
    longitude: 139.7034,
    startDate: "2023-10-03",
    endDate: "2023-10-05",
    markerColor: "#f3b544",
    tripId: "trip-japan-2023",
    imageUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["city", "food", "night"],
    visibility: "public",
    groupIds: [],
    companions: ["Marta", "Kacper"],
    rating: 5,
    tripOrder: 1,
    status: "published"
  },
  {
    id: "kyoto-gion",
    title: "Kyoto, Gion Walks",
    slug: "kyoto-gion-walks",
    summary: "Slow mornings, temple steps, and narrow side streets after rain.",
    description:
      "Kyoto shifted the trip into a slower cadence. The strongest memory is not a single sight but the transition between temple courtyards and almost-empty streets after rain.",
    city: "Kyoto",
    country: "Japan",
    latitude: 35.0037,
    longitude: 135.7788,
    startDate: "2023-10-07",
    endDate: "2023-10-09",
    markerColor: "#f3b544",
    tripId: "trip-japan-2023",
    imageUrl:
      "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1478432780021-b8d273730d8c?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["temples", "walking", "autumn"],
    visibility: "public",
    groupIds: [],
    companions: ["Marta", "Kacper"],
    rating: 5,
    tripOrder: 2,
    status: "published"
  },
  {
    id: "rome-trastevere",
    title: "Rome, Trastevere",
    slug: "rome-trastevere",
    summary: "Warm evenings, stone alleys, and one perfectly unplanned dinner.",
    description:
      "The route through Trastevere worked because nothing was optimized. We followed side streets, sat down late, and let the district set the tempo for the evening.",
    city: "Rome",
    country: "Italy",
    latitude: 41.8897,
    longitude: 12.4663,
    startDate: "2022-06-08",
    endDate: "2022-06-10",
    markerColor: "#7dd8c6",
    tripId: "trip-italy-2022",
    imageUrl:
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["city", "food", "summer"],
    visibility: "public",
    groupIds: [],
    companions: ["Marta"],
    rating: 4,
    tripOrder: 1,
    status: "published"
  },
  {
    id: "amalfi-ravello",
    title: "Ravello Clifftops",
    slug: "ravello-clifftops",
    summary: "A higher, quieter angle on the coast with sea haze below the gardens.",
    description:
      "Ravello felt separate from the louder rhythm of the coast. The memory is mostly altitude, pale haze, and the sense of distance opening underneath the terraces.",
    city: "Ravello",
    country: "Italy",
    latitude: 40.6499,
    longitude: 14.6118,
    startDate: "2022-06-15",
    endDate: "2022-06-16",
    markerColor: "#7dd8c6",
    tripId: "trip-italy-2022",
    imageUrl:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=1200&q=80"
    ],
    tags: ["coast", "viewpoint", "summer"],
    visibility: "public",
    groupIds: [],
    companions: ["Marta"],
    rating: 5,
    tripOrder: 2,
    status: "published"
  }
];

export const fallbackBootstrap: TravelBootstrap = {
  places,
  trips
};
