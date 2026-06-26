import { useState } from 'react';
import {
  campaigns, trendData, totalLeads,
  fmt$, cpc, cpl, cps, roas, roasClass, convRate,
} from '@/lib/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ChevronRight, TrendingUp, TrendingDown, Minus,
  Eye, MousePointerClick, Users, Trophy, DollarSign,
  Zap, Target, BarChart2, RefreshCw, Calendar,
  FileText, Phone, Layers, ChevronDown,
} from 'lucide-react';

// ─── Date Range Picker ────────────────────────────────────────────────────────
type DateRange = { label: string; days: number | null };

const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days',  days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month',   days: null },
];

function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors"
      >
        <Calendar size={12} />
        <span>{value.label}</span>
        <ChevronDown size={11} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-xl border border-white/10 bg-card shadow-xl overflow-hidden">
          {DATE_RANGES.map(r => (
            <button
              key={r.label}
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                r.label === value.label
                  ? 'bg-blue-500/15 text-blue-400 font-medium'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lead view type ───────────────────────────────────────────────────────────
type LeadView = 'total' | 'forms' | 'calls';

const LEAD_VIEWS: { value: LeadView; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'total', label: 'Total',  icon: Layers,   color: 'text-cyan-400' },
  { value: 'forms', label: 'Forms',  icon: FileText, color: 'text-blue-400' },
  { value: 'calls', label: 'Calls',  icon: Phone,    color: 'text-emerald-400' },
];

function getLeadCount(formLeads: number, callLeads: number, view: LeadView) {
  if (view === 'forms') return formLeads;
  if (view === 'calls') return callLeads;
  return formLeads + callLeads;
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, delta, deltaDir, color, icon: Icon,
}: {
  label: string; value: string; sub?: string; delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral'; color: string; icon: React.ElementType;
}) {
  const deltaColor =
    deltaDir === 'up' ? 'text-emerald-400' :
    deltaDir === 'down' ? 'text-rose-400' : 'text-slate-400';
  const DeltaIcon =
    deltaDir === 'up' ? TrendingUp :
    deltaDir === 'down' ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-2 hover:border-white/15 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="kpi-value text-2xl text-foreground">{value}</div>
      <div className="flex items-center gap-2 mt-auto">
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        {delta && (
          <span className={`ml-auto flex items-center gap-0.5 text-xs font-medium ${deltaColor}`}>
            <DeltaIcon size={11} />
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── GHL Lead Split Mini Card ─────────────────────────────────────────────────
function LeadSplitCard({ formLeads, callLeads }: { formLeads: number; callLeads: number }) {
  const total = formLeads + callLeads;
  const formPct = total ? Math.round((formLeads / total) * 100) : 0;
  const callPct = total ? Math.round((callLeads / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-3 hover:border-white/15 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">GHL Lead Sources</span>
        <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">Source of Truth</span>
      </div>
      <div className="kpi-value text-2xl text-foreground">{total}</div>
      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden flex gap-px">
        <div className="h-full rounded-l-full bg-blue-400" style={{ width: `${formPct}%` }} />
        <div className="h-full rounded-r-full bg-emerald-400" style={{ width: `${callPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FileText size={11} className="text-blue-400" />
          <span>Forms</span>
          <span className="font-bold text-foreground">{formLeads}</span>
          <span className="text-muted-foreground/60">{formPct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Phone size={11} className="text-emerald-400" />
          <span>Calls</span>
          <span className="font-bold text-foreground">{callLeads}</span>
          <span className="text-muted-foreground/60">{callPct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sparkline Card ──────────────────────────────────────────────────────────
function SparkCard({
  label, data, weeks, color, formatter, badge,
}: {
  label: string; data: number[]; weeks: string[]; color: string;
  formatter?: (v: number) => string; badge?: string;
}) {
  const chartData = weeks.map((w, i) => ({ week: w, value: data[i] }));
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const pct = prev ? (((latest - prev) / prev) * 100).toFixed(0) : null;
  const up = pct !== null && Number(pct) >= 0;

  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-3 hover:border-white/15 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && (
            <span className="text-[9px] font-semibold uppercase tracking-wider bg-white/8 text-muted-foreground px-1.5 py-0.5 rounded">{badge}</span>
          )}
        </div>
        {pct !== null && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${up ? 'text-emerald-400' : 'text-rose-400'}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? '+' : ''}{pct}%
          </span>
        )}
      </div>
      <div className="kpi-value text-xl text-foreground">
        {formatter ? formatter(latest) : latest.toLocaleString()}
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#grad-${label})`} dot={false} />
          <XAxis dataKey="week" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color }}
            formatter={(v: number) => [formatter ? formatter(v) : v.toLocaleString(), '']}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {weeks.map(w => <span key={w}>{w.split('–')[0]}</span>)}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: 'active' | 'paused' | 'ended' }) {
  const map = {
    active: 'bg-emerald-400/15 text-emerald-400',
    paused: 'bg-amber-400/15 text-amber-400',
    ended:  'bg-slate-400/15 text-slate-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : status === 'paused' ? 'bg-amber-400' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
}

// ─── Table cell helpers ───────────────────────────────────────────────────────
const Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-2.5 py-2.5 text-sm text-slate-300 whitespace-nowrap ${className}`}>{children}</td>
);
const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-2.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap ${className}`}>{children}</th>
);

// ─── Lead Toggle ─────────────────────────────────────────────────────────────
function LeadToggle({ view, onChange }: { view: LeadView; onChange: (v: LeadView) => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
      {LEAD_VIEWS.map(({ value, label, icon: Icon, color }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
            view === value
              ? `bg-white/10 ${color} shadow-sm`
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Icon size={11} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Lead Split Cell ─────────────────────────────────────────────────────────
function LeadCell({ formLeads, callLeads, view }: { formLeads: number; callLeads: number; view: LeadView }) {
  const count = getLeadCount(formLeads, callLeads, view);
  if (!count && view === 'total' && (formLeads + callLeads) === 0) return <span className="text-muted-foreground">—</span>;
  const colorMap: Record<LeadView, string> = { total: 'text-cyan-400', forms: 'text-blue-400', calls: 'text-emerald-400' };
  return (
    <div className="flex flex-col gap-0.5 items-end">
      <span className={`font-bold ${colorMap[view]}`}>{count || '—'}</span>
      {view === 'total' && count > 0 && (
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-0.5 text-blue-400"><FileText size={9} />{formLeads}</span>
          <span className="flex items-center gap-0.5 text-emerald-400"><Phone size={9} />{callLeads}</span>
        </div>
      )}
    </div>
  );
}

// ─── Ad Row ───────────────────────────────────────────────────────────────────
function AdRow({ ad, view }: { ad: import('@/lib/mockData').AdData; view: LeadView }) {
  const leads = getLeadCount(ad.formLeads, ad.callLeads, view);
  return (
    <tr className="table-row-hover border-t border-white/4">
      <Td className="drill-level-2">
        <span className="text-slate-400 mr-2 text-xs">◆</span>
        <span className="text-slate-300 text-xs italic">{ad.headline}</span>
      </Td>
      <Td /><Td />
      <Td className="text-right">{ad.clicks.toLocaleString()}</Td>
      <Td className="text-right">{ad.ctr}</Td>
      <Td className="text-right">{fmt$(ad.spend)}</Td>
      <Td className="text-right">{cpc(ad.spend, ad.clicks)}</Td>
      <Td className="text-right"><LeadCell formLeads={ad.formLeads} callLeads={ad.callLeads} view={view} /></Td>
      <Td className="text-right">{leads ? `$${(ad.spend / leads).toFixed(2)}` : '—'}</Td>
      <Td className="text-right text-emerald-400">{ad.won || '—'}</Td>
      <Td className="text-right">{cps(ad.spend, ad.won)}</Td>
      <Td className="text-right">{ad.revenue > 0 ? fmt$(ad.revenue) : '—'}</Td>
      <Td className={`text-right ${roasClass(ad.revenue, ad.spend)}`}>{roas(ad.revenue, ad.spend)}</Td>
      <Td className="text-right">{convRate(leads, ad.clicks)}</Td>
    </tr>
  );
}

// ─── Ad Group Row ─────────────────────────────────────────────────────────────
function AdGroupRow({ ag, view }: { ag: import('@/lib/mockData').AdGroupData; view: LeadView }) {
  const [open, setOpen] = useState(false);
  const leads = getLeadCount(ag.formLeads, ag.callLeads, view);
  return (
    <>
      <tr className="table-row-hover border-t border-white/5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <Td className="drill-level-1">
          <span className="inline-flex items-center gap-1.5">
            <ChevronRight size={12} className={`chevron-icon text-slate-500 ${open ? 'open' : ''}`} />
            <span className="text-slate-400 text-xs font-medium">{ag.name}</span>
          </span>
        </Td>
        <Td /><Td />
        <Td className="text-right text-slate-400">{ag.clicks.toLocaleString()}</Td>
        <Td className="text-right text-slate-400">—</Td>
        <Td className="text-right text-slate-400">{fmt$(ag.spend)}</Td>
        <Td className="text-right text-slate-400">{cpc(ag.spend, ag.clicks)}</Td>
        <Td className="text-right"><LeadCell formLeads={ag.formLeads} callLeads={ag.callLeads} view={view} /></Td>
        <Td className="text-right text-slate-400">{leads ? `$${(ag.spend / leads).toFixed(2)}` : '—'}</Td>
        <Td className="text-right text-emerald-400/80">{ag.won || '—'}</Td>
        <Td className="text-right text-slate-400">{cps(ag.spend, ag.won)}</Td>
        <Td className="text-right text-slate-400">{ag.revenue > 0 ? fmt$(ag.revenue) : '—'}</Td>
        <Td className={`text-right ${roasClass(ag.revenue, ag.spend)}`}>{roas(ag.revenue, ag.spend)}</Td>
        <Td className="text-right text-slate-400">{convRate(leads, ag.clicks)}</Td>
      </tr>
      {open && ag.ads.map(ad => <AdRow key={ad.id} ad={ad} view={view} />)}
    </>
  );
}

// ─── Campaign Row ─────────────────────────────────────────────────────────────
function CampaignRow({ c, view }: { c: import('@/lib/mockData').CampaignData; view: LeadView }) {
  const [open, setOpen] = useState(false);
  const hasGroups = c.adGroups.length > 0;
  const leads = getLeadCount(c.formLeads, c.callLeads, view);
  return (
    <>
      <tr
        className={`table-row-hover border-t border-white/8 ${hasGroups ? 'cursor-pointer' : ''}`}
        onClick={() => hasGroups && setOpen(o => !o)}
      >
        <Td>
          <span className="inline-flex items-center gap-2">
            {hasGroups
              ? <ChevronRight size={14} className={`chevron-icon text-blue-400 flex-shrink-0 ${open ? 'open' : ''}`} />
              : <span className="w-3.5" />}
            <span className={`font-medium ${hasGroups ? 'text-blue-400 hover:text-blue-300' : 'text-slate-400'}`}>{c.name}</span>
          </span>
        </Td>
        <Td><StatusBadge status={c.status} /></Td>
        <Td className="text-right">{c.impressions > 0 ? c.impressions.toLocaleString() : '—'}</Td>
        <Td className="text-right">{c.clicks > 0 ? c.clicks.toLocaleString() : '—'}</Td>
        <Td className="text-right">{c.clicks > 0 ? c.ctr : '—'}</Td>
        <Td className="text-right">{c.spend > 0 ? fmt$(c.spend) : '—'}</Td>
        <Td className="text-right">{cpc(c.spend, c.clicks)}</Td>
        <Td className="text-right"><LeadCell formLeads={c.formLeads} callLeads={c.callLeads} view={view} /></Td>
        <Td className="text-right">{leads ? `$${(c.spend / leads).toFixed(2)}` : '—'}</Td>
        <Td className="text-right text-emerald-400 font-semibold">{c.won > 0 ? c.won : '—'}</Td>
        <Td className="text-right">{cps(c.spend, c.won)}</Td>
        <Td className="text-right">{c.revenue > 0 ? fmt$(c.revenue) : '—'}</Td>
        <Td className={`text-right ${roasClass(c.revenue, c.spend)}`}>{roas(c.revenue, c.spend)}</Td>
        <Td className="text-right">{convRate(leads, c.clicks)}</Td>
      </tr>
      {open && c.adGroups.map(ag => <AdGroupRow key={ag.id} ag={ag} view={view} />)}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Home() {
  const [leadView, setLeadView] = useState<LeadView>('total');
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[2]); // Last 30 days default
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpend       = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalFormLeads   = campaigns.reduce((s, c) => s + c.formLeads, 0);
  const totalCallLeads   = campaigns.reduce((s, c) => s + c.callLeads, 0);
  const totalGhlLeads    = totalFormLeads + totalCallLeads;
  const totalWon         = campaigns.reduce((s, c) => s + c.won, 0);
  const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgCpc           = totalClicks ? totalSpend / totalClicks : 0;
  const totalCpl         = totalGhlLeads ? totalSpend / totalGhlLeads : 0;
  const totalCps         = totalWon ? totalSpend / totalWon : 0;
  const totalRoas        = totalSpend ? totalRevenue / totalSpend : 0;

  // Funnel data
  const funnelData = [
    { stage: 'Impressions', value: totalImpressions, fill: '#8b5cf6' },
    { stage: 'Clicks',      value: totalClicks,      fill: '#3b82f6' },
    { stage: 'GHL Leads',   value: totalGhlLeads,    fill: '#06b6d4' },
    { stage: 'Opps',        value: 45,               fill: '#f59e0b' },
    { stage: 'Won Deals',   value: totalWon,         fill: '#10b981' },
  ];

  // Lead source by campaign (top 4 active)
  const activeCampaigns = campaigns.filter(c => c.status === 'active');

  // Trend: combined GHL leads per week
  const combinedLeadTrend = trendData.formLeads.map((f, i) => f + trendData.callLeads[i]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap size={14} className="text-blue-400" />
            </div>
            <span className="font-display font-bold text-sm text-foreground tracking-tight">OneTouch Attribution Intelligence</span>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-xs text-muted-foreground">Google Ads × GoHighLevel</span>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Data source notice ── */}
      <div className="max-w-[1600px] mx-auto w-full px-6 pt-4">
        <div className="flex items-center gap-3 text-[11px] bg-blue-500/8 border border-blue-500/20 rounded-lg px-4 py-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
          <span className="text-blue-300 font-medium">Lead Data Source:</span>
          <span className="text-slate-400">
            All lead counts, CPL, and CPS are calculated from <span className="text-white font-medium">GoHighLevel form submissions + inbound calls</span> only.
            Google Ads conversion data is used for impressions, clicks, spend, and CPC only.
          </span>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto w-full px-6 py-5 flex flex-col gap-7">

        {/* ── Row 1: KPI Hero Cards ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Period Summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard label="Impressions"  value={totalImpressions.toLocaleString()} delta="+12%" deltaDir="up"  color="bg-purple-500/15 text-purple-400"   icon={Eye} />
            <KpiCard label="Clicks"       value={totalClicks.toLocaleString()}       delta="+8%"  deltaDir="up"  color="bg-blue-500/15 text-blue-400"       icon={MousePointerClick} />
            <KpiCard label="Avg CPC"      value={`$${avgCpc.toFixed(2)}`}            delta="-5%"  deltaDir="up"  color="bg-cyan-500/15 text-cyan-400"       icon={Target} sub="Google Ads" />
            <KpiCard label="Total Spend"  value={fmt$(totalSpend)}                   sub="Google Ads API"        color="bg-slate-500/15 text-slate-400"     icon={DollarSign} />
            <KpiCard label="GHL Leads"    value={totalGhlLeads.toString()}           delta="+18%" deltaDir="up"  color="bg-cyan-500/15 text-cyan-400"       icon={Users} sub={`${totalFormLeads} forms · ${totalCallLeads} calls`} />
            <KpiCard label="Cost / Lead"  value={`$${totalCpl.toFixed(2)}`}          delta="-9%"  deltaDir="up"  color="bg-blue-500/15 text-blue-400"       icon={Target} sub="GHL leads only" />
            <KpiCard label="Won Deals"    value={totalWon.toString()}                delta="+22%" deltaDir="up"  color="bg-emerald-500/15 text-emerald-400" icon={Trophy} sub="GHL pipeline" />
            <KpiCard label="Cost / Sale"  value={`$${totalCps.toFixed(2)}`}          delta="-14%" deltaDir="up"  color="bg-emerald-500/15 text-emerald-400" icon={TrendingUp} sub={`ROAS: ${totalRoas.toFixed(1)}x`} />
          </div>
        </section>

        {/* ── Row 2: GHL Lead Split + Trend Sparklines ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weekly Trends</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <LeadSplitCard formLeads={totalFormLeads} callLeads={totalCallLeads} />
            <SparkCard label="Impressions"    data={trendData.impressions}  weeks={trendData.weeks} color="#8b5cf6" />
            <SparkCard label="Clicks"         data={trendData.clicks}       weeks={trendData.weeks} color="#3b82f6" />
            <SparkCard label="GHL Leads"      data={combinedLeadTrend}      weeks={trendData.weeks} color="#06b6d4" badge="GHL" />
            <SparkCard label="Won Deals"      data={trendData.won}          weeks={trendData.weeks} color="#10b981" badge="GHL" />
          </div>
        </section>

        {/* ── Row 3: Funnel + Lead Source Mix ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Funnel */}
          <div className="lg:col-span-2 rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Target size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Attribution Funnel — Clicks to Revenue</h3>
            </div>
            <div className="flex flex-col gap-3">
              {funnelData.map((stage, i) => {
                const pct = (stage.value / funnelData[0].value) * 100;
                const nextConv = i < funnelData.length - 1
                  ? ((funnelData[i + 1].value / stage.value) * 100).toFixed(1) + '%'
                  : null;
                const isGhl = stage.stage === 'GHL Leads' || stage.stage === 'Opps' || stage.stage === 'Won Deals';
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-28 justify-end flex-shrink-0">
                      {isGhl && <span className="text-[9px] text-muted-foreground/60 bg-white/5 px-1 rounded">GHL</span>}
                      <span className="text-xs text-muted-foreground">{stage.stage}</span>
                    </div>
                    <div className="flex-1 h-7 rounded bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-700"
                        style={{ width: `${Math.max(pct, 0.5)}%`, background: stage.fill, opacity: 0.85 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-16 text-right flex-shrink-0 font-display">
                      {stage.value.toLocaleString()}
                    </span>
                    {nextConv
                      ? <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0">→ {nextConv}</span>
                      : <span className="w-20 flex-shrink-0" />
                    }
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-4 text-[10px] text-muted-foreground border-t border-white/8 pt-3">
              {['Impr→Click: 1.3%', 'Click→Lead: 21.3%', 'Lead→Opp: 32.8%', 'Opp→Won: 40.0%'].map((label, i) => (
                <div key={i} className="text-center"><span className="text-slate-400">{label}</span></div>
              ))}
            </div>
          </div>

          {/* Lead Source Mix by Campaign */}
          <div className="rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Users size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">GHL Leads by Campaign</h3>
            </div>
            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-4">
              {activeCampaigns.map((c, i) => {
                const leads = totalLeads(c.formLeads, c.callLeads);
                const pct = totalGhlLeads ? (leads / totalGhlLeads) * 100 : 0;
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];
                return <div key={c.id} className="h-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />;
              })}
            </div>
            <div className="flex flex-col gap-3">
              {activeCampaigns.map((c, i) => {
                const leads = totalLeads(c.formLeads, c.callLeads);
                const pct = totalGhlLeads ? ((leads / totalGhlLeads) * 100).toFixed(0) : '0';
                const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="text-xs text-muted-foreground truncate max-w-[130px]">{c.name.replace('Search – ', '').replace('Local Services – ', 'LSA – ')}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-foreground font-display">{leads}</span>
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length], opacity: 0.7 }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground pl-4">
                      <span className="flex items-center gap-0.5"><FileText size={9} className="text-blue-400" /> {c.formLeads} forms</span>
                      <span className="flex items-center gap-0.5"><Phone size={9} className="text-emerald-400" /> {c.callLeads} calls</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total GHL Leads</span>
              <span className="kpi-value text-lg text-foreground">{totalGhlLeads}</span>
            </div>
          </div>
        </section>

        {/* ── Row 4: Campaign Drill-Down Table ── */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campaign Performance</h2>
              <span className="text-[10px] text-muted-foreground/60 ml-1 hidden lg:inline">— click campaign to expand Ad Groups · click Ad Group to expand Ads</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Lead view toggle */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">GHL Leads:</span>
                <LeadToggle view={leadView} onChange={setLeadView} />
              </div>
              <span className="text-white/20 hidden sm:inline">|</span>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Active</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Paused</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-white/4 border-b border-white/8">
                    <Th className="w-52">Campaign / Ad Group / Ad</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Impr.</Th>
                    <Th className="text-right">Clicks</Th>
                    <Th className="text-right">CTR</Th>
                    <Th className="text-right">Spend</Th>
                    <Th className="text-right">CPC</Th>
                    <Th className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        {leadView === 'total' && <span className="text-cyan-400">GHL Leads</span>}
                        {leadView === 'forms' && <span className="text-blue-400 flex items-center gap-1"><FileText size={9} />Web Forms</span>}
                        {leadView === 'calls' && <span className="text-emerald-400 flex items-center gap-1"><Phone size={9} />Phone Calls</span>}
                        {leadView === 'total' && (
                          <span className="text-[9px] text-muted-foreground/60 font-normal normal-case tracking-normal">forms + calls</span>
                        )}
                      </div>
                    </Th>
                    <Th className="text-right">CPL</Th>
                    <Th className="text-right text-emerald-400">Won</Th>
                    <Th className="text-right">CPS</Th>
                    <Th className="text-right">Revenue</Th>
                    <Th className="text-right">ROAS</Th>
                    <Th className="text-right">Conv%</Th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => <CampaignRow key={c.id} c={c} view={leadView} />)}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/15 bg-white/4">
                    <td className="px-2.5 py-3 text-sm font-bold text-foreground font-display">TOTAL</td>
                    <td /><td />
                    <td className="px-2.5 py-3 text-sm font-bold text-right text-foreground">{totalClicks.toLocaleString()}</td>
                    <td className="px-2.5 py-3 text-sm text-right text-muted-foreground">—</td>
                    <td className="px-2.5 py-3 text-sm font-bold text-right text-foreground">{fmt$(totalSpend)}</td>
                    <td className="px-2.5 py-3 text-sm text-right text-muted-foreground">${avgCpc.toFixed(2)}</td>
                    <td className="px-2.5 py-3 text-right">
                      {(() => {
                        const viewTotal = getLeadCount(totalFormLeads, totalCallLeads, leadView);
                        const colorMap: Record<LeadView, string> = { total: 'text-cyan-400', forms: 'text-blue-400', calls: 'text-emerald-400' };
                        return (
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className={`text-sm font-bold ${colorMap[leadView]}`}>{viewTotal}</span>
                            {leadView === 'total' && (
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="flex items-center gap-0.5 text-blue-400"><FileText size={9} />{totalFormLeads}</span>
                                <span className="flex items-center gap-0.5 text-emerald-400"><Phone size={9} />{totalCallLeads}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-2.5 py-3 text-sm text-right text-muted-foreground">
                      {(() => {
                        const viewTotal = getLeadCount(totalFormLeads, totalCallLeads, leadView);
                        return viewTotal ? `$${(totalSpend / viewTotal).toFixed(2)}` : '—';
                      })()}
                    </td>
                    <td className="px-2.5 py-3 text-sm font-bold text-right text-emerald-400">{totalWon}</td>
                    <td className="px-2.5 py-3 text-sm text-right text-muted-foreground">${totalCps.toFixed(2)}</td>
                    <td className="px-2.5 py-3 text-sm font-bold text-right text-foreground">{fmt$(totalRevenue)}</td>
                    <td className={`px-2.5 py-3 text-sm font-bold text-right ${roasClass(totalRevenue, totalSpend)}`}>{roas(totalRevenue, totalSpend)}</td>
                    <td className="px-2.5 py-3 text-sm text-right text-muted-foreground">{convRate(totalGhlLeads, totalClicks)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 pt-4 pb-8 flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>Google Ads API: impressions, clicks, spend, CPC, CTR · GoHighLevel API: form leads, call leads, opportunities, won deals, revenue</span>
          <span>Prototype · mock data</span>
        </footer>
      </main>
    </div>
  );
}
