-- ============================================================================
-- Migration: FoodLoop Database Hardening, Accounting, Safety & RLS
-- Migration Name: fix_database_safety_accounting_and_rls
-- Description:
--   1. Food Quantity Ledger & Parent-Child Batch Traceability (No double count/leak)
--   2. Strict Human Food Safety & Species-Specific Animal Feed Controls (No blind AI approval)
--   3. Comprehensive Multi-Tenant Row Level Security (RLS) & Role Isolation
--   4. Delivery Discrepancy Accounting (Damaged / Missing / Diverted to Waste)
--   5. Non-destructive migration preserving 100% of existing data & history
-- ============================================================================

-- ============================================================================
-- PART 1: EXTENSIONS & ENUM EXPANSIONS
-- ============================================================================

DO $$ BEGIN
  ALTER TYPE public.food_batch_status ADD VALUE IF NOT EXISTS 'hold';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE public.delivery_status ADD VALUE IF NOT EXISTS 'discrepancy_reported';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discrepancy_status AS ENUM (
    'none',
    'reported',
    'under_investigation',
    'resolved_loss',
    'diverted_to_waste'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.animal_species AS ENUM (
    'canine',
    'feline',
    'bovine',
    'porcine',
    'poultry',
    'equine',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PART 2: SCHEMA ENHANCEMENTS FOR QUANTITY ACCOUNTING & TRACEABILITY
-- ============================================================================

-- 0. Platform-level role on profiles to separate platform admin from org admin
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'donor'::public.app_role NOT NULL;

-- 1. Support parent and child batches with traceable quantities on food_batches
ALTER TABLE public.food_batches 
  ADD COLUMN IF NOT EXISTS parent_batch_id uuid REFERENCES public.food_batches(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS allocated_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS delivered_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS damaged_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS missing_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS available_quantity numeric(12,3) GENERATED ALWAYS AS (
    GREATEST(0::numeric, quantity - allocated_quantity - damaged_quantity - missing_quantity)
  ) STORED;

-- Ensure child batch is not self-referential
DO $$ BEGIN
  ALTER TABLE public.food_batches 
    ADD CONSTRAINT check_not_self_parent CHECK (parent_batch_id IS NULL OR parent_batch_id <> id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_food_batches_parent ON public.food_batches(parent_batch_id);

-- 2. Delivery confirmation loss and discrepancy breakdown
ALTER TABLE public.delivery_confirmations
  ADD COLUMN IF NOT EXISTS damaged_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS missing_quantity numeric(12,3) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS discrepancy_reason text,
  ADD COLUMN IF NOT EXISTS discrepancy_status public.discrepancy_status DEFAULT 'none'::public.discrepancy_status NOT NULL,
  ADD COLUMN IF NOT EXISTS can_be_diverted_to_waste boolean DEFAULT false NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.delivery_confirmations
    ADD CONSTRAINT delivery_confirmations_positive_breakdown 
    CHECK (damaged_quantity >= 0::numeric AND missing_quantity >= 0::numeric);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. Food Safety & Inspection Controls
ALTER TABLE public.quality_inspections
  ADD COLUMN IF NOT EXISTS is_ai_assessed boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS human_verified boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS target_species public.animal_species[],
  ADD COLUMN IF NOT EXISTS safety_checklist jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS inspection_notes text;

-- Add target species to recipient requirements so animal welfare NGOs specify allowed diets
ALTER TABLE public.recipient_requirements
  ADD COLUMN IF NOT EXISTS supported_species public.animal_species[];

-- Clean up duplicate inspection trigger from previous migration
DROP TRIGGER IF EXISTS trg_apply_inspection_result ON public.quality_inspections;
DROP TRIGGER IF EXISTS quality_inspection_apply_result ON public.quality_inspections;

-- ============================================================================
-- PART 3: CORE BUSINESS LOGIC & SAFETY FUNCTIONS
-- ============================================================================

-- Function 1: Enforce Human Safety & Species-Specific Rules on Inspections
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
  IF NEW.decision = 'approved_human' THEN
    UPDATE public.food_batches
    SET
      category = 'human_consumption'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'approved_animal' THEN
    UPDATE public.food_batches
    SET
      category = 'animal_appropriate'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'approved_organic_waste' THEN
    UPDATE public.food_batches
    SET
      category = 'organic_waste'::public.food_category,
      status = 'approved'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'rejected' THEN
    UPDATE public.food_batches
    SET
      category = NULL,
      status = 'rejected'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status IN ('pending_inspection', 'hold');

  ELSIF NEW.decision = 'requires_review' THEN
    UPDATE public.food_batches
    SET
      status = 'hold'::public.food_batch_status,
      updated_at = now()
    WHERE id = NEW.food_batch_id;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER quality_inspection_apply_result
AFTER INSERT OR UPDATE ON public.quality_inspections
FOR EACH ROW EXECUTE FUNCTION public.apply_inspection_result();


-- Function 2: Validate Food Allocation Quantities & Traceability
CREATE OR REPLACE FUNCTION public.validate_food_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_quantity NUMERIC(12,3);
  v_unit TEXT;
  v_category public.food_category;
  v_status public.food_batch_status;
  v_committed_allocations NUMERIC(12,3);
  v_child_batches_total NUMERIC(12,3);
  v_damaged_or_lost NUMERIC(12,3);
  v_available NUMERIC(12,3);
BEGIN
  -- Lock batch row for update to guarantee strict concurrency & prevent race conditions
  SELECT 
    quantity, quantity_unit, category, status,
    COALESCE(damaged_quantity, 0) + COALESCE(missing_quantity, 0)
  INTO v_quantity, v_unit, v_category, v_status, v_damaged_or_lost
  FROM public.food_batches
  WHERE id = NEW.batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Food batch (ID %) does not exist.', NEW.batch_id;
  END IF;

  IF v_status NOT IN ('approved', 'partially_allocated') THEN
    RAISE EXCEPTION 'ALLOCATION ERROR: Only batches in approved or partially_allocated status can be allocated (current status: %).', v_status;
  END IF;

  IF v_category NOT IN ('human_consumption', 'animal_appropriate') THEN
    RAISE EXCEPTION 'ALLOCATION ERROR: Food category "%" cannot be allocated for distribution.', v_category;
  END IF;

  IF NEW.quantity_unit <> v_unit THEN
    RAISE EXCEPTION 'ALLOCATION ERROR: Allocation unit "%" must match batch unit "%".', NEW.quantity_unit, v_unit;
  END IF;

  -- Sum of other active allocations for this batch
  SELECT COALESCE(SUM(allocated_quantity), 0)
  INTO v_committed_allocations
  FROM public.food_allocations
  WHERE batch_id = NEW.batch_id
    AND status IN ('pending', 'accepted', 'partially_fulfilled', 'fulfilled')
    AND id IS DISTINCT FROM NEW.id;

  -- Sum of quantities reserved for child batches if split
  SELECT COALESCE(SUM(quantity), 0)
  INTO v_child_batches_total
  FROM public.food_batches
  WHERE parent_batch_id = NEW.batch_id
    AND status <> 'cancelled';

  v_available := v_quantity - v_committed_allocations - v_child_batches_total - v_damaged_or_lost;

  IF NEW.allocated_quantity > v_available THEN
    RAISE EXCEPTION 'QUANTITY ERROR: Requested allocation (% %) exceeds available batch balance (% %). Double allocation prevented.',
      NEW.allocated_quantity, v_unit, v_available, v_unit;
  END IF;

  RETURN NEW;
END;
$function$;


-- Function 3: Refresh Batch Allocation State & Synchronize Totals
CREATE OR REPLACE FUNCTION public.refresh_batch_allocation_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_batch_id UUID;
  v_total NUMERIC(12,3);
  v_allocated NUMERIC(12,3);
  v_delivered NUMERIC(12,3);
  v_damaged NUMERIC(12,3);
  v_missing NUMERIC(12,3);
  v_current_status public.food_batch_status;
BEGIN
  v_batch_id := COALESCE(NEW.batch_id, OLD.batch_id);

  SELECT quantity, status
  INTO v_total, v_current_status
  FROM public.food_batches
  WHERE id = v_batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calculate current totals from allocations
  SELECT 
    COALESCE(SUM(allocated_quantity), 0)
  INTO v_allocated
  FROM public.food_allocations
  WHERE batch_id = v_batch_id
    AND status IN ('pending', 'accepted', 'partially_fulfilled', 'fulfilled');

  -- Update batch allocated counter
  UPDATE public.food_batches
  SET allocated_quantity = v_allocated,
      status = CASE
        WHEN v_current_status IN ('approved', 'partially_allocated', 'allocated') THEN
          CASE 
            WHEN v_allocated = 0 THEN 'approved'::public.food_batch_status
            WHEN v_allocated < v_total THEN 'partially_allocated'::public.food_batch_status
            ELSE 'allocated'::public.food_batch_status
          END
        ELSE v_current_status
      END,
      updated_at = now()
  WHERE id = v_batch_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;


-- Function 4: Validate Delivery Confirmation & Full Physical Reconciliation
CREATE OR REPLACE FUNCTION public.validate_delivery_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_allocated NUMERIC(12,3);
  v_unit TEXT;
  v_task_status public.delivery_status;
  v_total_accounted NUMERIC(12,3);
BEGIN
  SELECT a.allocated_quantity, a.quantity_unit, d.status
  INTO v_allocated, v_unit, v_task_status
  FROM public.delivery_tasks d
  JOIN public.food_allocations a ON a.id = d.allocation_id
  WHERE d.id = NEW.delivery_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DELIVERY ERROR: Delivery task or allocation not found for ID %.', NEW.delivery_task_id;
  END IF;

  IF NEW.quantity_unit <> v_unit THEN
    RAISE EXCEPTION 'DELIVERY ERROR: Confirmation unit "%" must match allocation unit "%".', NEW.quantity_unit, v_unit;
  END IF;

  v_total_accounted := NEW.received_quantity + NEW.damaged_quantity + NEW.missing_quantity;

  -- Ensure total accounted equals or is within allocated amount
  IF v_total_accounted > v_allocated THEN
    RAISE EXCEPTION 'DELIVERY ERROR: Total accounted quantity (Received: %, Damaged: %, Missing: %) exceeds dispatched allocation (% %).',
      NEW.received_quantity, NEW.damaged_quantity, NEW.missing_quantity, v_allocated, v_unit;
  END IF;

  -- If there is a discrepancy, a reason must be provided
  IF (NEW.damaged_quantity > 0 OR NEW.missing_quantity > 0) AND (NEW.discrepancy_reason IS NULL OR trim(NEW.discrepancy_reason) = '') THEN
    RAISE EXCEPTION 'DELIVERY ERROR: A discrepancy reason is mandatory when damaged or missing quantities are reported.';
  END IF;

  -- Set discrepancy status automatically
  IF NEW.damaged_quantity > 0 OR NEW.missing_quantity > 0 THEN
    NEW.discrepancy_status := 'reported'::public.discrepancy_status;
  ELSE
    NEW.discrepancy_status := 'none'::public.discrepancy_status;
  END IF;

  RETURN NEW;
END;
$function$;


-- Function 5: Mark Task Delivered & Apply Discrepancy Accounting to Batch
CREATE OR REPLACE FUNCTION public.mark_task_delivered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_batch_id UUID;
  v_alloc_id UUID;
  v_alloc_qty NUMERIC(12,3);
BEGIN
  SELECT a.id, a.batch_id, a.allocated_quantity
  INTO v_alloc_id, v_batch_id, v_alloc_qty
  FROM public.delivery_tasks d
  JOIN public.food_allocations a ON a.id = d.allocation_id
  WHERE d.id = NEW.delivery_task_id;

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

  -- Log explicit audit event for delivery completion / discrepancy
  INSERT INTO public.batch_events (
    batch_id, actor_id, event_type, previous_status, new_status, event_details
  )
  VALUES (
    v_batch_id,
    NEW.confirmed_by,
    CASE WHEN NEW.damaged_quantity > 0 OR NEW.missing_quantity > 0 THEN 'delivery_discrepancy_reported' ELSE 'delivery_fulfilled' END,
    'in_transit',
    'delivered',
    jsonb_build_object(
      'delivery_task_id', NEW.delivery_task_id,
      'received_quantity', NEW.received_quantity,
      'damaged_quantity', NEW.damaged_quantity,
      'missing_quantity', NEW.missing_quantity,
      'discrepancy_reason', NEW.discrepancy_reason,
      'can_be_diverted_to_waste', NEW.can_be_diverted_to_waste
    )
  );

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS & POLICIES
-- ============================================================================

-- Security helper: Check if user is a platform-wide admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.app_role
  );
$$;

-- Security helper: Check if user is an approved member of a specific organization
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_members
    WHERE organisation_id = p_org_id 
      AND user_id = auth.uid()
  );
$$;

-- Security helper: Check if user is an admin of a specific organization
CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organisation_members
    WHERE organisation_id = p_org_id 
      AND user_id = auth.uid() 
      AND role = 'admin'::public.app_role
  );
$$;

-- Security helper: Check user's app role
CREATE OR REPLACE FUNCTION public.has_app_role(p_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = p_role
  );
$$;

-- ----------------------------------------------------------------------------
-- RLS Policies: profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  id = auth.uid() 
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.organisation_members m1
    JOIN public.organisation_members m2 ON m1.organisation_id = m2.organisation_id
    WHERE m1.user_id = auth.uid() AND m2.user_id = profiles.id
  )
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: organisations
-- ----------------------------------------------------------------------------
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organisations_select_policy" ON public.organisations;
CREATE POLICY "organisations_select_policy" ON public.organisations
FOR SELECT USING (
  verification_status = 'verified'::public.verification_status
  OR public.is_org_member(id)
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS "organisations_insert_policy" ON public.organisations;
CREATE POLICY "organisations_insert_policy" ON public.organisations
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "organisations_update_policy" ON public.organisations;
CREATE POLICY "organisations_update_policy" ON public.organisations
FOR UPDATE USING (
  public.is_org_admin(id) OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: organisation_members
-- ----------------------------------------------------------------------------
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select_policy" ON public.organisation_members;
CREATE POLICY "org_members_select_policy" ON public.organisation_members
FOR SELECT USING (
  public.is_org_member(organisation_id) OR public.is_platform_admin()
);

DROP POLICY IF EXISTS "org_members_admin_policy" ON public.organisation_members;
CREATE POLICY "org_members_admin_policy" ON public.organisation_members
FOR ALL USING (
  public.is_org_admin(organisation_id) OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: food_batches
-- ----------------------------------------------------------------------------
ALTER TABLE public.food_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_batches_select_policy" ON public.food_batches;
CREATE POLICY "food_batches_select_policy" ON public.food_batches
FOR SELECT USING (
  public.is_org_member(donor_organisation_id)
  OR public.is_platform_admin()
  OR public.has_app_role('inspector'::public.app_role)
  OR (
    status IN ('approved', 'partially_allocated')
    AND EXISTS (
      SELECT 1 FROM public.organisation_members m
      JOIN public.organisations o ON o.id = m.organisation_id
      WHERE m.user_id = auth.uid() 
        AND o.organisation_type IN ('humanitarian_ngo', 'orphanage', 'government_school', 'old_age_home', 'animal_welfare_ngo', 'waste_processor')
        AND o.verification_status = 'verified'
    )
  )
);

DROP POLICY IF EXISTS "food_batches_insert_policy" ON public.food_batches;
CREATE POLICY "food_batches_insert_policy" ON public.food_batches
FOR INSERT WITH CHECK (
  public.is_org_member(donor_organisation_id) OR public.is_platform_admin()
);

DROP POLICY IF EXISTS "food_batches_update_policy" ON public.food_batches;
CREATE POLICY "food_batches_update_policy" ON public.food_batches
FOR UPDATE USING (
  public.is_org_member(donor_organisation_id) 
  OR public.is_platform_admin()
  OR public.has_app_role('inspector'::public.app_role)
);

-- ----------------------------------------------------------------------------
-- RLS Policies: recipient_requirements
-- ----------------------------------------------------------------------------
ALTER TABLE public.recipient_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipient_requirements_select_policy" ON public.recipient_requirements;
CREATE POLICY "recipient_requirements_select_policy" ON public.recipient_requirements
FOR SELECT USING (
  public.is_org_member(organisation_id)
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.organisation_members m
    WHERE m.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "recipient_requirements_modify_policy" ON public.recipient_requirements;
CREATE POLICY "recipient_requirements_modify_policy" ON public.recipient_requirements
FOR ALL USING (
  public.is_org_admin(organisation_id) OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: food_allocations
-- ----------------------------------------------------------------------------
ALTER TABLE public.food_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "food_allocations_select_policy" ON public.food_allocations;
CREATE POLICY "food_allocations_select_policy" ON public.food_allocations
FOR SELECT USING (
  public.is_org_member(recipient_organisation_id)
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.food_batches b
    WHERE b.id = food_allocations.batch_id AND public.is_org_member(b.donor_organisation_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    WHERE dt.allocation_id = food_allocations.id AND dt.volunteer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "food_allocations_modify_policy" ON public.food_allocations;
CREATE POLICY "food_allocations_modify_policy" ON public.food_allocations
FOR ALL USING (
  public.is_platform_admin()
  OR public.is_org_admin(recipient_organisation_id)
  OR EXISTS (
    SELECT 1 FROM public.food_batches b
    WHERE b.id = food_allocations.batch_id AND public.is_org_admin(b.donor_organisation_id)
  )
);

-- ----------------------------------------------------------------------------
-- RLS Policies: delivery_tasks & food_deliveries
-- ----------------------------------------------------------------------------
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_tasks_select_policy" ON public.delivery_tasks;
CREATE POLICY "delivery_tasks_select_policy" ON public.delivery_tasks
FOR SELECT USING (
  volunteer_id = auth.uid()
  OR (volunteer_id IS NULL AND public.has_app_role('volunteer'::public.app_role))
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.food_allocations a
    WHERE a.id = delivery_tasks.allocation_id 
      AND (
        public.is_org_member(a.recipient_organisation_id)
        OR EXISTS (
          SELECT 1 FROM public.food_batches b 
          WHERE b.id = a.batch_id AND public.is_org_member(b.donor_organisation_id)
        )
      )
  )
);

DROP POLICY IF EXISTS "delivery_tasks_update_policy" ON public.delivery_tasks;
CREATE POLICY "delivery_tasks_update_policy" ON public.delivery_tasks
FOR UPDATE USING (
  volunteer_id = auth.uid() 
  OR (volunteer_id IS NULL AND public.has_app_role('volunteer'::public.app_role))
  OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: delivery_confirmations
-- ----------------------------------------------------------------------------
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delivery_confirmations_select_policy" ON public.delivery_confirmations;
CREATE POLICY "delivery_confirmations_select_policy" ON public.delivery_confirmations
FOR SELECT USING (
  confirmed_by = auth.uid()
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    WHERE dt.id = delivery_confirmations.delivery_task_id AND dt.volunteer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.food_allocations fa ON fa.id = dt.allocation_id
    WHERE dt.id = delivery_confirmations.delivery_task_id
      AND (
        public.is_org_member(fa.recipient_organisation_id)
        OR EXISTS (
          SELECT 1 FROM public.food_batches fb
          WHERE fb.id = fa.batch_id AND public.is_org_member(fb.donor_organisation_id)
        )
      )
  )
);

DROP POLICY IF EXISTS "delivery_confirmations_insert_policy" ON public.delivery_confirmations;
CREATE POLICY "delivery_confirmations_insert_policy" ON public.delivery_confirmations
FOR INSERT WITH CHECK (
  public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.delivery_tasks dt
    JOIN public.food_allocations fa ON fa.id = dt.allocation_id
    WHERE dt.id = delivery_confirmations.delivery_task_id 
      AND public.is_org_member(fa.recipient_organisation_id)
  )
);

-- ----------------------------------------------------------------------------
-- RLS Policies: quality_inspections
-- ----------------------------------------------------------------------------
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quality_inspections_select_policy" ON public.quality_inspections;
CREATE POLICY "quality_inspections_select_policy" ON public.quality_inspections
FOR SELECT USING (
  inspector_id = auth.uid()
  OR public.has_app_role('inspector'::public.app_role)
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.food_batches b
    WHERE b.id = quality_inspections.batch_id AND public.is_org_member(b.donor_organisation_id)
  )
);

DROP POLICY IF EXISTS "quality_inspections_insert_policy" ON public.quality_inspections;
CREATE POLICY "quality_inspections_insert_policy" ON public.quality_inspections
FOR INSERT WITH CHECK (
  public.is_platform_admin() OR public.has_app_role('inspector'::public.app_role)
);

-- ----------------------------------------------------------------------------
-- RLS Policies: waste_processing_partners & records
-- ----------------------------------------------------------------------------
ALTER TABLE public.waste_processing_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waste_partners_select_policy" ON public.waste_processing_partners;
CREATE POLICY "waste_partners_select_policy" ON public.waste_processing_partners
FOR SELECT USING (
  public.is_org_member(organisation_id) OR public.is_platform_admin()
);

ALTER TABLE public.waste_processing_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waste_records_policy" ON public.waste_processing_records;
CREATE POLICY "waste_records_policy" ON public.waste_processing_records
FOR ALL USING (
  public.is_org_member(processor_organisation_id) OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: certificates & volunteer_achievements
-- ----------------------------------------------------------------------------
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_policy" ON public.certificates;
CREATE POLICY "certificates_policy" ON public.certificates
FOR SELECT USING (
  volunteer_id = auth.uid() OR public.is_platform_admin()
);

ALTER TABLE public.volunteer_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volunteer_achievements_policy" ON public.volunteer_achievements;
CREATE POLICY "volunteer_achievements_policy" ON public.volunteer_achievements
FOR SELECT USING (
  volunteer_id = auth.uid() OR public.is_platform_admin()
);

-- ----------------------------------------------------------------------------
-- RLS Policies: audit_events & batch_events
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_events_select_policy" ON public.audit_events;
CREATE POLICY "audit_events_select_policy" ON public.audit_events
FOR SELECT USING (
  actor_id = auth.uid() OR public.is_platform_admin()
);

ALTER TABLE public.batch_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "batch_events_select_policy" ON public.batch_events;
CREATE POLICY "batch_events_select_policy" ON public.batch_events
FOR SELECT USING (
  actor_id = auth.uid() 
  OR public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.food_batches b
    WHERE b.id = batch_events.batch_id AND public.is_org_member(b.donor_organisation_id)
  )
);

-- ============================================================================
-- PART 5: RECONCILIATION & MONITORING VIEWS
-- ============================================================================

DROP VIEW IF EXISTS public.available_food_batches;
CREATE VIEW public.available_food_batches AS
SELECT 
  b.id,
  b.batch_code,
  b.parent_batch_id,
  b.donor_organisation_id,
  o.name AS donor_name,
  o.address AS donor_address,
  b.food_name,
  b.description,
  b.category,
  b.quantity,
  b.allocated_quantity,
  b.available_quantity,
  b.quantity_unit,
  b.estimated_weight_kg,
  b.best_before_at,
  b.pickup_deadline,
  b.status,
  b.created_at
FROM public.food_batches b
JOIN public.organisations o ON o.id = b.donor_organisation_id
WHERE b.status IN ('approved'::public.food_batch_status, 'partially_allocated'::public.food_batch_status)
  AND b.available_quantity > 0
  AND b.category IN ('human_consumption'::public.food_category, 'animal_appropriate'::public.food_category)
  AND o.verification_status = 'verified'::public.verification_status
  AND (b.best_before_at IS NULL OR b.best_before_at > now());

CREATE OR REPLACE VIEW public.delivery_discrepancies AS
SELECT 
  dc.id AS confirmation_id,
  dc.delivery_task_id,
  dt.allocation_id,
  fa.batch_id,
  fb.batch_code,
  fa.recipient_organisation_id,
  ro.name AS recipient_name,
  fa.allocated_quantity,
  dc.received_quantity,
  dc.damaged_quantity,
  dc.missing_quantity,
  dc.quantity_unit,
  dc.discrepancy_reason,
  dc.discrepancy_status,
  dc.can_be_diverted_to_waste,
  dc.confirmed_at
FROM public.delivery_confirmations dc
JOIN public.delivery_tasks dt ON dt.id = dc.delivery_task_id
JOIN public.food_allocations fa ON fa.id = dt.allocation_id
JOIN public.food_batches fb ON fb.id = fa.batch_id
JOIN public.organisations ro ON ro.id = fa.recipient_organisation_id
WHERE dc.discrepancy_status <> 'none'::public.discrepancy_status;
