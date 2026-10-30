# FoodLoop — Surplus Food Rescue & Distribution Platform

FoodLoop connects food donors (restaurants, hotels, caterers), humanitarian NGOs, volunteers, and waste-processing facilities to eliminate food waste and fight hunger.

## Database Architecture

FoodLoop uses **Supabase PostgreSQL** as its primary database. Database migrations are version-controlled under `supabase/migrations/`.

### Schema Summary
The database includes:
- **Extensions**: `uuid-ossp`, `pgcrypto`, `postgis` (geospatial routing for pickups and dropoffs).
- **Custom Enum Types**:
  - `app_role` (`donor`, `recipient`, `volunteer`, `inspector`, `admin`)
  - `organisation_type` (`restaurant`, `hotel`, `caterer`, `humanitarian_ngo`, `orphanage`, `government_school`, `old_age_home`, `animal_welfare_ngo`, `waste_processor`, `other`)
  - `verification_status` (`pending`, `verified`, `rejected`, `suspended`)
  - `food_category` (`human_consumption`, `animal_appropriate`, `organic_waste`)
  - `food_batch_status` (`pending_inspection`, `approved`, `partially_allocated`, `allocated`, `in_transit`, `completed`, `rejected`, `expired`, `cancelled`)
  - `allocation_status` (`pending`, `accepted`, `partially_fulfilled`, `fulfilled`, `cancelled`, `expired`)
  - `delivery_status` (`assigned`, `accepted`, `pickup_confirmed`, `in_transit`, `delivered`, `failed`, `cancelled`)
  - `inspection_decision` (`pending`, `approved_human`, `approved_animal`, `rejected`, `requires_review`, `approved_organic_waste`)
  - `impact_metric_type` (`human_meals_delivered`, `animal_food_kg_delivered`, `organic_waste_kg_processed`, `co2e_avoided_kg_estimated`)
- **Core Entities & Tables**:
  - `profiles`: User profiles linked to Supabase Auth.
  - `organisations` & `organisation_members`: Donors, NGOs, and processing partners with PostGIS geographic coordinates.
  - `recipient_requirements`: Target food categories, quotas, and dietary requirements.
  - `food_batches`: Surplus batches with quantity, deadlines, storage instructions, and verification status.
  - `quality_inspections`: Food safety inspections and decision records.
  - `food_allocations`: Matching surplus batches to recipient organisations.
  - `delivery_tasks` & `food_deliveries`: Volunteer task assignments, pickup/delivery tracking, and transit times.
  - `delivery_confirmations`: Recipient receipts, quantity verification, and photographic evidence.
  - `batch_qr_codes` & `batch_events`: Chain-of-custody tracking from donor to recipient.
  - `waste_processing_partners` & `waste_processing_records`: Diverting non-edible organic waste for composting or animal feed.
  - `impact_records`, `impact_methodologies`, `impact_metrics`: Quantitative sustainability and hunger relief metrics.
  - `certificates` & `volunteer_achievements`: Volunteer recognition and milestone badges.
  - `safechain_events` & `audit_events`: Immutable audit logging.
- **Views**:
  - `available_food_batches` (filtered by active balance and verified human checks)
  - `delivery_discrepancies` (audit and logistics view for physical loss, missing, and damaged food)
  - `delivery_summary`
  - `impact_summary`
  - `volunteer_delivery_summary`
  - `v_food_batch_summary`, `v_allocation_summary`, `v_delivery_summary`, `v_waste_processing_summary`
- **Security & Integrity (Hardened in Migration 20261030231500)**:
  - **Accurate Quantity Accounting**: Parent/child batch splitting, dynamic available balances (`available_quantity`), and concurrency locking preventing double-allocation.
  - **Strict Human Safety Verification**: AI models strictly prevented from approving food for consumption; human inspector credential validation; species-specific checks for animal feed.
  - **Multi-Tenant Row Level Security (RLS)**: 26 granular RLS policies enforcing tenant isolation between donors, recipients, volunteers, and distinct platform vs. organisation admin tiers.
  - **Physical Delivery Loss Accounting**: Full reconciliation of received vs damaged vs missing quantities with mandatory discrepancy reporting.
  - **Data Preservation**: 100% non-destructive idempotent migrations preserving historical food records and audits.

---

## Supabase CLI Setup & Migrations Workflow

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- Supabase CLI:
  ```bash
  npm install -D supabase
  # or invoke directly with npx
  npx supabase --version
  ```

### 1. Authenticate with Supabase CLI
```bash
npx supabase login
```

### 2. Link Local Project to Remote Supabase Instance
Link your project using your project reference:
```bash
npx supabase link --project-ref <your-project-ref>
```

### 3. Review Existing Migrations
All schema changes are located in:
```
supabase/migrations/
```
Inspect each SQL file to understand database structure, custom types, functions, and triggers.

### 4. Creating Future Migrations
Create a new timestamped migration file:
```bash
npx supabase migration new <migration_name>
```
Edit the generated `.sql` file in `supabase/migrations/` with your schema changes.

### 5. Applying Migrations
> **IMPORTANT**: Always test migrations on a local or staging database before deploying to production.

- **To a local database**:
  ```bash
  npx supabase db reset
  ```
- **To a linked remote database (after thorough review)**:
  ```bash
  npx supabase db push
  ```

---

## Environment Variables

Copy `.env.example` to `.env` (never commit `.env` or credentials to git):

```bash
cp .env.example .env
```

Required variables:
```dotenv
# Supabase Project Credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
SUPABASE_JWKS_URL=https://your-project-ref.supabase.co/auth/v1/.well-known/jwks.json

# Client Aliases (for Next.js / React Frontend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key
```

---

## Repository Structure

```
FoodLoop/
├── supabase/
│   ├── config.toml           # Supabase local and project configuration
│   └── migrations/
│       └── 20261030131817_foodloop_initial_schema.sql  # Captured FoodLoop schema
├── backend/                  # Backend application services (to be added)
├── frontend/                 # Frontend client application (to be added)
├── .env.example              # Sanitized environment template (no real secrets)
├── .gitignore                # Excludes secrets, temporary files, and node_modules
└── README.md                 # Project documentation and migration guide
```
