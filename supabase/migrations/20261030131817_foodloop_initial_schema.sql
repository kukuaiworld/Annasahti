-- Migration: FoodLoop Initial Schema Capture
-- Generated: 2026-10-30T13:18:17.347Z
-- Platform: Supabase PostgreSQL (FoodLoop Surplus Food Rescue & Distribution Platform)

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE public.allocation_status AS ENUM (
  'pending',
  'accepted',
  'partially_fulfilled',
  'fulfilled',
  'cancelled',
  'expired'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
  'donor',
  'recipient',
  'volunteer',
  'inspector',
  'admin'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM (
  'assigned',
  'accepted',
  'pickup_confirmed',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.food_batch_status AS ENUM (
  'pending_inspection',
  'approved',
  'partially_allocated',
  'allocated',
  'in_transit',
  'completed',
  'rejected',
  'expired',
  'cancelled'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.food_category AS ENUM (
  'human_consumption',
  'animal_appropriate',
  'organic_waste'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.impact_metric_type AS ENUM (
  'human_meals_delivered',
  'animal_food_kg_delivered',
  'organic_waste_kg_processed',
  'co2e_avoided_kg_estimated'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.inspection_decision AS ENUM (
  'pending',
  'approved_human',
  'approved_animal',
  'rejected',
  'requires_review',
  'approved_organic_waste'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.organisation_type AS ENUM (
  'restaurant',
  'hotel',
  'caterer',
  'humanitarian_ngo',
  'orphanage',
  'government_school',
  'old_age_home',
  'animal_welfare_ngo',
  'waste_processor',
  'other'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'suspended'
);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. STORED FUNCTIONS & PROCEDURES
-- ============================================================================
CREATE OR REPLACE FUNCTION public.apply_inspection_result()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.decision = 'approved_human' THEN
    UPDATE public.food_batches
    SET
      category = 'human_consumption',
      status = 'approved',
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status = 'pending_inspection';

  ELSIF NEW.decision = 'approved_animal' THEN
    UPDATE public.food_batches
    SET
      category = 'animal_appropriate',
      status = 'approved',
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status = 'pending_inspection';

  ELSIF NEW.decision = 'approved_organic_waste' THEN
    UPDATE public.food_batches
    SET
      category = 'organic_waste',
      status = 'approved',
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status = 'pending_inspection';

  ELSIF NEW.decision = 'rejected' THEN
    UPDATE public.food_batches
    SET
      category = NULL,
      status = 'rejected',
      updated_at = now()
    WHERE id = NEW.food_batch_id
      AND status = 'pending_inspection';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(NEW.email, ''),
      'New User'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_allocation_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_batch_id UUID;
  v_actor UUID;
  v_details JSONB;
BEGIN
  v_actor := NULLIF(
    current_setting('app.user_id', TRUE), ''
  )::UUID;

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
      'recipient_organisation_id', NEW.recipient_organisation_id,
      'allocated_quantity', NEW.allocated_quantity,
      'quantity_unit', NEW.quantity_unit,
      'status', NEW.status
    );
  END IF;

  INSERT INTO public.batch_events (
    batch_id, actor_id, event_type, event_details
  )
  VALUES (
    v_batch_id, v_actor, 'allocation_changed', v_details
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_batch_lifecycle_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_actor UUID;
  v_previous TEXT;
  v_current TEXT;
BEGIN
  v_actor := NULLIF(
    current_setting('app.user_id', TRUE), ''
  )::UUID;

  IF TG_OP = 'INSERT' THEN
    v_previous := NULL;
    v_current := NEW.status::TEXT;

    INSERT INTO public.batch_events (
      batch_id, actor_id, event_type,
      previous_status, new_status, event_details
    )
    VALUES (
      NEW.id, v_actor, 'batch_created',
      NULL, v_current,
      jsonb_build_object(
        'batch_code', NEW.batch_code,
        'food_name', NEW.food_name
      )
    );

    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.batch_events (
      batch_id, actor_id, event_type,
      previous_status, new_status, event_details
    )
    VALUES (
      NEW.id, v_actor, 'batch_status_changed',
      OLD.status::TEXT, NEW.status::TEXT,
      jsonb_build_object('batch_code', NEW.batch_code)
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_delivery_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_batch_id UUID;
  v_actor UUID;
BEGIN
  v_actor := NULLIF(
    current_setting('app.user_id', TRUE), ''
  )::UUID;

  SELECT a.batch_id
  INTO v_batch_id
  FROM public.food_allocations a
  WHERE a.id = COALESCE(NEW.allocation_id, OLD.allocation_id);

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.batch_events (
    batch_id, actor_id, event_type,
    previous_status, new_status, event_details
  )
  VALUES (
    v_batch_id,
    v_actor,
    'delivery_task_changed',
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status::TEXT END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.status::TEXT END,
    jsonb_build_object(
      'delivery_task_id', COALESCE(NEW.id, OLD.id),
      'volunteer_id', COALESCE(NEW.volunteer_id, OLD.volunteer_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_task_delivered()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.delivery_tasks
  SET status = 'delivered',
      delivered_at = NEW.confirmed_at
  WHERE id = NEW.delivery_task_id
    AND status NOT IN ('cancelled', 'failed');

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_batch_allocation_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_batch_id UUID;
  v_total NUMERIC(12,3);
  v_allocated NUMERIC(12,3);
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

  IF v_current_status IN ('approved', 'partially_allocated', 'allocated') THEN
    SELECT COALESCE(SUM(allocated_quantity), 0)
    INTO v_allocated
    FROM public.food_allocations
    WHERE batch_id = v_batch_id
      AND status NOT IN ('cancelled', 'expired');

    UPDATE public.food_batches
    SET status = CASE
      WHEN v_allocated = 0 THEN 'approved'::public.food_batch_status
      WHEN v_allocated < v_total THEN 'partially_allocated'::public.food_batch_status
      ELSE 'allocated'::public.food_batch_status
    END
    WHERE id = v_batch_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_delivery_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_quantity NUMERIC(12,3);
  v_unit TEXT;
  v_allocation_unit TEXT;
BEGIN
  SELECT a.allocated_quantity, a.quantity_unit
  INTO v_quantity, v_allocation_unit
  FROM public.delivery_tasks d
  JOIN public.food_allocations a ON a.id = d.allocation_id
  WHERE d.id = NEW.delivery_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Delivery task or allocation not found';
  END IF;

  v_unit := NEW.quantity_unit;

  IF v_unit <> v_allocation_unit THEN
    RAISE EXCEPTION 'Confirmation unit must match allocation unit';
  END IF;

  IF NEW.received_quantity > v_quantity THEN
    RAISE EXCEPTION 'Received quantity cannot exceed allocation quantity';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_food_allocation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_quantity NUMERIC(12,3);
  v_unit TEXT;
  v_category public.food_category;
  v_status public.food_batch_status;
  v_existing NUMERIC(12,3);
BEGIN
  SELECT quantity, quantity_unit, category, status
  INTO v_quantity, v_unit, v_category, v_status
  FROM public.food_batches
  WHERE id = NEW.batch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Food batch not found';
  END IF;

  IF v_status NOT IN ('approved', 'partially_allocated') THEN
    RAISE EXCEPTION 'Only approved batches can be allocated';
  END IF;

  IF v_category NOT IN ('human_consumption', 'animal_appropriate') THEN
    RAISE EXCEPTION 'This food category cannot be allocated for delivery';
  END IF;

  IF NEW.quantity_unit <> v_unit THEN
    RAISE EXCEPTION 'Allocation unit must match the batch unit';
  END IF;

  SELECT COALESCE(SUM(allocated_quantity), 0)
  INTO v_existing
  FROM public.food_allocations
  WHERE batch_id = NEW.batch_id
    AND status <> 'cancelled'
    AND status <> 'expired'
    AND id IS DISTINCT FROM NEW.id;

  IF v_existing + NEW.allocated_quantity > v_quantity THEN
    RAISE EXCEPTION 'Total allocations cannot exceed batch quantity';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_processing_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_category public.food_category;
  v_status public.food_batch_status;
  v_org_type public.organisation_type;
  v_partner_active BOOLEAN;
BEGIN
  SELECT category, status
  INTO v_category, v_status
  FROM public.food_batches
  WHERE id = NEW.batch_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Food batch not found';
  END IF;

  IF v_category <> 'organic_waste' THEN
    RAISE EXCEPTION 'Only batches classified as organic waste can be processed';
  END IF;

  IF v_status NOT IN ('approved', 'partially_allocated', 'allocated', 'completed') THEN
    RAISE EXCEPTION 'Batch is not in a valid state for processing confirmation';
  END IF;

  SELECT o.organisation_type, p.is_active
  INTO v_org_type, v_partner_active
  FROM public.waste_processing_partners p
  JOIN public.organisations o ON o.id = p.organisation_id
  WHERE p.id = NEW.processor_id;

  IF NOT FOUND OR v_org_type <> 'waste_processor' OR NOT v_partner_active THEN
    RAISE EXCEPTION 'Processor must be an active, registered waste-processing partner';
  END IF;

  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 4. BASE TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT audit_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.batch_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  actor_id uuid,
  event_type text NOT NULL,
  previous_status text,
  new_status text,
  event_details jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT batch_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.batch_qr_codes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  qr_token uuid DEFAULT gen_random_uuid() NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  revoked_at timestamp with time zone,
  CONSTRAINT batch_qr_codes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  volunteer_id uuid NOT NULL,
  certificate_code text DEFAULT ('FLC-'::text || upper(SUBSTRING(replace((gen_random_uuid())::text, '-'::text, ''::text) FROM 1 FOR 12))) NOT NULL,
  certificate_type text NOT NULL,
  title text NOT NULL,
  issued_at timestamp with time zone DEFAULT now() NOT NULL,
  issued_by uuid,
  file_path text,
  is_revoked boolean DEFAULT false NOT NULL,
  revoked_at timestamp with time zone,
  revocation_reason text,
  CONSTRAINT certificates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  delivery_task_id uuid NOT NULL,
  confirmed_by uuid NOT NULL,
  received_quantity numeric(12,3) NOT NULL,
  quantity_unit text DEFAULT 'kg'::text NOT NULL,
  recipient_notes text,
  evidence_urls text[] DEFAULT ARRAY[]::text[] NOT NULL,
  confirmed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT delivery_confirmations_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_confirmations_received_quantity_check CHECK (received_quantity >= 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.delivery_tasks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  allocation_id uuid NOT NULL,
  volunteer_id uuid,
  status delivery_status DEFAULT 'assigned'::delivery_status NOT NULL,
  pickup_deadline timestamp with time zone,
  delivery_deadline timestamp with time zone,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  accepted_at timestamp with time zone,
  pickup_confirmed_at timestamp with time zone,
  departed_at timestamp with time zone,
  delivered_at timestamp with time zone,
  delivery_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT delivery_tasks_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.food_allocations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  recipient_organisation_id uuid NOT NULL,
  allocated_quantity numeric(12,3) NOT NULL,
  quantity_unit text DEFAULT 'kg'::text NOT NULL,
  status allocation_status DEFAULT 'pending'::allocation_status NOT NULL,
  allocated_by uuid,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT food_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT food_allocations_allocated_quantity_check CHECK (allocated_quantity > 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.food_batches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_code text DEFAULT ('FL-'::text || upper(SUBSTRING(replace((gen_random_uuid())::text, '-'::text, ''::text) FROM 1 FOR 12))) NOT NULL,
  donor_organisation_id uuid NOT NULL,
  food_name text NOT NULL,
  description text,
  category food_category,
  quantity numeric(12,3) NOT NULL,
  quantity_unit text DEFAULT 'kg'::text NOT NULL,
  estimated_weight_kg numeric(12,3),
  prepared_at timestamp with time zone,
  best_before_at timestamp with time zone,
  pickup_deadline timestamp with time zone,
  storage_instructions text,
  status food_batch_status DEFAULT 'pending_inspection'::food_batch_status NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT food_batches_pkey PRIMARY KEY (id),
  CONSTRAINT food_batches_check CHECK (prepared_at IS NULL OR best_before_at IS NULL OR best_before_at >= prepared_at),
  CONSTRAINT food_batches_check1 CHECK (pickup_deadline IS NULL OR best_before_at IS NULL OR pickup_deadline <= best_before_at),
  CONSTRAINT food_batches_estimated_weight_kg_check CHECK (estimated_weight_kg IS NULL OR estimated_weight_kg > 0::numeric),
  CONSTRAINT food_batches_quantity_check CHECK (quantity > 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.food_deliveries (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  allocation_id uuid NOT NULL,
  volunteer_id uuid,
  status delivery_status DEFAULT 'assigned'::delivery_status NOT NULL,
  pickup_time timestamp with time zone,
  delivery_time timestamp with time zone,
  pickup_location geography(Point,4326),
  dropoff_location geography(Point,4326),
  proof_of_delivery_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT food_deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT valid_delivery_times CHECK (delivery_time IS NULL OR pickup_time IS NULL OR delivery_time >= pickup_time)
);

CREATE TABLE IF NOT EXISTS public.impact_methodologies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  methodology_code text NOT NULL,
  version text NOT NULL,
  description text NOT NULL,
  source_reference text,
  assumptions jsonb DEFAULT '{}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT impact_methodologies_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organisation_id uuid,
  metric_type impact_metric_type NOT NULL,
  metric_value numeric(14,3) DEFAULT 0 NOT NULL,
  unit text NOT NULL,
  reporting_period_start date NOT NULL,
  reporting_period_end date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT impact_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT impact_metrics_metric_value_check CHECK (metric_value >= 0::numeric),
  CONSTRAINT valid_reporting_period CHECK (reporting_period_end >= reporting_period_start)
);

CREATE TABLE IF NOT EXISTS public.impact_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid,
  delivery_task_id uuid,
  metric_type impact_metric_type NOT NULL,
  metric_value numeric(14,4) NOT NULL,
  unit text NOT NULL,
  is_estimate boolean DEFAULT false NOT NULL,
  methodology_id uuid,
  verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL,
  calculation_details jsonb DEFAULT '{}'::jsonb NOT NULL,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT impact_records_pkey PRIMARY KEY (id),
  CONSTRAINT impact_records_metric_value_check CHECK (metric_value >= 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.organisation_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organisation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT organisation_members_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.organisations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  organisation_type organisation_type NOT NULL,
  verification_status verification_status DEFAULT 'pending'::verification_status NOT NULL,
  description text,
  address text,
  location geography(Point,4326),
  contact_email text,
  contact_phone text,
  operating_hours jsonb DEFAULT '{}'::jsonb NOT NULL,
  verified_at timestamp with time zone,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT organisations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.processing_confirmations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  processor_id uuid NOT NULL,
  processed_weight_kg numeric(12,3) NOT NULL,
  processing_method text NOT NULL,
  evidence_urls text[] DEFAULT ARRAY[]::text[] NOT NULL,
  confirmed_by uuid NOT NULL,
  processed_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT processing_confirmations_pkey PRIMARY KEY (id),
  CONSTRAINT processing_confirmations_processed_weight_kg_check CHECK (processed_weight_kg > 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  account_status text DEFAULT 'active'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_account_status_check CHECK (account_status = ANY (ARRAY['active'::text, 'suspended'::text, 'closed'::text]))
);

CREATE TABLE IF NOT EXISTS public.quality_inspections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  inspector_id uuid NOT NULL,
  decision inspection_decision DEFAULT 'pending'::inspection_decision NOT NULL,
  approved_category food_category,
  inspected_at timestamp with time zone,
  temperature_c numeric(6,2),
  packaging_condition text,
  appearance_condition text,
  odour_condition text,
  handling_notes text,
  rejection_reason text,
  evidence_urls text[] DEFAULT ARRAY[]::text[] NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT quality_inspections_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.recipient_requirements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organisation_id uuid NOT NULL,
  accepted_categories food_category[] DEFAULT ARRAY['human_consumption'::food_category] NOT NULL,
  requested_quantity numeric(12,3) NOT NULL,
  quantity_unit text DEFAULT 'kg'::text NOT NULL,
  storage_capacity_kg numeric(12,3),
  special_requirements text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT recipient_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT recipient_requirements_requested_quantity_check CHECK (requested_quantity > 0::numeric),
  CONSTRAINT recipient_requirements_storage_capacity_kg_check CHECK (storage_capacity_kg IS NULL OR storage_capacity_kg >= 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.safechain_events (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  allocation_id uuid,
  delivery_id uuid,
  event_type text NOT NULL,
  description text,
  recorded_by uuid,
  event_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  recorded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT safechain_events_pkey PRIMARY KEY (id),
  CONSTRAINT safechain_events_event_type_check CHECK (event_type = ANY (ARRAY['batch_created'::text, 'inspection_completed'::text, 'batch_approved'::text, 'batch_rejected'::text, 'allocation_created'::text, 'allocation_accepted'::text, 'pickup_confirmed'::text, 'in_transit'::text, 'delivered'::text, 'delivery_failed'::text, 'waste_processed'::text]))
);

CREATE TABLE IF NOT EXISTS public.volunteer_achievements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  volunteer_id uuid NOT NULL,
  achievement_code text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  awarded_at timestamp with time zone DEFAULT now() NOT NULL,
  awarded_by uuid,
  CONSTRAINT volunteer_achievements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.waste_processing_partners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organisation_id uuid NOT NULL,
  accepted_materials text[] DEFAULT ARRAY[]::text[] NOT NULL,
  processing_methods text[] DEFAULT ARRAY[]::text[] NOT NULL,
  capacity_kg_per_day numeric(12,3),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT waste_processing_partners_pkey PRIMARY KEY (id),
  CONSTRAINT waste_processing_partners_capacity_kg_per_day_check CHECK (capacity_kg_per_day IS NULL OR capacity_kg_per_day >= 0::numeric)
);

CREATE TABLE IF NOT EXISTS public.waste_processing_records (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  batch_id uuid NOT NULL,
  processor_organisation_id uuid NOT NULL,
  quantity_processed numeric(12,3) NOT NULL,
  unit text DEFAULT 'kg'::text NOT NULL,
  processing_method text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  processed_by uuid,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT waste_processing_records_pkey PRIMARY KEY (id),
  CONSTRAINT valid_processing_times CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
  CONSTRAINT waste_processing_records_processing_method_check CHECK (processing_method = ANY (ARRAY['composting'::text, 'anaerobic_digestion'::text, 'animal_feed_processing'::text, 'recycling'::text, 'other'::text])),
  CONSTRAINT waste_processing_records_quantity_processed_check CHECK (quantity_processed > 0::numeric),
  CONSTRAINT waste_processing_records_status_check CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  CONSTRAINT waste_processing_records_unit_check CHECK (unit = ANY (ARRAY['kg'::text, 'litre'::text, 'unit'::text]))
);

-- ============================================================================
-- 5. UNIQUE CONSTRAINTS & FOREIGN KEYS
-- ============================================================================
ALTER TABLE public.batch_qr_codes ADD CONSTRAINT batch_qr_codes_batch_id_key UNIQUE (batch_id);
ALTER TABLE public.batch_qr_codes ADD CONSTRAINT batch_qr_codes_qr_token_key UNIQUE (qr_token);
ALTER TABLE public.certificates ADD CONSTRAINT certificates_certificate_code_key UNIQUE (certificate_code);
ALTER TABLE public.delivery_confirmations ADD CONSTRAINT delivery_confirmations_delivery_task_id_key UNIQUE (delivery_task_id);
ALTER TABLE public.food_batches ADD CONSTRAINT food_batches_batch_code_key UNIQUE (batch_code);
ALTER TABLE public.impact_methodologies ADD CONSTRAINT impact_methodologies_methodology_code_version_key UNIQUE (methodology_code, version);
ALTER TABLE public.organisation_members ADD CONSTRAINT organisation_members_organisation_id_user_id_key UNIQUE (organisation_id, user_id);
ALTER TABLE public.volunteer_achievements ADD CONSTRAINT volunteer_achievements_volunteer_id_achievement_code_key UNIQUE (volunteer_id, achievement_code);
ALTER TABLE public.waste_processing_partners ADD CONSTRAINT waste_processing_partners_organisation_id_key UNIQUE (organisation_id);

ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.batch_events ADD CONSTRAINT batch_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.batch_events ADD CONSTRAINT batch_events_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.batch_qr_codes ADD CONSTRAINT batch_qr_codes_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_issued_by_fkey FOREIGN KEY (issued_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.certificates ADD CONSTRAINT certificates_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.delivery_confirmations ADD CONSTRAINT delivery_confirmations_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.delivery_confirmations ADD CONSTRAINT delivery_confirmations_delivery_task_id_fkey FOREIGN KEY (delivery_task_id) REFERENCES delivery_tasks(id) ON DELETE RESTRICT;
ALTER TABLE public.delivery_tasks ADD CONSTRAINT delivery_tasks_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES food_allocations(id) ON DELETE RESTRICT;
ALTER TABLE public.delivery_tasks ADD CONSTRAINT delivery_tasks_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.food_allocations ADD CONSTRAINT food_allocations_allocated_by_fkey FOREIGN KEY (allocated_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.food_allocations ADD CONSTRAINT food_allocations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.food_allocations ADD CONSTRAINT food_allocations_recipient_organisation_id_fkey FOREIGN KEY (recipient_organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE public.food_batches ADD CONSTRAINT food_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.food_batches ADD CONSTRAINT food_batches_donor_organisation_id_fkey FOREIGN KEY (donor_organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE public.food_deliveries ADD CONSTRAINT food_deliveries_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES food_allocations(id) ON DELETE RESTRICT;
ALTER TABLE public.food_deliveries ADD CONSTRAINT food_deliveries_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.impact_metrics ADD CONSTRAINT impact_metrics_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE SET NULL;
ALTER TABLE public.impact_records ADD CONSTRAINT impact_records_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.impact_records ADD CONSTRAINT impact_records_delivery_task_id_fkey FOREIGN KEY (delivery_task_id) REFERENCES delivery_tasks(id) ON DELETE RESTRICT;
ALTER TABLE public.impact_records ADD CONSTRAINT impact_records_methodology_id_fkey FOREIGN KEY (methodology_id) REFERENCES impact_methodologies(id) ON DELETE RESTRICT;
ALTER TABLE public.organisation_members ADD CONSTRAINT organisation_members_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE public.organisation_members ADD CONSTRAINT organisation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE public.organisations ADD CONSTRAINT organisations_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.processing_confirmations ADD CONSTRAINT processing_confirmations_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.processing_confirmations ADD CONSTRAINT processing_confirmations_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.processing_confirmations ADD CONSTRAINT processing_confirmations_processor_id_fkey FOREIGN KEY (processor_id) REFERENCES waste_processing_partners(id) ON DELETE RESTRICT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.quality_inspections ADD CONSTRAINT quality_inspections_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.quality_inspections ADD CONSTRAINT quality_inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.recipient_requirements ADD CONSTRAINT recipient_requirements_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE public.safechain_events ADD CONSTRAINT safechain_events_allocation_id_fkey FOREIGN KEY (allocation_id) REFERENCES food_allocations(id) ON DELETE SET NULL;
ALTER TABLE public.safechain_events ADD CONSTRAINT safechain_events_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.safechain_events ADD CONSTRAINT safechain_events_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES food_deliveries(id) ON DELETE SET NULL;
ALTER TABLE public.safechain_events ADD CONSTRAINT safechain_events_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.volunteer_achievements ADD CONSTRAINT volunteer_achievements_awarded_by_fkey FOREIGN KEY (awarded_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.volunteer_achievements ADD CONSTRAINT volunteer_achievements_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.waste_processing_partners ADD CONSTRAINT waste_processing_partners_organisation_id_fkey FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;
ALTER TABLE public.waste_processing_records ADD CONSTRAINT waste_processing_records_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES food_batches(id) ON DELETE RESTRICT;
ALTER TABLE public.waste_processing_records ADD CONSTRAINT waste_processing_records_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE public.waste_processing_records ADD CONSTRAINT waste_processing_records_processor_organisation_id_fkey FOREIGN KEY (processor_organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT;

-- ============================================================================
-- 6. INDEXES
-- ============================================================================
CREATE INDEX idx_achievements_volunteer ON public.volunteer_achievements USING btree (volunteer_id);
CREATE INDEX idx_allocations_batch ON public.food_allocations USING btree (batch_id);
CREATE INDEX idx_allocations_recipient ON public.food_allocations USING btree (recipient_organisation_id);
CREATE INDEX idx_allocations_status ON public.food_allocations USING btree (status);
CREATE INDEX idx_audit_events_actor ON public.audit_events USING btree (actor_id);
CREATE INDEX idx_audit_events_created ON public.audit_events USING btree (created_at DESC);
CREATE INDEX idx_audit_events_entity ON public.audit_events USING btree (entity_type, entity_id);
CREATE INDEX idx_batch_events_batch ON public.batch_events USING btree (batch_id, created_at DESC);
CREATE INDEX idx_batch_events_type ON public.batch_events USING btree (event_type);
CREATE INDEX idx_batches_category_status ON public.food_batches USING btree (category, status);
CREATE INDEX idx_batches_donor ON public.food_batches USING btree (donor_organisation_id);
CREATE INDEX idx_batches_pickup_deadline ON public.food_batches USING btree (pickup_deadline);
CREATE INDEX idx_batches_status ON public.food_batches USING btree (status);
CREATE INDEX idx_certificates_volunteer ON public.certificates USING btree (volunteer_id);
CREATE INDEX idx_delivery_status ON public.delivery_tasks USING btree (status);
CREATE INDEX idx_delivery_volunteer ON public.delivery_tasks USING btree (volunteer_id);
CREATE INDEX idx_food_deliveries_allocation ON public.food_deliveries USING btree (allocation_id);
CREATE INDEX idx_food_deliveries_status ON public.food_deliveries USING btree (status);
CREATE INDEX idx_food_deliveries_volunteer ON public.food_deliveries USING btree (volunteer_id);
CREATE INDEX idx_impact_batch ON public.impact_records USING btree (batch_id);
CREATE INDEX idx_impact_delivery ON public.impact_records USING btree (delivery_task_id);
CREATE INDEX idx_impact_metric_type ON public.impact_records USING btree (metric_type, recorded_at DESC);
CREATE INDEX idx_impact_metrics_organisation ON public.impact_metrics USING btree (organisation_id);
CREATE INDEX idx_impact_metrics_type_period ON public.impact_metrics USING btree (metric_type, reporting_period_start, reporting_period_end);
CREATE INDEX idx_inspections_batch ON public.quality_inspections USING btree (batch_id, created_at DESC);
CREATE INDEX idx_org_location ON public.organisations USING gist (location);
CREATE INDEX idx_org_members_user ON public.organisation_members USING btree (user_id);
CREATE INDEX idx_org_verification ON public.organisations USING btree (verification_status);
CREATE INDEX idx_processing_batch ON public.processing_confirmations USING btree (batch_id);
CREATE INDEX idx_safechain_allocation ON public.safechain_events USING btree (allocation_id);
CREATE INDEX idx_safechain_batch ON public.safechain_events USING btree (batch_id, recorded_at);
CREATE INDEX idx_safechain_delivery ON public.safechain_events USING btree (delivery_id);
CREATE INDEX idx_safechain_event_type ON public.safechain_events USING btree (event_type);
CREATE INDEX idx_volunteer_achievements_awarded ON public.volunteer_achievements USING btree (awarded_at);
CREATE INDEX idx_volunteer_achievements_volunteer ON public.volunteer_achievements USING btree (volunteer_id);
CREATE INDEX idx_waste_processing_batch ON public.waste_processing_records USING btree (batch_id);
CREATE INDEX idx_waste_processing_processor ON public.waste_processing_records USING btree (processor_organisation_id);
CREATE INDEX idx_waste_processing_status ON public.waste_processing_records USING btree (status);

-- ============================================================================
-- 7. VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW public.available_food_batches AS
SELECT b.id,
    b.batch_code,
    b.donor_organisation_id,
    o.name AS donor_name,
    o.address AS donor_address,
    b.food_name,
    b.description,
    b.category,
    b.quantity,
    b.quantity_unit,
    b.estimated_weight_kg,
    b.best_before_at,
    b.pickup_deadline,
    b.status,
    b.created_at
   FROM food_batches b
     JOIN organisations o ON o.id = b.donor_organisation_id
  WHERE (b.status = ANY (ARRAY['approved'::food_batch_status, 'partially_allocated'::food_batch_status])) AND (b.category = ANY (ARRAY['human_consumption'::food_category, 'animal_appropriate'::food_category])) AND o.verification_status = 'verified'::verification_status AND (b.best_before_at IS NULL OR b.best_before_at > now());

CREATE OR REPLACE VIEW public.delivery_summary AS
SELECT d.id AS delivery_task_id,
    d.status AS delivery_status,
    d.volunteer_id,
    d.assigned_at,
    d.delivered_at,
    a.id AS allocation_id,
    a.batch_id,
    a.recipient_organisation_id,
    a.allocated_quantity,
    a.quantity_unit,
    c.received_quantity,
    c.confirmed_at
   FROM delivery_tasks d
     JOIN food_allocations a ON a.id = d.allocation_id
     LEFT JOIN delivery_confirmations c ON c.delivery_task_id = d.id;

CREATE OR REPLACE VIEW public.impact_summary AS
SELECT metric_type,
    unit,
    sum(metric_value) AS total_value,
    count(*) AS record_count,
    count(*) FILTER (WHERE is_estimate) AS estimated_record_count
   FROM impact_records
  WHERE verification_status = 'verified'::verification_status
  GROUP BY metric_type, unit;

CREATE OR REPLACE VIEW public.v_allocation_summary AS
SELECT status,
    count(*) AS allocation_count,
    COALESCE(sum(allocated_quantity), 0::numeric) AS total_allocated_quantity
   FROM food_allocations
  GROUP BY status;

CREATE OR REPLACE VIEW public.v_delivery_summary AS
SELECT status,
    count(*) AS delivery_count
   FROM food_deliveries
  GROUP BY status;

CREATE OR REPLACE VIEW public.v_food_batch_summary AS
SELECT status,
    category,
    count(*) AS batch_count,
    COALESCE(sum(quantity), 0::numeric) AS total_quantity
   FROM food_batches
  GROUP BY status, category;

CREATE OR REPLACE VIEW public.v_waste_processing_summary AS
SELECT status,
    processing_method,
    count(*) AS record_count,
    COALESCE(sum(quantity_processed), 0::numeric) AS total_quantity_processed
   FROM waste_processing_records
  GROUP BY status, processing_method;

CREATE OR REPLACE VIEW public.volunteer_delivery_summary AS
SELECT p.id AS volunteer_id,
    p.full_name,
    count(d.id) FILTER (WHERE d.status = 'delivered'::delivery_status) AS completed_deliveries,
    count(d.id) FILTER (WHERE d.status = ANY (ARRAY['assigned'::delivery_status, 'accepted'::delivery_status, 'pickup_confirmed'::delivery_status, 'in_transit'::delivery_status])) AS active_deliveries
   FROM profiles p
     LEFT JOIN delivery_tasks d ON d.volunteer_id = p.id
  GROUP BY p.id, p.full_name;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================
CREATE TRIGGER delivery_confirmation_mark_delivered AFTER INSERT ON delivery_confirmations FOR EACH ROW EXECUTE FUNCTION mark_task_delivered();
CREATE TRIGGER delivery_confirmation_validate BEFORE INSERT OR UPDATE ON delivery_confirmations FOR EACH ROW EXECUTE FUNCTION validate_delivery_confirmation();
CREATE TRIGGER delivery_tasks_audit AFTER INSERT OR DELETE OR UPDATE ON delivery_tasks FOR EACH ROW EXECUTE FUNCTION log_delivery_event();
CREATE TRIGGER delivery_tasks_updated_at BEFORE UPDATE ON delivery_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER allocations_audit AFTER INSERT OR DELETE OR UPDATE ON food_allocations FOR EACH ROW EXECUTE FUNCTION log_allocation_event();
CREATE TRIGGER allocations_refresh_batch AFTER INSERT OR DELETE OR UPDATE ON food_allocations FOR EACH ROW EXECUTE FUNCTION refresh_batch_allocation_status();
CREATE TRIGGER allocations_updated_at BEFORE UPDATE ON food_allocations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER food_allocation_validate BEFORE INSERT OR UPDATE OF batch_id, allocated_quantity, quantity_unit, status ON food_allocations FOR EACH ROW EXECUTE FUNCTION validate_food_allocation();
CREATE TRIGGER food_batches_audit AFTER INSERT OR UPDATE OF status ON food_batches FOR EACH ROW EXECUTE FUNCTION log_batch_lifecycle_event();
CREATE TRIGGER food_batches_updated_at BEFORE UPDATE ON food_batches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_food_deliveries_updated_at BEFORE UPDATE ON food_deliveries FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER processing_confirmation_validate BEFORE INSERT OR UPDATE ON processing_confirmations FOR EACH ROW EXECUTE FUNCTION validate_processing_confirmation();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER quality_inspection_apply_result AFTER INSERT ON quality_inspections FOR EACH ROW EXECUTE FUNCTION apply_inspection_result();
CREATE TRIGGER trg_apply_inspection_result AFTER INSERT ON quality_inspections FOR EACH ROW EXECUTE FUNCTION apply_inspection_result();
CREATE TRIGGER recipient_requirements_updated_at BEFORE UPDATE ON recipient_requirements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER waste_partners_updated_at BEFORE UPDATE ON waste_processing_partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_waste_processing_updated_at BEFORE UPDATE ON waste_processing_records FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.batch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipient_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_processing_partners ENABLE ROW LEVEL SECURITY;
