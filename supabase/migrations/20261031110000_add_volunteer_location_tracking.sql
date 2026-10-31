-- Migration: Add volunteer live location columns to delivery_tasks
-- Allows authorized volunteers to share their location for active delivery tasks with explicit consent.

ALTER TABLE public.delivery_tasks
  ADD COLUMN IF NOT EXISTS volunteer_location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS volunteer_location_updated_at timestamp with time zone;

-- Spatial index for volunteer location lookups
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_volunteer_location
  ON public.delivery_tasks USING gist (volunteer_location);
