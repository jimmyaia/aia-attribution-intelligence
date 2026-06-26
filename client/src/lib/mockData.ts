// ─── Mock data representing Google Ads × GoHighLevel attribution ─────────────
// In production these values come from:
//   - Google Ads API: impressions, clicks, spend, CPC, CTR
//   - GoHighLevel API/webhooks: leads, opportunities, won deals, revenue

export interface AdData {
  id: string;
  headline: string;
  clicks: number;
  ctr: string;
  spend: number;
  leads: number;
  won: number;
  revenue: number;
}

export interface AdGroupData {
  id: string;
  name: string;
  clicks: number;
  spend: number;
  leads: number;
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
  leads: number;
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
    leads: 65,
    won: 10,
    revenue: 10000,
    adGroups: [
      {
        id: 'ag1',
        name: 'Brand – Exact Match',
        clicks: 72,
        spend: 118.00,
        leads: 32,
        won: 5,
        revenue: 5000,
        ads: [
          { id: 'a1', headline: 'Top Injury Lawyers Near You', clicks: 31, ctr: '6.2%', spend: 52, leads: 14, won: 3, revenue: 3000 },
          { id: 'a2', headline: 'Free Case Review – Call Now', clicks: 24, ctr: '5.8%', spend: 40, leads: 11, won: 1, revenue: 1000 },
          { id: 'a3', headline: 'Award-Winning Legal Team', clicks: 17, ctr: '4.1%', spend: 26, leads: 7, won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag2',
        name: 'Brand – Phrase Match',
        clicks: 48,
        spend: 95.00,
        leads: 21,
        won: 3,
        revenue: 3000,
        ads: [
          { id: 'a4', headline: 'Experienced Attorneys – Free Review', clicks: 28, ctr: '5.5%', spend: 55, leads: 13, won: 2, revenue: 2000 },
          { id: 'a5', headline: 'No Win No Fee – Call Today', clicks: 20, ctr: '4.9%', spend: 40, leads: 8, won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag3',
        name: 'Brand – Competitor',
        clicks: 34,
        spend: 69.27,
        leads: 12,
        won: 2,
        revenue: 2000,
        ads: [
          { id: 'a6', headline: 'Better Than [Competitor] – See Why', clicks: 34, ctr: '3.8%', spend: 69.27, leads: 12, won: 2, revenue: 2000 },
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
    leads: 35,
    won: 4,
    revenue: 4000,
    adGroups: [
      {
        id: 'ag4',
        name: "Workers' Comp – General",
        clicks: 55,
        spend: 968,
        leads: 22,
        won: 3,
        revenue: 3000,
        ads: [
          { id: 'a7', headline: 'Hurt at Work? Get Compensation', clicks: 30, ctr: '6.1%', spend: 529, leads: 13, won: 2, revenue: 2000 },
          { id: 'a8', headline: 'Workers Comp Lawyers – Free Consult', clicks: 25, ctr: '5.4%', spend: 439, leads: 9, won: 1, revenue: 1000 },
        ],
      },
      {
        id: 'ag5',
        name: "Workers' Comp – Specific Injuries",
        clicks: 36,
        spend: 635.56,
        leads: 13,
        won: 1,
        revenue: 1000,
        ads: [
          { id: 'a9', headline: 'Back Injury at Work – Call Now', clicks: 20, ctr: '5.9%', spend: 352, leads: 8, won: 1, revenue: 1000 },
          { id: 'a10', headline: 'Slip & Fall Workplace Accident', clicks: 16, ctr: '4.8%', spend: 283.56, leads: 5, won: 0, revenue: 0 },
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
    leads: 20,
    won: 2,
    revenue: 2000,
    adGroups: [
      {
        id: 'ag6',
        name: 'Local Services – All',
        clicks: 82,
        spend: 2086.23,
        leads: 20,
        won: 2,
        revenue: 2000,
        ads: [
          { id: 'a11', headline: 'Local Service Ad – Auto-Generated', clicks: 82, ctr: '5.28%', spend: 2086.23, leads: 20, won: 2, revenue: 2000 },
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
    leads: 12,
    won: 1,
    revenue: 1000,
    adGroups: [
      {
        id: 'ag7',
        name: 'Auto Accident – High Intent',
        clicks: 10,
        spend: 2520,
        leads: 8,
        won: 1,
        revenue: 1000,
        ads: [
          { id: 'a12', headline: 'Car Accident Attorney – Call Now', clicks: 6, ctr: '4.2%', spend: 1512, leads: 5, won: 1, revenue: 1000 },
          { id: 'a13', headline: 'Auto Accident? Get Max Settlement', clicks: 4, ctr: '3.1%', spend: 1008, leads: 3, won: 0, revenue: 0 },
        ],
      },
      {
        id: 'ag8',
        name: 'Truck Accident – Specialized',
        clicks: 5,
        spend: 1260.48,
        leads: 4,
        won: 0,
        revenue: 0,
        ads: [
          { id: 'a14', headline: '18-Wheeler Accident Lawyers', clicks: 5, ctr: '2.8%', spend: 1260.48, leads: 4, won: 0, revenue: 0 },
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
    leads: 5,
    won: 1,
    revenue: 500,
    adGroups: [
      {
        id: 'ag9',
        name: 'Display – Retargeting',
        clicks: 15,
        spend: 77.11,
        leads: 5,
        won: 1,
        revenue: 500,
        ads: [
          { id: 'a15', headline: 'Display Ad – Emergency Legal Help', clicks: 15, ctr: '0.08%', spend: 77.11, leads: 5, won: 1, revenue: 500 },
        ],
      },
    ],
  },
  {
    id: 'c6',
    name: 'Performance Max – Leads',
    status: 'paused',
    impressions: 0,
    clicks: 0,
    ctr: '0.00%',
    spend: 0,
    leads: 0,
    won: 0,
    revenue: 0,
    adGroups: [],
  },
  {
    id: 'c7',
    name: 'PMax – Auto & Truck (sLocal)',
    status: 'paused',
    impressions: 0,
    clicks: 0,
    ctr: '0.00%',
    spend: 0,
    leads: 0,
    won: 0,
    revenue: 0,
    adGroups: [],
  },
  {
    id: 'c8',
    name: "Bankruptcy Leads – Search",
    status: 'paused',
    impressions: 0,
    clicks: 0,
    ctr: '0.00%',
    spend: 0,
    leads: 0,
    won: 0,
    revenue: 0,
    adGroups: [],
  },
];

// Weekly trend data (4 weeks)
export const trendData = {
  weeks: ['Jun 1–7', 'Jun 8–14', 'Jun 15–21', 'Jun 22–26'],
  impressions: [5200, 8100, 10300, 2963],
  clicks: [72, 110, 140, 35],
  leads: [24, 48, 58, 12],
  won: [3, 6, 7, 2],
};

// Helpers
export function fmt$(n: number) {
  if (n === 0) return '$0.00';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}
export function fmtShort$(n: number) {
  if (n === 0) return '—';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}
export function cpc(spend: number, clicks: number) {
  if (!clicks) return '—';
  return `$${(spend / clicks).toFixed(2)}`;
}
export function cpl(spend: number, leads: number) {
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
