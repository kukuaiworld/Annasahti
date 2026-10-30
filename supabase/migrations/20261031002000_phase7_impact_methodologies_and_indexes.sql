-- FoodLoop Phase 7: Impact Intelligence Dashboard Indexes and Methodologies

-- 1. Performance indexes for date-bounded analytics aggregation
CREATE INDEX IF NOT EXISTS idx_delivery_tasks_delivered_at 
ON public.delivery_tasks USING btree (delivered_at DESC) 
WHERE status = 'delivered';

CREATE INDEX IF NOT EXISTS idx_delivery_tasks_allocation_id 
ON public.delivery_tasks USING btree (allocation_id);

CREATE INDEX IF NOT EXISTS idx_waste_processing_completed_at 
ON public.waste_processing_records USING btree (completed_at DESC) 
WHERE status = 'completed';

-- 2. Seed versioned, documented calculation methodologies
INSERT INTO public.impact_methodologies (
  methodology_code,
  version,
  description,
  source_reference,
  assumptions,
  is_active
)
VALUES
(
  'MEAL_EQUIVALENT_GFN_V1',
  '1.0.0',
  'Standard calculation of meal equivalents from edible surplus food delivered for human consumption.',
  'Global FoodBanking Network (GFN) & WRAP UK benchmark: 1 meal equivalent = 0.42 kg (420g) of prepared food.',
  '{"kg_per_meal": 0.42, "meals_per_kg": 2.38095, "excluded_categories": ["animal_appropriate", "organic_waste"], "minimum_edible_threshold_percent": 100}'::jsonb,
  true
),
(
  'CO2E_AVOIDED_EPA_WARM_V1',
  '1.0.0',
  'Estimated avoided greenhouse gas emissions (CO2e) from diverting edible food and organic waste from landfills.',
  'US EPA Waste Reduction Model (WARM) v16 & IPCC Guidelines for National GHG Inventories.',
  '{"human_food_diversion_kg_co2e_per_kg": 2.50, "animal_feed_diversion_kg_co2e_per_kg": 2.10, "composting_diversion_kg_co2e_per_kg": 0.52, "biogas_anaerobic_kg_co2e_per_kg": 0.78, "baseline": "Municipal solid waste landfill with standard methane recovery", "gwp_timeframe": "100-year GWP (IPCC AR6)"}'::jsonb,
  true
)
ON CONFLICT (methodology_code, version) DO UPDATE
SET
  description = EXCLUDED.description,
  source_reference = EXCLUDED.source_reference,
  assumptions = EXCLUDED.assumptions,
  is_active = EXCLUDED.is_active;
