
# FoodLoop — Project Instructions

## Project
FoodLoop is a food rescue and recovery platform connecting food donors,
verified recipient organisations, volunteers and authorised waste processors.

## Backend technology
- Node.js LTS
- NestJS
- TypeScript with strict mode
- PostgreSQL with PostGIS
- Prisma ORM
- Redis and BullMQ for background jobs
- Docker Compose for local infrastructure
- REST APIs under /api/v1

## Architecture
Use a modular monolith. Do not introduce microservices.

Keep business logic inside NestJS modules and services.
Use DTOs and validation for incoming requests.
Use guards and role-based access control for protected operations.
Keep database access organised and avoid duplicate database clients.

## Food safety rules
- AI must never approve food as safe for human or animal consumption.
- Food must remain HOLD/UNVERIFIED until required human checks are complete.
- Human consumption and animal suitability are separate decisions.
- Animal food suitability must consider species-specific requirements.
- Spoiled, contaminated or expired food must never be automatically
  routed to animal consumption.
- Food allocation quantities must never exceed available quantities.
- Support parent and child batches with traceable quantities.

## Engineering rules
- Follow existing project conventions.
- Do not create duplicate modules, services or entities.
- Do not silently change the agreed architecture.
- Do not add dependencies without explaining why.
- Validate all API input.
- Handle errors explicitly.
- Write tests for implemented functionality.
- Keep secrets in environment variables.
- Never commit .env files, passwords, tokens or API keys.
- Keep .env.example free of real secrets.
- Do not run destructive database commands without explicit approval.
- Do not push, merge or commit without the owner's approval.

## Collaboration rules
- Only one agent may implement a particular task at a time.
- Reviewer agents must not modify implementation files unless asked.
- Before editing, inspect the existing repository.
- Before finishing, report:
  1. Files created or modified.
  2. Dependencies added.
  3. Commands executed.
  4. Tests and their results.
  5. Known issues and unfinished work.

## Initial milestone
Create a working NestJS backend foundation.
Do not implement authentication, food allocation, inspection,
matching or other business modules yet.
