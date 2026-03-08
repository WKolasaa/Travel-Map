CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  route_enabled BOOLEAN NOT NULL,
  color TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  tags TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
);

ALTER TABLE trips ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  marker_color TEXT NOT NULL,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  image_url TEXT NOT NULL,
  gallery TEXT NOT NULL,
  tags TEXT NOT NULL,
  visibility TEXT NOT NULL,
  companions TEXT NOT NULL,
  rating INTEGER NOT NULL,
  trip_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
);

ALTER TABLE places ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_places_trip_order ON places(trip_id, trip_order, start_date);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);