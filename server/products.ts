// ─── Stripe Products & Pricing ────────────────────────────────────────────────
// Attribution Intelligence — $49/month Starter Plan

export const PLANS = {
  starter: {
    name: "Starter",
    description: "Connect 1 Google Ads account + 1 GoHighLevel sub-account",
    priceMonthly: 4900, // cents
    displayPrice: "$49",
    interval: "month" as const,
    features: [
      "1 Google Ads account",
      "1 GoHighLevel sub-account",
      "Full attribution dashboard",
      "Campaign, Ad Group & Ad level reporting",
      "Form + Phone call lead tracking",
      "Won deal & revenue tracking",
      "Cost per lead & cost per sale KPIs",
      "Weekly trend sparklines",
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
