# AnnaSathi 2.0 – Technical Architecture & Multi-Page Specification

## 1. System Overview
AnnaSathi is an intelligent surplus food recovery and redistribution infrastructure built as a **strict multi-page web application** using Next.js App Router, TypeScript, and Tailwind CSS.

The application bridges commercial surplus food generators (banquets, hotels, corporate kitchens) with verified recipient institutions (orphanages, night shelters, old age homes), animal welfare gaushalas, and industrial clean-energy bio-processors.

---

## 2. Dedicated Multi-Page Routing Architecture

### Public Pages (Dedicated URLs & Components)
- `/` – Introduction-only homepage with hero section, problem overview, feature previews, NGO photographs, role cards, testimonials, and footer.
- `/about` – Founding vision, operating pillars, and governance.
- `/problem-statement` – UNEP/FAO national food waste statistics, methane footprint, and systemic bottlenecks.
- `/how-it-works` – Step-by-step lifecycle and 4-tier food safety cascade.
- `/our-roles` – Detailed breakdown of the six distinct stakeholder portals.
- `/smart-matching` – Interactive algorithmic GIS radius & dietary simulator.
- `/food-trace` – Real-time FoodTrace batch tracking with QR code generation.
- `/impact` – ESG analytics, methane abatement, and water conservation metrics.
- `/volunteer-program` – Courier fleet classifications and onboarding guidelines.
- `/sustainability` – Life-cycle greenhouse gas reduction and bio-circular economy.
- `/contact` – 24/7 emergency dispatch hotline and regional hub routing.
- `/faq` – Categorized knowledge base.
- `/login` – Unified authentication with instant role demo switcher.
- `/register` – Stakeholder onboarding and license verification.
- `/forgot-password` – Password recovery workflow.

---

### Independent Role Portals

Each role has its own independent layout, sidebar navigation, header, and dedicated pages:

#### 1. Food Donors (`/donor/*`)
- `/donor/dashboard` – Operational overview, recent donations, and quick KPIs.
- `/donor/donations` – Complete consignment manifest with filterable statuses.
- `/donor/new-donation` – 60-second surplus food listing and broadcast form.
- `/donor/analytics` – Kitchen waste reduction and monthly diversion charts.
- `/donor/certificates` – Downloadable ESG carbon offset certificates.
- `/donor/settings` – Kitchen loading dock and FSSAI permit configuration.

#### 2. Volunteers & Couriers (`/volunteer/*`)
- `/volunteer/dashboard` – Mission control, active tasks, and vehicle status.
- `/volunteer/tasks` – Accept, inspect, and complete rescue missions.
- `/volunteer/routes` – Live simulated GPS turn-by-turn navigation.
- `/volunteer/leaderboard` – City and national courier rankings.
- `/volunteer/badges` – Digital honors, certificates, and karma points.
- `/volunteer/profile` – Fleet vehicle registration and thermal bag credentials.

#### 3. Recipient Shelters (`/recipient/*`)
- `/recipient/dashboard` – Shelter headcount, incoming meals, and ration budget savings.
- `/recipient/requests` – Meal demand tickets and match status.
- `/recipient/new-request` – Urgent meal ticket broadcasting.
- `/recipient/inventory` – Pantry stock, cold storage telemetry, and expiration dates.
- `/recipient/feedback` – Temperature verification and donor thank-you ratings.

#### 4. Animal Welfare & Gaushalas (`/animal-welfare/*`)
- `/animal-welfare/dashboard` – Rescued cattle count and Tier-3 feed metrics.
- `/animal-welfare/requests` – Fodder and produce trimming requirements.
- `/animal-welfare/feed-logs` – Ingestion manifest and dietary safety screening.
- `/animal-welfare/partners` – Directory of verified gaushalas and sanctuaries.

#### 5. Processing & Bio-Energy Partners (`/processor/*`)
- `/processor/dashboard` – Anaerobic digester throughput and clean gas output.
- `/processor/batches` – Industrial feedstock fermentation tracking.
- `/processor/qa-inspection` – Inbound slurry pH and moisture testing.
- `/processor/compost-biofuel` – BioCNG pressure telemetry and vermicompost curing.
- `/processor/reports` – Pollution control board circular economy dossiers.

#### 6. Central Admin Directorate (`/admin/*`)
- `/admin/login` – Discreet staff directorate authentication.
- `/admin/dashboard` – National command center and high-level KPIs.
- `/admin/users` – Universal directory of verified entities across all 6 roles.
- `/admin/verifications` – FSSAI permits and NGO Darpan license approval controls.
- `/admin/matching` – Algorithmic engine parameters and manual dispatch overrides.
- `/admin/inventory` – Master national surplus tracking ledger.
- `/admin/reports` – Consolidated government and NITI Aayog reporting dossiers.
- `/admin/logs` – Chronological tamper-evident platform audit trail.
- `/admin/settings` – Temperature thresholds and demo database reset control.

---

## 3. Four-Tier Food Safety Hierarchy

1. **Tier 1 (Immediate Human Consumption)**: Freshly cooked feast surplus maintained at &gt;60°C or &lt;5°C within 3-4 hours of preparation. Delivered to orphanages and night shelters.
2. **Tier 2 (Kitchen Preparation)**: Raw produce, bakery loaves, and unpeeled vegetables requiring kitchen preparation within 24-48 hours.
3. **Tier 3 (Animal Shelter Feed)**: Wholesome produce trimmings, grain mash, and unseasoned bread exceeding 6 hours in ambient temperature. Screened for toxicity and routed to gaushalas and canine shelters.
4. **Tier 4 (BioCNG & Industrial Compost)**: Fermented kitchen scraps and decomposed food unfit for ingestion. Loaded into anaerobic digesters to generate renewable energy and organic fertilizer. Zero landfill disposal.
