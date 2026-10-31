-- ============================================================================
-- Migration: fix_p0_bugs
-- Description: Consolidated remediation for the P0 bug report:
--   BUG-01  apply_inspection_result() crashes on NEW.food_batch_id corrected
--           to NEW.batch_id (quality_inspections defines batch_id).
--   BUG-04  Quantity ledger desynchronisation: allocated_quantity is now
--           derived from a single authoritative recalculation that counts
--           BOTH active allocations AND non-cancelled child-batch
--           reservations. The service layer no longer writes allocated_quantity.
--   BUG-07  Event ledgers consolidated: DB triggers now write to
--           public.safechain_events (single ledger) instead of batch_events.
--           Actor attribution uses current_setting('app.user_id') which the
--           backend sets inside mutation transactions.
--   BUG-08  Dead duplicate schema: unused food_deliveries table dropped
--           (safechain_events.delivery_id remapped to delivery_tasks).
--   BUG-09  Batches now transition to 'completed' when all allocations are
--           fulfilled/cancelled and no child reservation remains.
-- Non-destructive note: batch_events is retained as read-only history; new
-- audit events are recorded exclusively in safechain_events.
-- ============================================================================

-- ============================================================================
-- BUG-01: fix inspection trigger - quality_inspections has batch_id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.apply_inspection_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_inspector_role public.app_role;
BEGIN
  -- SAFETY RULE 1: AI must NEVER approve food as safe for human or animal consumption.
  IF NEW.is_ai_assessed = TRUE AND NEW.human_verified = FALSE THEN
    IF NEW.decision IN ('approved_human', 'approved_animal') THEN
      RAISE EXCEPTION 'FOOD SAFETY VIOLATION: AI models are strictly prohibited from approving food for human or animal consumption. A certified human inspector must verify and sign off.';
    END IF;
  END IF;

  -- SAFETY RULE 2: Verify inspector is an authorized inspector or admin
  SELECT role INTO v_inspector_role
  FROM public.profiles
  WHERE id = NEW.inspector_id;

  IF v_inspector_role NOT IN ('inspector', 'admin') THEN
    RAISE EXCEPTION 'FOOD SAFETY VIOLATION: Inspector (ID %) does not possess the authorized inspector or admin credential.', NEW.inspector_id;
  END IF;

  -- SAFETY RULE 3: Animal food suitability must specify target species
  IF NEW.decision = 'approved_animal' THEN
    IF NEW.target_species IS NULL OR array_length(NEW.target_species, 1) = 0 THEN
      RAISE EXCEPTION 'FOOD SAFETY VIOLATION: Animal suitability decisions require explicit target species specification (e.g. canine, feline, bovine, poultry).';
    END IF;
  END IF;

  -- Apply status transitions based on verified decision
  -- FIX (BUG-01): quality_inspections defines batch_id, not food_batch_id
  IF NEW.decision = 'approved_human' THEN
    UPDATE public.food_batches
    SET
      category = 'human_consumption'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'approved_animal' THEN
    UPDATE public.food_batches
    SET
      category = 'animal_appropriate'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'approved_organic_waste' THEN
    UPDATE public.food_batches
    SET
      category = 'organic_waste'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'rejected' THEN
    UPDATE public.food_batches
    SET
      category = NULL,
      status = 'rejected'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'requires_review' THEN
    UPDATE public.food_batches
    SET
      status = 'hold'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.batch_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- BUG-04: single source of truth for the quantity ledger
-- available_quantity (generated column) = GREATEST(0, quantity - allocated_quantity - damaged_quantity - missing_quantity)
-- allocated_quantity          = SUM(active allocations) + SUM(non-cancelled child batch quantities)
-- ============================================================================

