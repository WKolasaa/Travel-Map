export type Visibility = "public" | "authenticated" | "group" | "admin_only";
export type ContentStatus = "draft" | "published" | "hidden" | "archived";

export type Trip = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  coverImageUrl: string;
  routeEnabled: boolean;
  tags: string[];
  visibility: Visibility;
  groupIds: string[];
  status: ContentStatus;
  places?: Place[];
};

export type Place = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  markerColor: string;
  tripId: string | null;
  imageUrl: string;
  gallery: string[];
  tags: string[];
  visibility: Visibility;
  groupIds: string[];
  companions: string[];
  rating: number;
  tripOrder: number;
  status: ContentStatus;
};

export type TravelBootstrap = {
  places: Place[];
  trips: Trip[];
};
