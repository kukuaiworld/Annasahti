-- ============================================================================
-- Migration: Add Phase 5 SafeChain Event Types for Matching & Operations
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.safechain_events
    DROP CONSTRAINT IF EXISTS safechain_events_event_type_check;

  ALTER TABLE public.safechain_events
    ADD CONSTRAINT safechain_events_event_type_check
    CHECK (event_type = ANY (ARRAY[
      'batch_created'::text,
      'batch_updated'::text,
      'batch_cancelled'::text,
      'inspection_submitted'::text,
      'inspection_completed'::text,
      'batch_approved'::text,
      'batch_rejected'::text,
      'parent_batch_split'::text,
      'child_batch_created'::text,
      'child_batch_approved'::text,
      'allocation_created'::text,
      'allocation_accepted'::text,
      'allocation_rejected'::text,
      'allocation_cancelled'::text,
      'volunteer_assigned'::text,
      'volunteer_reassigned'::text,
      'pickup_confirmed'::text,
      'in_transit'::text,
      'delivered'::text,
      'delivery_failed'::text,
      'delivery_cancelled'::text,
      'delivery_discrepancy_reported'::text,
      'waste_processed'::text
    ]));
END $$;
