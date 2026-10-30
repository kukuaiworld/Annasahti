-- FoodLoop Phase 8: Volunteer Recognition and Rewards Schema

-- 1. Extend profiles with volunteer personalization and privacy controls
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb DEFAULT '{"show_full_name_on_leaderboard": true, "show_metrics_publicly": true}'::jsonb;

-- 2. Achievement and Badge Definitions Table
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  achievement_code text PRIMARY KEY,
  category text NOT NULL, -- 'delivery_milestone', 'rescue_volume', 'consistency', 'special'
  title text NOT NULL,
  description text NOT NULL,
  badge_icon text NOT NULL, -- Icon identifier or svg asset name
  threshold_type text NOT NULL, -- 'delivery_count', 'rescue_kg', 'manual'
  threshold_value numeric(12, 2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Seed authoritative milestone definitions
INSERT INTO public.achievement_definitions (
  achievement_code, category, title, description, badge_icon, threshold_type, threshold_value
)
VALUES
('FIRST_DELIVERY', 'delivery_milestone', 'First Rescue Mission', 'Completed first verified food rescue delivery', 'award-first-rescue', 'delivery_count', 1),
('DELIVERIES_10', 'delivery_milestone', 'Bronze Rescuer', 'Completed 10 verified food rescue missions', 'award-bronze', 'delivery_count', 10),
('DELIVERIES_50', 'delivery_milestone', 'Silver Rescuer', 'Completed 50 verified food rescue missions', 'award-silver', 'delivery_count', 50),
('DELIVERIES_100', 'delivery_milestone', 'Gold Rescuer', 'Completed 100 verified food rescue missions', 'award-gold', 'delivery_count', 100),
('RESCUE_100KG', 'rescue_volume', 'Centurion Lifesaver', 'Delivered over 100 kg of edible surplus food', 'scale-100kg', 'rescue_kg', 100),
('RESCUE_500KG', 'rescue_volume', 'Master Nourisher', 'Delivered over 500 kg of edible surplus food', 'scale-500kg', 'rescue_kg', 500),
('RESCUE_1000KG', 'rescue_volume', 'Metric Ton Rescuer', 'Delivered over 1,000 kg of edible surplus food', 'scale-1000kg', 'rescue_kg', 1000),
('COMMUNITY_CHAMPION', 'special', 'Community Champion', 'Recognized for outstanding dedication to community food rescue', 'shield-champion', 'manual', 0)
ON CONFLICT (achievement_code) DO UPDATE
SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  badge_icon = EXCLUDED.badge_icon,
  threshold_type = EXCLUDED.threshold_type,
  threshold_value = EXCLUDED.threshold_value,
  is_active = EXCLUDED.is_active;

-- 3. Volunteer of the Month Table
CREATE TABLE IF NOT EXISTS public.volunteer_of_the_month (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recognition_period text NOT NULL UNIQUE, -- 'YYYY-MM', e.g., '2026-10'
  volunteer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  selected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  selection_notes text NOT NULL,
  metrics_snapshot jsonb DEFAULT '{}'::jsonb NOT NULL,
  awarded_at timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_votm_period ON public.volunteer_of_the_month (recognition_period DESC);
CREATE INDEX IF NOT EXISTS idx_votm_volunteer ON public.volunteer_of_the_month (volunteer_id);

-- 4. Recognition Rewards / Goodies Catalogue
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL, -- 'merchandise', 'appreciation', 'event'
  required_achievement_code text REFERENCES public.achievement_definitions(achievement_code) ON DELETE SET NULL,
  min_deliveries_required int DEFAULT 0 NOT NULL,
  stock_quantity int DEFAULT 100 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Seed default reward catalog
INSERT INTO public.rewards (
  reward_code, title, description, category, required_achievement_code, min_deliveries_required, stock_quantity
)
VALUES
('FOODLOOP_BADGE_PIN', 'FoodLoop Enamel Volunteer Pin', 'High quality metallic volunteer pin for jackets/backpacks', 'merchandise', 'FIRST_DELIVERY', 1, 500),
('FOODLOOP_TSHIRT', 'FoodLoop Rescuer Organic Cotton T-Shirt', 'Official breathable FoodLoop field rescuer t-shirt', 'merchandise', 'DELIVERIES_10', 10, 200),
('COMMENDATION_LETTER', 'Official Letter of Commendation', 'Signed recognition letter from FoodLoop Director for service records', 'appreciation', 'DELIVERIES_50', 50, 9999),
('ANNUAL_GALA_INVITE', 'FoodLoop Annual Rescue Summit Invitation', 'VIP admission to the national Food Rescue & Sustainability Summit', 'event', 'DELIVERIES_100', 100, 50)
ON CONFLICT (reward_code) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  required_achievement_code = EXCLUDED.required_achievement_code,
  min_deliveries_required = EXCLUDED.min_deliveries_required,
  is_active = EXCLUDED.is_active;

-- 5. Reward Redemptions Table
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE RESTRICT NOT NULL,
  volunteer_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'rejected'
  request_notes text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  review_reason text,
  fulfillment_details text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT uq_volunteer_reward UNIQUE (reward_id, volunteer_id)
);

CREATE INDEX IF NOT EXISTS idx_redemptions_volunteer ON public.reward_redemptions (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.reward_redemptions (status);

-- 6. Enable RLS
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_of_the_month ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY "Public read active achievements" ON public.achievement_definitions FOR SELECT USING (true);
CREATE POLICY "Public read active rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Public read votm history" ON public.volunteer_of_the_month FOR SELECT USING (true);
CREATE POLICY "Volunteers view own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = volunteer_id);