-- Authoritative recalculation of a batch's allocation ledger.
-- Only issues an UPDATE when values actually change, which guarantees
-- termination of the cascading child→parent refresh triggers.
CREATE OR REPLACE FUNCTION public.recalculate_batch_allocation_totals(p_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_total numeric(12,3);
  v_status public.food_batch_status;
  v_allocations_sum numeric(12,3);
  v_child_reservation numeric(12,3);
  v_new_allocated numeric(12,3);
  v_new_status public.food_batch_status;
BEGIN
  SELECT quantity, status
  INTO v_total, v_status
  FROM public.food_batches
  WHERE id = p_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Active allocations (reservation not yet consumed/cancelled)
  SELECT COALESCE(SUM(allocated_quantity), 0)
  INTO v_allocations_sum
  FROM public.food_allocations
  WHERE batch_id = p_batch_id
    AND status IN ('pending', 'accepted', 'partially_fulfilled', 'fulfilled');

  -- Non-cancelled child batches reserve quantity from the parent
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_child_reservation
  FROM public.food_batches
  WHERE parent_batch_id = p_batch_id
    AND status <> 'cancelled';

  v_new_allocated := v_allocations_sum + v_child_reservation;

  v_new_status := CASE
    WHEN v_status IN ('approved', 'partially_allocated', 'allocated') THEN
      CASE
        WHEN v_new_allocated = 0 THEN 'approved'::public.food_batch_status
        WHEN v_new_allocated < v_total THEN 'partially_allocated'::public.food_batch_status
        ELSE 'allocated'::public.food_batch_status
      END
    ELSE v_status
  END;

  UPDATE public.food_batches
  SET
    allocated_quantity = v_new_allocated,
    status = v_new_status,
    updated_at = now()
  WHERE id = p_batch_id
    AND (allocated_quantity IS DISTINCT FROM v_new_allocated
         OR status IS DISTINCT FROM v_new_status);
END;
$function$;

-- Delegating shim so the existing allocations triggers keep working
CREATE OR REPLACE FUNCTION public.refresh_batch_allocation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_batch_id uuid;
BEGIN
  v_batch_id := COALESCE(NEW.batch_id, OLD.batch_id);
  PERFORM public.recalculate_batch_allocation_totals(v_batch_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Parent reservation refresh when child batches change (inserted, cancelled,
-- reinstated, reparented or deleted).
CREATE OR REPLACE FUNCTION public.refresh_reservation_on_batch_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_batch_id IS NOT NULL THEN
      PERFORM public.recalculate_batch_allocation_totals(NEW.parent_batch_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.status = 'cancelled' AND NEW.status <> 'cancelled')
       OR (OLD.status <> 'cancelled' AND NEW.status = 'cancelled')
       OR NEW.parent_batch_id IS DISTINCT FROM OLD.parent_batch_id THEN
      IF NEW.parent_batch_id IS NOT NULL THEN
        PERFORM public.recalculate_batch_allocation_totals(NEW.parent_batch_id);
      END IF;
      IF OLD.parent_batch_id IS NOT NULL
         AND OLD.parent_batch_id IS DISTINCT FROM NEW.parent_batch_id THEN
        PERFORM public.recalculate_batch_allocation_totals(OLD.parent_batch_id);
      END IF;
    END IF;
  ELSE -- DELETE
    IF OLD.parent_batch_id IS NOT NULL THEN
      PERFORM public.recalculate_batch_allocation_totals(OLD.parent_batch_id);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS food_batches_reservation_refresh_ins ON public.food_batches;
CREATE TRIGGER food_batches_reservation_refresh_ins
AFTER INSERT ON public.food_batches
FOR EACH ROW EXECUTE FUNCTION public.refresh_reservation_on_batch_change();

DROP TRIGGER IF EXISTS food_batches_reservation_refresh_upd ON public.food_batches;
CREATE TRIGGER food_batches_reservation_refresh_upd
AFTER UPDATE ON public.food_batches
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status
      OR NEW.parent_batch_id IS DISTINCT FROM OLD.parent_batch_id)
EXECUTE FUNCTION public.refresh_reservation_on_batch_change();

DROP TRIGGER IF EXISTS food_batches_reservation_refresh_del ON public.food_batches;
CREATE TRIGGER food_batches_reservation_refresh_del
AFTER DELETE ON public.food_batches
FOR EACH ROW EXECUTE FUNCTION public.refresh_reservation_on_batch_change();

-- ============================================================================
-- BUG-07: consolidate event ledger into safechain_events
-- ============================================================================
DO $$ BEGIN
  ALTER TABLE public.safechain_events
    DROP CONSTRAINT IF EXISTS safechain_events_event_type_check;

  ALTER TABLE public.safechain_events
    ADD CONSTRAINT safechain_events_event_type_check
    CHECK (event_type = ANY (ARRAY[
      'batch_created'::text,
      'batch_updated'::text,
      'batch_status_changed'::text,
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
      'allocation_changed'::text,
      'volunteer_assigned'::text,
      'volunteer_reassigned'::text,
      'delivery_task_changed'::text,
      'delivery_fulfilled'::text,
      'pickup_confirmed'::text,
      'in_transit'::text,
      'delivered'::text,
      'delivery_failed'::text,
      'delivery_cancelled'::text,
      'delivery_discrepancy_reported'::text,
      'waste_processed'::text
    ]));
END $$;

-- Safe helper: resolves the acting user set by the backend inside mutation
-- transactions (set_config('app.user_id', ..., true)), guarded against
-- stale-orphan ids that would break the FK.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN v_actor.id IS NOT NULL THEN v_actor.id
    ELSE NULL::uuid
  END
  FROM (
    SELECT id FROM public.profiles
    WHERE id = NULLIF(current_setting('app.user_id', TRUE), '')::uuid
    LIMIT 1
  ) AS v_actor;
$$;

-- Allocation ledger events (kept for DB-level change auditing, including
-- application-level deletions). The application additionally records the
-- richer 'allocation_created' / 'allocation_accepted' / ... events, so the
-- trigger ledger uses the generic 'allocation_changed' type without duplicating.
CREATE OR REPLACE FUNCTION public.log_allocation_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_batch_id uuid;
  v_actor uuid;
  v_details jsonb;
BEGIN
  v_actor := public.current_app_user_id();

  IF TG_OP = 'DELETE' THEN
    v_batch_id := OLD.batch_id;
    v_details := jsonb_build_object(
      'allocation_id', OLD.id,
      'operation', 'deleted'
    );
  ELSE
    v_batch_id := NEW.batch_id;
    v_details := jsonb_build_object(
      'allocation_id', NEW.id,
      'operation', lower(TG_OP),
      'recipient_organisation_id', NEW.recipient_organisation_id,
      'allocated_quantity', NEW.allocated_quantity,
      'quantity_unit', NEW.quantity_unit,
      'status', NEW.status,
      'allocated_by', NEW.allocated_by
    );
  END IF;

  INSERT INTO public.safechain_events (
    batch_id, event_type, recorded_by, event_data
  )
  VALUES (
    v_batch_id, 'allocation_changed', v_actor, v_details
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Batch status transitions. The INSERT branch (batch_created) has been
-- removed to avoid duplicating the application's own 'batch_created' event;
-- the application is always the creator, so it records that event itself.
CREATE OR REPLACE FUNCTION public.log_batch_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_actor uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    v_actor := public.current_app_user_id();

    INSERT INTO public.safechain_events (
      batch_id, event_type, recorded_by, event_data
    )
    VALUES (
      NEW.id,
      'batch_status_changed',
      v_actor,
      jsonb_build_object(
        'batch_code', NEW.batch_code,
        'previous_status', OLD.status::text,
        'new_status', NEW.status::text
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Delivery task changes now also write to the consolidated ledger
CREATE OR REPLACE FUNCTION public.log_delivery_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_batch_id uuid;
  v_actor uuid;
BEGIN
  v_actor := public.current_app_user_id();

  SELECT a.batch_id
  INTO v_batch_id
  FROM public.food_allocations a
  WHERE a.id = COALESCE(NEW.allocation_id, OLD.allocation_id);

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.safechain_events (
    batch_id, event_type, recorded_by, event_data
  )
  VALUES (
    v_batch_id,
    'delivery_task_changed',
    v_actor,
    jsonb_build_object(
      'delivery_task_id', COALESCE(NEW.id, OLD.id),
      'volunteer_id', COALESCE(NEW.volunteer_id, OLD.volunteer_id),
      'previous_status', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status::text END,
      'new_status', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.status::text END,
      'delivery_task_id', COALESCE(NEW.id, OLD.id),
      'operation', lower(TG_OP)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ============================================================================
-- BUG-09: batch completion transition on final delivery + BUG-07 safechain
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_task_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_batch_id uuid;
  v_alloc_id uuid;
  v_alloc_qty numeric(12,3);
  v_live_allocations numeric(12,3);
  v_child_reservation numeric(12,3);
BEGIN
  SELECT a.id, a.batch_id, a.allocated_quantity
  INTO v_alloc_id, v_batch_id, v_alloc_qty
  FROM public.delivery_tasks d
  JOIN public.food_allocations a ON a.id = d.allocation_id
  WHERE d.id = NEW.delivery_task_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Update delivery task status
  UPDATE public.delivery_tasks
  SET
    status = CASE
      WHEN NEW.damaged_quantity > 0 OR NEW.missing_quantity > 0 THEN 'discrepancy_reported'::public.delivery_status
      ELSE 'delivered'::public.delivery_status
    END,
    delivered_at = NEW.confirmed_at,
    updated_at = now()
  WHERE id = NEW.delivery_task_id;

  -- Update allocation status
  UPDATE public.food_allocations
  SET
    status = CASE
      WHEN NEW.received_quantity >= v_alloc_qty THEN 'fulfilled'::public.allocation_status
      ELSE 'partially_fulfilled'::public.allocation_status
    END,
    updated_at = now()
  WHERE id = v_alloc_id;

  -- Synchronize physical loss to batch records so missing food is never re-offered
  UPDATE public.food_batches
  SET
    delivered_quantity = delivered_quantity + NEW.received_quantity,
    damaged_quantity = damaged_quantity + NEW.damaged_quantity,
    missing_quantity = missing_quantity + NEW.missing_quantity,
    updated_at = now()
  WHERE id = v_batch_id;

  -- BUG-09: complete the batch when the last live allocation is consumed and
  -- no child batch still reserves parent quantity
  SELECT COALESCE(SUM(allocated_quantity), 0)
  INTO v_live_allocations
  FROM public.food_allocations
  WHERE batch_id = v_batch_id
    AND status IN ('pending', 'accepted', 'partially_fulfilled');

  SELECT COALESCE(SUM(quantity), 0)
  INTO v_child_reservation
  FROM public.food_batches
  WHERE parent_batch_id = v_batch_id
    AND status <> 'cancelled';

  IF v_live_allocations = 0 AND v_child_reservation = 0 THEN
    UPDATE public.food_batches
    SET status = 'completed'::public.food_batch_status, updated_at = now()
    WHERE id = v_batch_id
      AND status IN ('allocated', 'partially_allocated', 'in_transit');
  END IF;

  -- Consolidated ledger event (BUG-07)
  INSERT INTO public.safechain_events (
    batch_id, event_type, recorded_by, event_data
  )
  VALUES (
    v_batch_id,
    CASE WHEN NEW.damaged_quantity > 0 OR NEW.missing_quantity > 0
      THEN 'delivery_discrepancy_reported'
      ELSE 'delivery_fulfilled'
    END,
    NEW.confirmed_by,
    jsonb_build_object(
      'delivery_task_id', NEW.delivery_task_id,
      'received_quantity', NEW.received_quantity,
      'damaged_quantity', NEW.damaged_quantity,
      'missing_quantity', NEW.missing_quantity,
      'discrepancy_reason', NEW.discrepancy_reason,
      'can_be_diverted_to_waste', NEW.can_be_diverted_to_waste,
      'previous_status', 'in_transit',
      'new_status', 'delivered'
    )
  );

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- BUG-08: drop dead duplicate schema food_deliveries
-- safechain_events.delivery_id actually stores delivery_task ids in the
-- application, so repoint the FK to delivery_tasks first.
-- ============================================================================
ALTER TABLE public.safechain_events
  DROP CONSTRAINT IF EXISTS safechain_events_delivery_id_fkey;

ALTER TABLE public.safechain_events
  ADD CONSTRAINT safechain_events_delivery_id_fkey
  FOREIGN KEY (delivery_id) REFERENCES public.delivery_tasks(id) ON DELETE SET NULL;

DROP TABLE IF EXISTS public.food_deliveries;
