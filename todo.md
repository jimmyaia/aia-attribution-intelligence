# Attribution Intelligence — Micro-SaaS Expansion

## Phase 1: Full-stack upgrade
- [x] Run webdev_add_feature to upgrade to web-db-user (database + auth + backend)
- [x] Confirm database schema: users, subscriptions, google_ads_connections, ghl_connections

## Phase 2: Auth + Payments
- [x] Login / auth flow (Manus OAuth)
- [x] Stripe subscription checkout ($49/month Starter plan)
- [x] Stripe webhook handler for subscription activation/cancellation
- [x] Stripe customer portal (manage/cancel subscription)
- [x] Subscription status banner in dashboard

## Phase 3: Admin Backend
- [x] Dashboard shell with sidebar navigation (Attribution Report, Integrations, Billing)
- [x] Landing page with hero, features, and pricing CTA
- [x] Pricing page with $49/month Starter plan card
- [x] Billing page — subscription status + Stripe checkout + portal
- [x] Integrations page — Google Ads OAuth placeholder + GHL API key form

## Phase 4: Google Ads OAuth
- [ ] Google OAuth 2.0 flow (authorize → callback → store tokens)
- [ ] Store encrypted access_token + refresh_token in DB per user
- [ ] Show connected Google Ads account name + customer ID in Integrations page
- [ ] Disconnect / reconnect button

## Phase 5: GoHighLevel API Key
- [x] GHL API key input form in Integrations page
- [x] Save + validate GHL API key (backend tRPC procedure)
- [x] Show connected GHL sub-account name in Integrations page
- [x] Disconnect button
- [x] Actually call GHL API to validate key on save (backend implementation)

## Phase 6: Live Data
- [ ] Replace mock campaign data with Google Ads API calls (using stored tokens)
- [ ] Replace mock lead data with GHL API calls (form submissions + inbound calls)
- [ ] Cache API responses to avoid rate limits

## Phase 7: Checkpoint + Delivery
- [ ] Save checkpoint
- [ ] Deliver to user with summary

## Phase 8: Registration & Login Flow Fix
- [x] Add profile fields to users table: firstName, lastName, phone, website, businessName
- [x] Push DB migration for new profile fields
- [x] Add tRPC procedure to save/update full profile
- [x] Build Registration/Onboarding page (first name, last name, email, phone, website, business name)
- [x] Show onboarding page automatically after first login if profile is incomplete
- [x] Add visible Login button to landing page header
- [x] Add visible Sign Up / Get Started CTA that goes to login then onboarding
- [x] Fix post-login redirect to check profile completeness and route accordingly

## Phase 9: Google Ads OAuth
- [ ] Implement Google Ads OAuth 2.0 authorize URL endpoint
- [ ] Implement Google Ads OAuth callback handler (exchange code, store tokens)
- [ ] Show connected Google Ads account info in Integrations page
- [ ] Google Ads disconnect/reconnect button

## Phase 10: Date Range Picker + Admin Panel
- [x] Add date range picker to dashboard header (Last 7/30 days, custom range)
- [x] Admin panel: list all registered agencies + subscription status
- [ ] Replace shared dashboard mock reporting with tenant-scoped data or a per-agency no-data state

## Phase 12: Best-in-Class Admin Area
- [x] Enforce admin-only access for all admin routes and procedures
- [x] Build an admin overview with agency, subscription, and integration-status summaries
- [x] Build a searchable agency directory with onboarding and connection status
- [x] Build an agency detail view with customer profile, billing, and integration context
- [x] Build a guided manual onboarding flow to create agency accounts and temporary credentials
- [x] Add safe admin actions for password reset and onboarding-state management
- [x] Add admin authorization and onboarding workflow regression tests
- [x] Verify desktop and mobile admin routes
- [x] Save the verified admin-area implementation in a checkpoint

## Phase 11: Live Data Integration
- [ ] Replace mock campaign data with Google Ads API calls
- [ ] Replace mock lead data with GHL API calls (form submissions + inbound calls)
- [ ] Cache API responses to avoid rate limits

## Project Backup
- [x] Create a private GitHub repository backup of the current AIA Attribution Intelligence source code
- [x] Create a downloadable ZIP archive backup of the current project source code
- [x] Synchronize the latest verified cleanup checkpoint to the private GitHub repository

## Administrator Access
- [x] Create the requested master administrator account
- [x] Verify the master account password and protected admin access end to end

## Codebase Cleanup Audit
- [x] Audit and remove clearly unused or abandoned application code, files, and routes
- [x] Fix verified broken-code findings and add regression coverage where appropriate
- [x] Run TypeScript checks, tests, production build, and route verification after cleanup
- [x] Verify protected dashboard routes render correctly after cleanup
