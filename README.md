# Annasathi

### A platform for responsible food redistribution, animal welfare support, and organic-waste management

Annasathi is a digital platform designed to reduce food waste by
connecting people and organisations that have surplus food with
organisations and communities that can use it. Instead of allowing
usable food to be thrown away, Annasathi helps guide each food batch
through inspection, classification, allocation, collection, delivery, or
appropriate waste processing.

The central idea is simple: **not all surplus food should follow the
same route**. Its condition and suitability should determine what
happens next.

Annasathi provides three main routes:

1.  **Human-consumption food** --- food that has been inspected and
    approved for people.
2.  **Animal-appropriate food** --- food that has been inspected and
    judged suitable for an appropriate animal-use route.
3.  **Organic waste** --- material that is not suitable for consumption
    but can be accepted by an appropriate organic-waste processor.

Food that is unsafe, contaminated, or otherwise unsuitable must be
rejected or sent for an appropriate safe-disposal process. It must never
be automatically redirected to people or animals.

------------------------------------------------------------------------

## Table of Contents

-   [The Problem](#the-problem)
-   [Our Solution](#our-solution)
-   [Project Goals](#project-goals)
-   [Who Uses Annasathi](#who-uses-foodloop)
-   [How Annasathi Works](#how-foodloop-works)
-   [Core Features](#core-features)
-   [The Three Food Categories](#the-three-food-categories)
-   [End-to-End Examples](#end-to-end-examples)
-   [System Design](#system-design)
-   [Technology Stack](#technology-stack)
-   [Frontend Structure](#frontend-structure)
-   [Database and Data Management](#database-and-data-management)
-   [Security and Trust](#security-and-trust)
-   [Impact and Recognition](#impact-and-recognition)
-   [Innovation and Differentiation](#innovation-and-differentiation)
-   [Future Scope](#future-scope)
-   [Project Status](#project-status)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [Development Guidelines](#development-guidelines)
-   [Contributing](#contributing)

------------------------------------------------------------------------

## The Problem

Food waste and food insecurity can exist at the same time. Restaurants,
food businesses, institutions, and other donors may have surplus food,
while non-profit organisations and communities may need food support.

There are several practical problems:

-   Donors may not know which nearby organisation can use their surplus
    food.
-   Recipients may not know what food is available or when it must be
    collected.
-   Food quality and suitability need to be checked before
    redistribution.
-   Human organisations, animal welfare organisations, and waste
    processors have different requirements.
-   Collection and delivery can be difficult to coordinate.
-   Once food leaves the donor, it can be difficult to follow its
    journey.
-   Food that cannot be consumed may still have a suitable
    waste-processing route.
-   It can be difficult to measure how much food was rescued and how
    much waste was diverted.

Annasathi is designed to bring these activities into one organised
workflow.

## Our Solution

Annasathi connects donors, inspectors, recipient organisations,
volunteers, and waste processors through a shared platform.

A donor creates a food batch with its quantity, description, preparation
details, expiry information, storage conditions, and pickup location. A
verified inspector or authorised volunteer can review the batch and
record its quality assessment. Based on that assessment, the batch can
be directed to the appropriate route.

The platform then helps the relevant organisations discover or receive
the batch, coordinate allocation and collection, and record the final
outcome.

Annasathi also provides batch traceability, dashboards, reports, and
recognition features so that contributions and outcomes can be
understood.

## Project Goals

-   Reduce avoidable food waste.
-   Make surplus-food donation easier to organise.
-   Help eligible human-serving organisations access suitable food.
-   Connect animal welfare organisations with food that is appropriate
    for their needs.
-   Direct suitable organic waste to responsible processing.
-   Make food inspection and classification visible and traceable.
-   Improve coordination between donors, recipients, volunteers, and
    processors.
-   Provide a record of each batch's journey.
-   Measure food rescue, distribution, and waste-diversion outcomes.
-   Recognise the contributions of donors and volunteers.

------------------------------------------------------------------------

## Who Uses Annasathi

Annasathi supports different user roles. Each role sees the pages and
actions relevant to its work.

### 1. Donors

Examples include restaurants, hotels, caterers, grocery stores, food
businesses, and institutions.

Donors can:

-   Create and manage food donation listings.
-   Add food descriptions, images, quantities, and units.
-   Enter preparation, availability, and expiry information.
-   Provide storage and handling details.
-   Add ingredient and allergen information when available.
-   Set pickup locations and collection time windows.
-   View inspection decisions.
-   Track allocations, pickups, and deliveries.
-   View donation history and contribution summaries.

### 2. Human recipient organisations

Examples include NGOs, orphanages, government schools, old-age homes,
community kitchens, and other eligible organisations serving people.

They can:

-   Create an organisation profile.
-   Describe their food requirements and capacity.
-   Browse food approved for human consumption.
-   Filter available food by category, location, quantity, and
    collection time.
-   Review batch information and inspection outcomes.
-   Accept or decline an allocation.
-   Track incoming food.
-   Confirm receipt and report discrepancies.
-   View their distribution history.

### 3. Animal welfare organisations

Examples include animal shelters, animal-care NGOs, and other eligible
animal welfare organisations.

They can:

-   Maintain an organisation profile and describe their needs.
-   Provide relevant animal-care and capacity information.
-   Browse food assigned to the animal-appropriate route.
-   Review available batch and suitability information.
-   Accept or decline suitable allocations.
-   Coordinate collection or delivery.
-   Confirm receipt and report problems.
-   View their contribution and receipt history.

Food is not considered suitable for animals merely because it is
unsuitable for people. Suitability must be assessed for the intended
animal use, and relevant restrictions must be followed.

### 4. Volunteers

Volunteers help with activities such as inspection support, pickup, and
delivery, depending on their authorisation and assigned
responsibilities.

They can:

-   Create a volunteer profile.
-   View available or assigned tasks.
-   Review pickup and drop-off instructions.
-   View relevant batch information.
-   Confirm collection.
-   Update delivery progress.
-   Upload proof of delivery where required.
-   Report delays or failed deliveries.
-   View completed tasks and contribution history.
-   Earn platform recognition, certificates, and eligible goodies.

Annasathi does not use cash bounties as the volunteer incentive model.
Its recognition approach focuses on certificates, goodies, achievements,
and appreciation on the platform.

### 5. Inspectors

Inspectors are authorised users who review food batches and record
quality and suitability decisions. Depending on the operating model, a
trained and authorised volunteer may also perform an inspection task.

They can:

-   View the inspection queue.
-   Review batch details, images, dates, and storage information.
-   Complete an inspection checklist.
-   Add observations and notes.
-   Select the appropriate classification outcome.
-   Reject unsafe or unsuitable food.
-   Mark a batch for further review.
-   View previous inspection decisions.

Food quality decisions are recorded by authorised human inspectors or
trained and authorised volunteers. The platform does not automate
food-safety approval.

### 6. Waste processors

Examples include eligible composting facilities and other permitted
organic-waste processors.

They can:

-   Maintain their organisation profile.
-   Describe accepted material and processing capabilities.
-   Provide processing capacity information.
-   Browse suitable organic-waste batches.
-   Accept or decline a processing task.
-   Record incoming quantity.
-   Record the processing method and status.
-   Add processing notes and completion information.
-   View processing history and waste-diversion summaries.

### 7. Administrators

Administrators oversee platform activity and organisation management.

They can:

-   View the platform overview.
-   Review user and organisation profiles.
-   Review organisation verification requests.
-   Manage account and organisation statuses.
-   Monitor batches, inspections, allocations, and deliveries.
-   Review reported problems.
-   View activity and audit records.
-   Access platform-level reports and analytics.

------------------------------------------------------------------------

## How Annasathi Works

The complete workflow is designed around a food batch.

### Step 1: A donor lists surplus food

The donor opens the donation form and enters the food details, quantity,
preparation information, expiry information, storage conditions, and
pickup location.

A unique batch reference helps identify the donation throughout its
journey.

### Step 2: The batch is reviewed

An authorised inspector or volunteer reviews the available information
and the food's physical condition according to the inspection process.

The inspection screen records observations, notes, and the decision. The
decision is made by a human reviewer.

### Step 3: The batch is classified

The batch is directed to one of the appropriate routes:

-   Human consumption.
-   Animal-appropriate use.
-   Organic-waste processing.
-   Rejected or further review.

The classification depends on the recorded quality and suitability
assessment, not simply on the donor's selected category.

### Step 4: The right organisation is identified

Annasathi displays or recommends organisations that match the route and
the batch details.

For example:

-   Human-consumption food can be shown to eligible NGOs, orphanages,
    schools, and old-age homes.
-   Animal-appropriate food can be shown to eligible animal welfare
    organisations.
-   Organic waste can be shown to processors that accept that material.

The organisation's requirements, location, capacity, and collection
window can help guide matching.

### Step 5: Allocation is recorded

The relevant organisation accepts or declines the allocation. The
interface displays the allocated quantity and the quantity remaining.

Where supported, one batch can be divided among multiple eligible
recipients or destinations without allocating more than the available
quantity.

### Step 6: Pickup and delivery are coordinated

A volunteer or other authorised delivery participant can be assigned.
The delivery interface shows pickup details, destination, instructions,
and progress.

The user can record pickup, transit, delivery, and proof-of-delivery
information.

### Step 7: Receipt or processing is confirmed

For a human or animal recipient, the receiving organisation confirms the
quantity received and can report a discrepancy.

For organic waste, the processor records the incoming quantity,
processing method, and processing outcome.

### Step 8: The batch journey is available for review

The batch timeline brings together important events, such as donation,
inspection, classification, allocation, pickup, delivery, and
processing.

Dashboards and reports can then show recorded outcomes.

------------------------------------------------------------------------

## Core Features

### A. Food donation management

-   Create, edit, and manage donation listings.
-   Record food name, description, category, and images.
-   Record quantity and measurement unit.
-   Record preparation and availability details.
-   Record expiry or best-before information.
-   Record storage and handling conditions.
-   Record ingredient and allergen details where available.
-   Record pickup location and collection window.
-   View donation status and history.
-   View batch details and its journey.

### B. Manual food quality inspection

-   Inspection queue and batch detail screen.
-   Inspection checklist and observations.
-   Quality notes and supporting images.
-   Inspector identity and inspection time display.
-   Human, animal-appropriate, organic-waste, rejected, and review
    outcomes.
-   Inspection history and decision summary.
-   Clear status display for each batch.

Food quality inspection is a human-led process. AI features, if
introduced, are intended to assist with information and recommendations
rather than replace an authorised inspection decision.

### C. Three-way food classification

This is one of the central features of Annasathi.

#### Human-consumption route

-   Displays food approved for people.
-   Connects it with eligible human-serving organisations.
-   Shows recipient requirements and capacity.
-   Supports allocation, collection, delivery, and receipt confirmation.

#### Animal-appropriate route

-   Displays food approved for the relevant animal-use route.
-   Separates animal welfare organisations from human-serving
    organisations.
-   Shows relevant suitability information and organisation
    requirements.
-   Supports allocation, collection, delivery, and receipt confirmation.

#### Organic-waste route

-   Displays material suitable for an accepted organic-waste process.
-   Connects it with eligible waste processors.
-   Shows accepted material and processing capabilities.
-   Supports processing records and completion status.

#### Rejected or review route

-   Records why a batch was rejected or needs further review.
-   Prevents unsuitable food from being presented as approved food.
-   Keeps the decision visible in the batch history.

### D. Organisation discovery and matching

-   Separate organisation types and profiles.
-   Organisation requirements and capacity information.
-   Search and filters.
-   Location-based discovery.
-   Category-specific organisation listings.
-   Suggested matches and match explanations, where available.
-   Alternative recipient or processor suggestions.

### E. Allocation management

-   Create and view allocations.
-   Accept or decline an allocation.
-   Record allocated and remaining quantities.
-   Support partial allocation where implemented.
-   Show allocation status and history.
-   Display the next action required.

### F. Volunteer and delivery management

-   Volunteer profile and task list.
-   Pickup and delivery details.
-   Task assignment and status.
-   Pickup confirmation.
-   In-transit and delivery updates.
-   Proof-of-delivery upload.
-   Delivery notes and issue reporting.
-   Delivery history.
-   Volunteer contribution summary.

### G. SafeChain batch traceability

SafeChain is Annasathi's batch journey and traceability feature.

It provides a chronological view of important batch events, such as:

-   Donation created.
-   Inspection completed.
-   Classification recorded.
-   Allocation accepted.
-   Volunteer assigned.
-   Food picked up.
-   Food delivered.
-   Recipient receipt confirmed.
-   Waste received by a processor.
-   Processing completed.

A QR code can be associated with a batch so that an authorised user can
open its traceability page.

SafeChain should be understood as a traceability and event-history
feature. It should not be described as blockchain-based unless a
blockchain implementation is actually added.

### H. Waste processing management

-   Waste processor profiles.
-   Available organic-waste batches.
-   Processing task acceptance.
-   Processing method and quantity records.
-   Processing status and notes.
-   Completion or failure records.
-   Processing history.
-   Waste-diversion summaries.

### I. Dashboards and analytics

-   Donor dashboard.
-   Human recipient dashboard.
-   Animal welfare organisation dashboard.
-   Volunteer dashboard.
-   Inspector dashboard.
-   Waste processor dashboard.
-   Administrator dashboard.
-   Donation and allocation summaries.
-   Food quantity by classification.
-   Delivery and processing statistics.
-   Organisation-level contribution summaries.
-   Daily, weekly, and monthly trends.
-   Impact reports and export interfaces.

All impact numbers should be calculated from actual recorded data.
Estimates should be clearly labelled as estimates.

### J. Recognition and achievements

#### Volunteer recognition

-   Completed task history.
-   Volunteer contribution summary.
-   Achievement milestones.
-   Recognition badges.
-   Certificates.
-   Eligible goodies and platform recognition.

#### Donor recognition

-   Donation contribution history.
-   Donor leaderboard and rankings.
-   Contribution milestones.
-   Recognition and certificates, where configured.

The platform's recognition system is intended to encourage consistent
participation and acknowledge meaningful contributions.

### K. Notifications and alerts

-   New donation notifications.
-   Inspection result notifications.
-   Allocation updates.
-   Volunteer assignment alerts.
-   Pickup and delivery reminders.
-   Near-expiry alerts.
-   Processing status updates.
-   Organisation verification updates.
-   Reported issue notifications.

### L. Administrator interface

-   User and organisation management.
-   Organisation verification review.
-   Account status management.
-   Batch and inspection monitoring.
-   Allocation and delivery monitoring.
-   Waste-processing monitoring.
-   Reported issue review.
-   Audit and activity views.
-   Platform analytics.

### M. Maps and location features

-   Donor and recipient location display.
-   Animal welfare organisation locations.
-   Waste processor locations.
-   Food availability map.
-   Location search and filters.
-   Pickup and drop-off route preview.
-   Distance and estimated travel time, where supported.
-   Multi-stop route suggestions as an advanced capability.

------------------------------------------------------------------------

## The Three Food Categories

Annasathi's classification approach is based on inspection and
suitability.

  -----------------------------------------------------------------------
  Route                   What it means           Where it goes
  ----------------------- ----------------------- -----------------------
  Human consumption       Inspected and approved  Eligible NGOs,
                          for people              orphanages, government
                                                  schools, old-age homes,
                                                  community organisations

  Animal-appropriate      Inspected and judged    Eligible animal welfare
                          suitable for the        organisations and
                          intended animal use     shelters

  Organic waste           Not suitable for        Eligible composting or
                          consumption but         other organic-waste
                          accepted for an         processors
                          appropriate processing  
                          route                   

  Rejected / review       Unsafe, contaminated,   Further review or
                          uncertain, or otherwise appropriate safe
                          unsuitable              disposal; not normal
                                                  distribution
  -----------------------------------------------------------------------

**Example:** A restaurant has 30 kg of surplus food. After inspection,
20 kg may be approved for human consumption, 5 kg may be suitable for a
specifically assessed animal-use route, and 5 kg may be directed to an
appropriate organic-waste process. These quantities are only an example;
the actual decision depends on the inspection and the batch condition.

Food that is completely expired or unsuitable must not automatically be
treated as animal food. It may enter an organic-waste route only if the
material and local rules permit it. Unsafe or hazardous material
requires an appropriate rejection or disposal process.

------------------------------------------------------------------------

## End-to-End Examples

### Example 1: A restaurant donates food for people

A restaurant has 25 meal portions left at the end of the day.

1.  The restaurant creates a donation listing.
2.  It enters the quantity, preparation time, expiry information,
    storage details, and pickup location.
3.  An authorised inspector checks the food.
4.  The inspector approves the suitable quantity for human consumption.
5.  Annasathi shows the batch to eligible nearby organisations.
6.  An orphanage accepts the allocation.
7.  A volunteer receives the pickup task.
8.  The volunteer confirms collection and later records delivery.
9.  The orphanage confirms receipt.
10. The donor and organisation can view the batch journey and recorded
    contribution.

The result is a documented food-rescue journey instead of an informal
handover with no shared record.

### Example 2: Food is suitable for an animal welfare organisation

A food donor lists a surplus batch that is not approved for human
distribution but may be suitable for a particular animal-use route.

1.  The donor creates the batch.
2.  An authorised inspector reviews the batch and its suitability for
    the intended animal use.
3.  The batch is classified for the animal-appropriate route.
4.  Annasathi displays it to eligible animal welfare organisations.
5.  An organisation reviews the details and accepts the allocation.
6.  Collection or delivery is coordinated.
7.  The organisation confirms receipt.
8.  The batch history records the outcome.

The important point is that animal distribution is a separate route with
its own suitability assessment and recipient requirements.

### Example 3: Food is not suitable for consumption

A batch is found unsuitable for human and animal consumption but is
accepted by an organic-waste processor.

1.  The inspector records the assessment.
2.  The batch is classified for an appropriate organic-waste process.
3.  Annasathi displays the batch to suitable processors.
4.  A processor accepts the task.
5.  The material is transferred to the processor.
6.  The processor records the received quantity and processing method.
7.  The processor records completion or reports a problem.
8.  Annasathi updates the batch history and waste-diversion records.

This helps document a responsible route for material that should not be
distributed as food.

### Example 4: A volunteer completes a delivery

A volunteer signs in and views available tasks.

1.  The volunteer opens a task.
2.  The volunteer reviews pickup and drop-off information.
3.  The volunteer accepts the task if eligible.
4.  The volunteer confirms pickup.
5.  The volunteer updates the delivery status.
6.  The volunteer uploads proof of delivery if required.
7.  The recipient confirms receipt.
8.  The volunteer's contribution history is updated.
9.  Eligible milestones, certificates, and recognition can be displayed.

------------------------------------------------------------------------

## System Design

Annasathi follows a modular client-server architecture. The frontend
presents role-specific interfaces, the backend handles application
operations and permissions, and Supabase provides the PostgreSQL
database and related managed services.

### High-level architecture

``` text
                         ANNASATHI USERS
                                |
       -------------------------------------------------
       |          |          |          |               |
     Donor     Recipient  Volunteer  Inspector       Admin
       |          |          |          |               |
       -------------------------------------------------
                                |
                         FRONTEND APPLICATION
                    Next.js + React + TypeScript
                    Tailwind CSS + shadcn/ui
                                |
                         BACKEND API LAYER
                         Node.js + TypeScript
                         REST API endpoints
                                |
          -------------------------------------------------
          |                  |                            |
     Supabase Auth      Application Logic           File Storage
          |                  |                            |
          -------------------------------------------------
                                |
                       SUPABASE POSTGRESQL
                       + PostGIS extension
                                |
          -------------------------------------------------
          |          |          |          |              |
        Users     Batches   Inspections  Allocations   Deliveries
          |          |          |          |              |
          -------------------------------------------------
                                |
                 Traceability, Processing and Analytics
                                |
                   FRONTEND DASHBOARDS AND REPORTS
```

### Main system layers

#### 1. Presentation layer

The presentation layer contains the pages and components used by donors,
recipients, inspectors, volunteers, processors, and administrators.

It is responsible for:

-   Displaying information.
-   Collecting user input.
-   Showing validation feedback.
-   Presenting dashboards, charts, maps, and timelines.
-   Showing loading, empty, and error states.
-   Adapting the interface to different screen sizes.

#### 2. Application and API layer

The backend layer handles the application's operations.

Examples include:

-   Creating and updating food batches.
-   Recording inspection decisions.
-   Managing allocations.
-   Assigning delivery tasks.
-   Updating delivery status.
-   Recording processing events.
-   Preparing dashboard data.
-   Checking permissions before sensitive operations.

#### 3. Authentication and authorisation layer

This layer identifies users and controls which actions they can perform.

For example, a donor can manage their own donations, while an inspector
can access authorised inspection tasks. An animal welfare organisation
should see the animal-appropriate route rather than the human recipient
workflow.

#### 4. Database layer

Supabase PostgreSQL stores structured project data. PostGIS can support
location-aware queries where configured.

The database stores information such as users, organisations, batches,
inspections, allocations, deliveries, traceability events, and
processing records.

#### 5. Storage and file layer

Storage can be used for food images, organisation documents, inspection
evidence, delivery proof, and generated certificates, subject to access
permissions.

#### 6. Reporting and analytics layer

This layer turns recorded platform activity into summaries, charts, and
reports. Advanced forecasting and simulation capabilities can be added
as separate services.

------------------------------------------------------------------------

## Technology Stack

The following is the proposed technology stack for Annasathi. Confirm
exact package versions and integrations against the repository's
dependency files before publishing a release.

  ---------------------------------------------------------------------
  Technology                         Purpose in Annasathi
  ---------------------------------- ----------------------------------
  Next.js                            Frontend application framework and
                                     page routing

  React                              Building interactive user
                                     interfaces

  TypeScript                         Type-safe application code

  Tailwind CSS                       Styling and responsive layouts

  shadcn/ui                          Reusable interface components

  Node.js                            Backend JavaScript runtime

  TypeScript REST APIs               Application endpoints and business
                                     operations

  Supabase                           Managed backend platform and
                                     database services

  PostgreSQL                         Main relational database

  PostGIS                            Geographic data and location-based
                                     queries

  Supabase Auth                      User authentication, if enabled in
                                     the application

  Supabase Storage                   File storage, if configured

  Recharts                           Dashboard charts and data
                                     visualisation

  Google Maps Platform               Maps and route-related interfaces,
                                     if integrated
  ---------------------------------------------------------------------

### Why this stack?

-   **Next.js and React** help organise a large application into
    reusable pages and components.
-   **TypeScript** helps catch many coding mistakes during development.
-   **Tailwind CSS and shadcn/ui** support a consistent design system.
-   **Node.js and REST APIs** provide a place for application rules and
    controlled operations.
-   **PostgreSQL** stores related data in a structured way.
-   **Supabase** provides managed database and authentication
    capabilities.
-   **PostGIS** supports geographic queries such as finding
    organisations near a donation location.
-   **Recharts** helps turn donation and delivery records into
    understandable charts.
-   **Google Maps Platform** can help users understand locations and
    routes.

The green-and-white visual theme uses deep green for important actions
and navigation, white for main surfaces, and light green for highlights.
Text and status colours should remain readable and accessible.

------------------------------------------------------------------------

## Frontend Structure

A suggested modular frontend structure is:

``` text
annasathi/
|
|-- public/
|   |-- images/
|   |-- icons/
|   |-- branding/
|
|-- src/
|   |-- app/
|   |   |-- (public)/
|   |   |   |-- page.tsx
|   |   |   |-- about/
|   |   |   |-- contact/
|   |   |
|   |   |-- auth/
|   |   |   |-- login/
|   |   |   |-- register/
|   |   |   |-- forgot-password/
|   |   |
|   |   |-- dashboard/
|   |   |-- donor/
|   |   |-- recipient/
|   |   |-- animal-welfare/
|   |   |-- inspector/
|   |   |-- volunteer/
|   |   |-- processor/
|   |   |-- admin/
|   |   |-- batches/
|   |   |-- allocations/
|   |   |-- deliveries/
|   |   |-- safechain/
|   |   |-- analytics/
|   |   |-- settings/
|   |
|   |-- components/
|   |   |-- ui/
|   |   |-- layout/
|   |   |-- forms/
|   |   |-- dashboard/
|   |   |-- food/
|   |   |-- inspection/
|   |   |-- maps/
|   |   |-- charts/
|   |   |-- traceability/
|   |
|   |-- features/
|   |   |-- donations/
|   |   |-- classification/
|   |   |-- organisations/
|   |   |-- allocations/
|   |   |-- deliveries/
|   |   |-- volunteers/
|   |   |-- processing/
|   |   |-- analytics/
|   |
|   |-- lib/
|   |-- hooks/
|   |-- types/
|   |-- utils/
|
|-- README.md
|-- package.json
|-- tsconfig.json
```

This is a suggested organisation. It should be adapted to the existing
repository rather than replacing working project files.

------------------------------------------------------------------------

## Database and Data Management

Annasathi uses Supabase PostgreSQL as its main database.

The database is responsible for keeping the relationships between users,
organisations, donations, inspections, allocations, deliveries, and
processing records consistent.

The main logical data areas include:

  ---------------------------------------------------------------------
  Data area                          What it represents
  ---------------------------------- ----------------------------------
  Users and roles                    User accounts and role information

  Organisations                      Donors, recipients, animal
                                     organisations, processors, and
                                     other organisation profiles

  Memberships                        Relationships between users and
                                     organisations

  Food batches                       Donation details, quantity, dates,
                                     location, and current status

  Inspections                        Inspector, inspection result,
                                     observations, and decision history

  Allocations                        Which organisation receives or
                                     processes a quantity

  Deliveries                         Volunteer assignment, pickup,
                                     transit, and delivery details

  Traceability events                Chronological events connected to
                                     a batch

  Waste processing                   Processor, incoming quantity,
                                     method, and outcome

  Achievements                       Volunteer and donor milestones and
                                     recognition

  Notifications                      User-facing activity updates

  Audit records                      Important actions and their
                                     history
  ---------------------------------------------------------------------

The exact table and column names should match the existing Supabase
migrations. This README describes the logical data areas, not a
replacement database schema.

------------------------------------------------------------------------

## Security and Trust

Annasathi handles information about users, organisations, food batches,
and delivery activities. Security is therefore part of the system
design.

Important requirements include:

-   Role-based access to pages and actions.
-   Organisation-level data access controls.
-   Server-side permission checks for sensitive operations.
-   Supabase Row Level Security policies where applicable.
-   Input validation and safe error handling.
-   Restricted access to uploaded documents and delivery evidence.
-   Protection of secret keys and environment variables.
-   Audit records for important actions.
-   Careful handling of personal contact and location information.

A hidden frontend button is not a security control. The backend and
database must independently verify whether the user is allowed to
perform an action.

------------------------------------------------------------------------

## Impact and Recognition

Annasathi aims to make its results understandable through recorded
activity.

Possible impact measures include:

-   Total quantity of food donated.
-   Quantity approved for human consumption.
-   Quantity distributed to human recipients.
-   Quantity distributed through the animal-appropriate route.
-   Quantity sent to organic-waste processing.
-   Quantity rejected or sent for further review.
-   Number of completed allocations.
-   Number of completed deliveries.
-   Number of participating organisations.
-   Volunteer contributions.
-   Processing quantities and outcomes.

Environmental impact values, such as estimated waste diversion or
emissions avoided, should use a documented calculation method and must
be labelled as estimates when they are not directly measured.

### Recognition

Annasathi encourages participation through appreciation and visible
contributions.

-   Donors can see their donation history and contribution ranking.
-   Volunteers can see their completed work and achievements.
-   Volunteers can receive certificates, eligible goodies, and
    recognition on the platform.
-   Organisations can view their recorded contributions and impact.

------------------------------------------------------------------------

## Innovation and Differentiation

Annasathi is designed around more than a simple food-listing page.

### 1. Three distinct destinations for surplus food

Many food donation workflows focus mainly on connecting surplus food
with people. Annasathi also considers an animal-appropriate route and an
organic-waste processing route.

This makes the classification and destination decision a central part of
the workflow.

### 2. Organisation-type-aware distribution

A school, orphanage, old-age home, animal shelter, and composting
facility do not have the same requirements.

Annasathi separates these organisation types so that a batch can be
directed to a relevant destination.

### 3. Human-led quality assessment

An authorised person reviews the food and records the decision. This
keeps inspection responsibility visible and avoids presenting an
unverified automated prediction as a safety approval.

### 4. Batch-level traceability

SafeChain brings important events together in a batch timeline, making
it easier to understand where a donation came from and what happened to
it.

### 5. A documented end outcome

Annasathi aims to record not only that food was donated, but also
whether it was allocated, delivered, received, or processed.

### 6. Recognition for participation

Donor contribution summaries and volunteer certificates and recognition
help make participation visible.

------------------------------------------------------------------------

## Future Scope

The following capabilities can be developed in later stages:

### Route and geographic intelligence

-   Location-based organisation discovery.
-   Pickup and drop-off route optimisation.
-   Multi-stop delivery planning.
-   Geographic supply and demand heatmaps.
-   Identification of underserved areas.

### Network analysis

-   Visualise connections between donors, recipients, volunteers, and
    processors.
-   Identify distribution bottlenecks.
-   Understand capacity gaps.
-   Analyse how food moves through the network.

### Digital Twin

A future Digital Twin interface could allow administrators to test
hypothetical situations before changing real operations.

For example:

-   What happens if the number of donations increases?
-   What happens if a recipient organisation becomes unavailable?
-   How many volunteers are needed for a particular delivery volume?
-   Which areas may have unmet food requirements?
-   How would a change in processing capacity affect organic-waste
    diversion?

These simulations would be decision-support tools, not replacements for
real operational records.

------------------------------------------------------------------------

## Project Status

Annasathi is being developed in stages.

The Supabase database foundation has been created and database setup has
been carried out through SQL queries. The frontend, API integration, and
advanced features should be tracked separately so that the project does
not claim functionality that has not yet been completed.

A suggested status checklist:

-   [x] Initial database foundation created in Supabase
-   [ ] Final database schema and relationships reviewed
-   [ ] Frontend design system completed
-   [ ] Public website completed
-   [ ] Authentication and role-specific navigation completed
-   [ ] Donor donation workflow completed
-   [ ] Manual inspection workflow completed
-   [ ] Human, animal-appropriate, and organic-waste routes completed
-   [ ] Recipient and processor workflows completed
-   [ ] Allocation workflow completed
-   [ ] Volunteer delivery workflow completed
-   [ ] SafeChain traceability interface completed
-   [ ] Waste processing workflow completed
-   [ ] Dashboards and analytics completed
-   [ ] Recognition and certificate interfaces completed
-   [ ] Admin interface completed
-   [ ] Backend integration and permissions tested

Update this section as features are implemented and tested. The initial
database setup does not mean the complete application is finished.

------------------------------------------------------------------------

## Getting Started

The exact commands depend on the repository's current package scripts.
For a standard Next.js project using npm:

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd annasathi
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a local `.env.local` file using the environment variable names
required by the application.

Do not commit real credentials or secret keys to GitHub.

### 4. Start the development server

``` bash
npm run dev
```

### 5. Open the application

Visit:

``` text
http://localhost:3000
```

If the repository has a separate backend service, follow its own setup
instructions and start it using the scripts defined in that backend's
`package.json`.

------------------------------------------------------------------------

## Environment Variables

The exact variable names must match the application's code and
deployment configuration. A typical setup may include:

``` env
# Supabase project configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend configuration
BACKEND_API_URL=

# Server-only credentials, if required
SUPABASE_SERVICE_ROLE_KEY=
```

Important:

-   Never put a service-role key in a `NEXT_PUBLIC_` variable.
-   Never commit `.env.local` or production credentials.
-   Use server-side environment variables for privileged operations.
-   Use only the minimum permissions needed by each service.
-   Check the existing code before adding or renaming environment
    variables.

------------------------------------------------------------------------

## Development Guidelines

To keep Annasathi maintainable:

1.  Build reusable components instead of duplicating the same UI.
2.  Keep donor, human recipient, animal welfare, volunteer, inspector,
    processor, and admin experiences clearly separated.
3.  Keep the three classification routes visually distinct.
4.  Display inspection decisions and their history clearly.
5.  Never present an unverified food batch as approved.
6.  Do not send rejected or unsuitable food into a normal distribution
    workflow.
7.  Keep quantities and allocation totals understandable.
8.  Show loading, empty, success, and error states on every important
    screen.
9.  Keep real data separate from demonstration or mock data.
10. Protect credentials and personal information.
11. Update this README when the actual architecture or implemented
    features change.

------------------------------------------------------------------------

## Contributing

Contributions that improve usability, accessibility, reliability, food
traceability, and responsible food distribution are welcome.

Before making a change:

1.  Understand the existing module and its role in the workflow.
2.  Avoid breaking existing database structures or API contracts.
3.  Follow the existing coding and design conventions.
4.  Test the affected user journey.
5.  Update relevant documentation.

------------------------------------------------------------------------

## Final Note

Annasathi is built around a simple belief: surplus food should be
handled responsibly, and its destination should depend on its actual
condition and suitability.

By bringing donors, inspectors, human-serving organisations, animal
welfare organisations, volunteers, and waste processors into one
coordinated workflow, Annasathi aims to make food recovery more
organised, traceable, and measurable.

**Annasathi --- Rescue food. Reduce waste. Make every contribution
count.**
