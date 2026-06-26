// ─── Mock data representing Google Ads × GoHighLevel attribution ─────────────
//
// DATA SOURCE RULES (important for production wiring):
//   Google Ads API  → impressions, clicks, spend, CPC, CTR  (ad performance only)
//   GoHighLevel API → formLeads, callLeads, opportunities, won, revenue
//
// CPL is calculated as:  spend ÷ (formLeads + callLeads)
// Google's own "conversions" column is intentionally NOT used for lead counting.
// GHL is the single source of truth for all lead, opportunity, and deal data.

export interface AdData {
  id: string;
  headline: string;
  clicks: number;
  ctr: string;
  spend: number;
  // GHL lead sources — Google conversions deliberately excluded
  formLeads: number;   // GHL: form submissions attributed via GCLID
  callLeads: number;   // GHL: inbound calls attributed via call tracking / GCLID
  won: number;
  revenue: number;
}

export interface AdGroupData {
  id: string;
  name: string;
  clicks: number;
  spend: number;
  formLeads: number;
  callLeads: number;
  won: number;
  revenue: number;
  ads: AdData[];
}

export interface CampaignData {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'ended';
  impressions: number;
  clicks: number;
  ctr: string;
  spend: number;
  formLeads: number;
  callLeads: number;
  won: number;
  revenue: number;
  adGroups: AdGroupData[];
}

