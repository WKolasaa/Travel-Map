const HTTP_URL_PATTERN = /^https?:\/\//i;
const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type FormErrors<T extends string> = Partial<Record<T, string>>;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function isValidAssetUrl(value: string): boolean {
  return value.startsWith("/") || HTTP_URL_PATTERN.test(value);
}

export function validatePlaceForm(input: {
  title: string;
  slug: string;
  summary: string;
  description: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  startDate: string;
  endDate: string;
  markerColor: string;
  tripId: string;
  imageUrl: string;
  gallery: string[];
  rating: string;
  tripOrder: string;
  visibility: string;
  groupIds: string[];
}): FormErrors<
  | "title"
  | "slug"
  | "summary"
  | "description"
  | "city"
  | "country"
  | "latitude"
  | "longitude"
  | "startDate"
  | "endDate"
  | "markerColor"
  | "tripId"
  | "imageUrl"
  | "gallery"
  | "rating"
  | "tripOrder"
  | "groupIds"
> {
  const errors: FormErrors<any> = {};

  if (isBlank(input.title)) errors.title = "Title is required.";
  if (input.slug.trim() && !SLUG_PATTERN.test(input.slug.trim())) errors.slug = "Slug must use lowercase letters, numbers, and hyphens only.";
  if (isBlank(input.summary)) errors.summary = "Summary is required.";
  if (isBlank(input.description)) errors.description = "Description is required.";
  if (isBlank(input.city)) errors.city = "City is required.";
  if (isBlank(input.country)) errors.country = "Country is required.";

  const latitude = Number(input.latitude);
  if (Number.isNaN(latitude)) errors.latitude = "Latitude must be a number.";
  else if (latitude < -90 || latitude > 90) errors.latitude = "Latitude must be between -90 and 90.";

  const longitude = Number(input.longitude);
  if (Number.isNaN(longitude)) errors.longitude = "Longitude must be a number.";
  else if (longitude < -180 || longitude > 180) errors.longitude = "Longitude must be between -180 and 180.";

  if (isBlank(input.startDate)) errors.startDate = "Start date is required.";
  if (isBlank(input.endDate)) errors.endDate = "End date is required.";
  if (!errors.startDate && !errors.endDate && input.startDate > input.endDate) {
    errors.endDate = "End date cannot be earlier than start date.";
  }

  if (!HEX_COLOR_PATTERN.test(input.markerColor.trim())) {
    errors.markerColor = "Marker color must be a valid hex color like #7dd8c6.";
  }

  if (isBlank(input.imageUrl)) errors.imageUrl = "Cover image is required.";
  else if (!isValidAssetUrl(input.imageUrl.trim())) errors.imageUrl = "Cover image must be an absolute URL or uploaded file path.";

  if (input.gallery.length === 0) errors.gallery = "Add at least one gallery image.";
  else if (input.gallery.some((url) => !isValidAssetUrl(url))) errors.gallery = "Every gallery image must be an absolute URL or uploaded file path.";

  const rating = Number(input.rating);
  if (!Number.isInteger(rating)) errors.rating = "Rating must be a whole number.";
  else if (rating < 0 || rating > 5) errors.rating = "Rating must be between 0 and 5.";

  const tripOrder = Number(input.tripOrder);
  if (!Number.isInteger(tripOrder)) errors.tripOrder = "Trip order must be a whole number.";
  else if (tripOrder < 0) errors.tripOrder = "Trip order cannot be negative.";
  else if (!input.tripId && tripOrder !== 0) errors.tripOrder = "Trip order must be 0 for standalone places.";

  if (input.visibility === "group" && input.groupIds.length === 0) {
    errors.groupIds = "Select at least one group for group visibility.";
  }

  return errors;
}

export function validateTripForm(input: {
  title: string;
  slug: string;
  summary: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  coverImageUrl: string;
  visibility: string;
  groupIds: string[];
}): FormErrors<
  | "title"
  | "slug"
  | "summary"
  | "description"
  | "startDate"
  | "endDate"
  | "color"
  | "coverImageUrl"
  | "groupIds"
> {
  const errors: FormErrors<any> = {};

  if (isBlank(input.title)) errors.title = "Title is required.";
  if (input.slug.trim() && !SLUG_PATTERN.test(input.slug.trim())) errors.slug = "Slug must use lowercase letters, numbers, and hyphens only.";
  if (isBlank(input.summary)) errors.summary = "Summary is required.";
  if (isBlank(input.description)) errors.description = "Description is required.";
  if (isBlank(input.startDate)) errors.startDate = "Start date is required.";
  if (isBlank(input.endDate)) errors.endDate = "End date is required.";
  if (!errors.startDate && !errors.endDate && input.startDate > input.endDate) {
    errors.endDate = "End date cannot be earlier than start date.";
  }
  if (!HEX_COLOR_PATTERN.test(input.color.trim())) errors.color = "Color must be a valid hex color like #7dd8c6.";
  if (isBlank(input.coverImageUrl)) errors.coverImageUrl = "Cover image is required.";
  else if (!isValidAssetUrl(input.coverImageUrl.trim())) errors.coverImageUrl = "Cover image must be an absolute URL or uploaded file path.";
  if (input.visibility === "group" && input.groupIds.length === 0) {
    errors.groupIds = "Select at least one group for group visibility.";
  }

  return errors;
}
