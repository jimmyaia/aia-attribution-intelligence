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
- [ ] Actually call GHL API to validate key on save (backend implementation)

## Phase 6: Live Data
- [ ] Replace mock campaign data with Google Ads API calls (using stored tokens)
- [ ] Replace mock lead data with GHL API calls (form submissions + inbound calls)
- [ ] Cache API responses to avoid rate limits

## Phase 7: Checkpoint + Delivery
- [ ] Save checkpoint
- [ ] Deliver to user with summary

## Phase 8: Registration & Login Flow Fix
- [ ] Add profile fields to users table: firstName, lastName, phone, website, businessName
- [ ] Push DB migration for new profile fields
- [ ] Add tRPC procedure to save/update full profile
- [ ] Build Registration/Onboarding page (first name, last name, email, phone, website, business name)
- [ ] Show onboarding page automatically after first login if profile is incomplete
- [ ] Add visible Login button to landing page header
- [ ] Add visible Sign Up / Get Started CTA that goes to login then onboarding
- [ ] Fix post-login redirect to check profile completeness and route accordingly