export const campaigns: CampaignData[] = [
  {
    id: 'c1',
    name: 'Search – Brand Terms',
    status: 'active',
    impressions: 3078,
    clicks: 154,
    ctr: '5.00%',
    spend: 282.27,
    formLeads: 38,
    callLeads: 27,
    won: 10,
    revenue: 10000,
    adGroups: [
      {
        id: 'ag1',
        name: 'Brand – Exact Match',
        clicks: 72,
        spend: 118.00,
        formLeads: 18,
        callLeads: 14,
        won: 5,
        revenue: 5000,
        ads: [
          { id: 'a1', headline: 'Top Injury Lawyers Near You',    clicks: 31, ctr: '6.2%', spend: 52,  formLeads: 8,  callLeads: 6,  won: 3, revenue: 3000 },
          { id: 'a2', headline: 'Free Case Review – Call Now',    clicks: 24, ctr: '5.8%', spend: 40,  formLeads: 6,  callLeads: 5,  won: 1, revenue: 1000 },
          { id: 'a3', headline: 'Award-Winning Legal Team',       clicks: 17, ctr: '4.1%', spend: 26,  formLeads: 4,  callLeads: 3,  won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag2',
        name: 'Brand – Phrase Match',
        clicks: 48,
        spend: 95.00,
        formLeads: 13,
        callLeads: 8,
        won: 3,
        revenue: 3000,
        ads: [
          { id: 'a4', headline: 'Experienced Attorneys – Free Review', clicks: 28, ctr: '5.5%', spend: 55, formLeads: 8, callLeads: 5, won: 2, revenue: 2000 },
          { id: 'a5', headline: 'No Win No Fee – Call Today',           clicks: 20, ctr: '4.9%', spend: 40, formLeads: 5, callLeads: 3, won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag3',
        name: 'Brand – Competitor',
        clicks: 34,
        spend: 69.27,
        formLeads: 7,
        callLeads: 5,
        won: 2,
        revenue: 2000,
        ads: [
          { id: 'a6', headline: 'Better Than [Competitor] – See Why', clicks: 34, ctr: '3.8%', spend: 69.27, formLeads: 7, callLeads: 5, won: 2, revenue: 2000 },
        ],
      },
    ],
  },
  {
    id: 'c2',
    name: "Search – Workers' Compensation",
    status: 'active',
    impressions: 1548,
    clicks: 91,
    ctr: '5.88%',
    spend: 1603.56,
    formLeads: 20,
    callLeads: 15,
    won: 4,
    revenue: 4000,
    adGroups: [
      {
        id: 'ag4',
        name: "Workers' Comp – General",
        clicks: 55,
        spend: 968,
        formLeads: 13,
        callLeads: 9,
        won: 3,
        revenue: 3000,
        ads: [
          { id: 'a7', headline: 'Hurt at Work? Get Compensation',          clicks: 30, ctr: '6.1%', spend: 529, formLeads: 8, callLeads: 5, won: 2, revenue: 2000 },
          { id: 'a8', headline: "Workers Comp Lawyers – Free Consult",     clicks: 25, ctr: '5.4%', spend: 439, formLeads: 5, callLeads: 4, won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag5',
        name: "Workers' Comp – Specific Injuries",
        clicks: 36,
        spend: 635.56,
        formLeads: 7,
        callLeads: 6,
        won: 1,
        revenue: 1000,
        ads: [
          { id: 'a9',  headline: 'Back Injury at Work – Call Now',    clicks: 20, ctr: '5.9%', spend: 352,    formLeads: 4, callLeads: 4, won: 1, revenue: 1000 },
          { id: 'a10', headline: 'Slip & Fall Workplace Accident',    clicks: 16, ctr: '4.8%', spend: 283.56, formLeads: 3, callLeads: 2, won: 0, revenue: 0 },
        ],
      },
    ],
  },
  {
    id: 'c3',
    name: 'Local Services – Auto-Generated',
    status: 'active',
    impressions: 1552,
    clicks: 82,
    ctr: '5.28%',
    spend: 2086.23,
    formLeads: 8,
    callLeads: 12,
    won: 2,
    revenue: 2000,
    adGroups: [
      {
        id: 'ag6',
        name: 'Local Services – All',
        clicks: 82,
        spend: 2086.23,
        formLeads: 8,
        callLeads: 12,
        won: 2,
        revenue: 2000,
        ads: [
          { id: 'a11', headline: 'Local Service Ad – Auto-Generated', clicks: 82, ctr: '5.28%', spend: 2086.23, formLeads: 8, callLeads: 12, won: 2, revenue: 2000 },
        ],
      },
    ],
  },
  {
    id: 'c4',
    name: 'Search – Auto & Truck Accidents',
    status: 'active',
    impressions: 429,
    clicks: 15,
    ctr: '3.50%',
    spend: 3780.48,
    formLeads: 5,
    callLeads: 7,
    won: 1,
    revenue: 1000,
    adGroups: [
      {
        id: 'ag7',
        name: 'Auto Accident – High Intent',
        clicks: 10,
        spend: 2520,
        formLeads: 3,
        callLeads: 5,
        won: 1,
        revenue: 1000,
        ads: [
          { id: 'a12', headline: 'Car Accident Attorney – Call Now',        clicks: 6, ctr: '4.2%', spend: 1512,    formLeads: 2, callLeads: 3, won: 1, revenue: 1000 },
          { id: 'a13', headline: 'Auto Accident? Get Max Settlement',       clicks: 4, ctr: '3.1%', spend: 1008,    formLeads: 1, callLeads: 2, won: 0, revenue: 0 },
        ],
      },
      {
        id: 'ag8',
        name: 'Truck Accident – Specialized',
        clicks: 5,
        spend: 1260.48,
        formLeads: 2,
        callLeads: 2,
        won: 0,
        revenue: 0,
        ads: [
          { id: 'a14', headline: '18-Wheeler Accident Lawyers', clicks: 5, ctr: '2.8%', spend: 1260.48, formLeads: 2, callLeads: 2, won: 0, revenue: 0 },
        ],
      },
    ],
  },
  {
    id: 'c5',
    name: 'Display – Emergency Room #2',
    status: 'active',
    impressions: 19956,
    clicks: 15,
    ctr: '0.08%',
    spend: 77.11,
    formLeads: 3,
    callLeads: 2,
    won: 1,
    revenue: 500,
    adGroups: [
      {
        id: 'ag9',
        name: 'Display – Retargeting',
        clicks: 15,
        spend: 77.11,
        formLeads: 3,
        callLeads: 2,
        won: 1,
        revenue: 500,
        ads: [
          { id: 'a15', headline: 'Display Ad – Emergency Legal Help', clicks: 15, ctr: '0.08%', spend: 77.11, formLeads: 3, callLeads: 2, won: 1, revenue: 500 },
        ],
      },
    ],
  },
  {
    id: 'c6',
    name: 'Performance Max – Leads',
    status: 'paused',
    impressions: 0, clicks: 0, ctr: '0.00%', spend: 0,
    formLeads: 0, callLeads: 0, won: 0, revenue: 0,
    adGroups: [],
  },
  {
    id: 'c7',
    name: 'PMax – Auto & Truck (sLocal)',
    status: 'paused',
    impressions: 0, clicks: 0, ctr: '0.00%', spend: 0,
    formLeads: 0, callLeads: 0, won: 0, revenue: 0,
    adGroups: [],
  },
  {
    id: 'c8',
    name: 'Bankruptcy Leads – Search',
    status: 'paused',
    impressions: 0, clicks: 0, ctr: '0.00%', spend: 0,
    formLeads: 0, callLeads: 0, won: 0, revenue: 0,
    adGroups: [],
  },
];

// Weekly trend data (4 weeks) — GHL is source of truth for leads
export const trendData = {
  weeks: ['Jun 1–7', 'Jun 8–14', 'Jun 15–21', 'Jun 22–26'],
  impressions: [5200, 8100, 10300, 2963],
  clicks:      [72,   110,  140,   35],
  formLeads:   [14,   28,   35,    8],   // GHL form submissions
  callLeads:   [10,   20,   23,    4],   // GHL inbound calls
  won:         [3,    6,    7,     2],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function totalLeads(formLeads: number, callLeads: number) {
  return formLeads + callLeads;
}
export function fmt$(n: number) {
  if (n === 0) return '$0';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}
export function cpc(spend: number, clicks: number) {
  if (!clicks) return '—';
  return `$${(spend / clicks).toFixed(2)}`;
}
// CPL uses GHL total leads only — NOT Google conversions
export function cpl(spend: number, formLeads: number, callLeads: number) {
  const leads = formLeads + callLeads;
  if (!leads) return '—';
  return `$${(spend / leads).toFixed(2)}`;
}
export function cps(spend: number, won: number) {
  if (!won) return '—';
  return `$${(spend / won).toFixed(2)}`;
}
export function roas(revenue: number, spend: number): string {
  if (!spend || !revenue) return '—';
  return `${(revenue / spend).toFixed(1)}x`;
}
export function roasClass(revenue: number, spend: number): string {
  if (!spend || !revenue) return 'text-muted-foreground';
  const r = revenue / spend;
  if (r >= 3) return 'text-emerald-400 font-semibold';
  if (r >= 1) return 'text-amber-400 font-semibold';
  return 'text-rose-400 font-semibold';
}
export function convRate(leads: number, clicks: number): string {
  if (!clicks) return '—';
  return `${((leads / clicks) * 100).toFixed(1)}%`;
}
