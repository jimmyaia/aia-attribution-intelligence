import { useState } from 'react';
import { campaigns, trendData, fmt$, cpc, cpl, cps, roas, roasClass, convRate } from '@/lib/mockData';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronRight, TrendingUp, TrendingDown, Minus,
  Eye, MousePointerClick, Users, Trophy, DollarSign,
  Zap, Target, BarChart2, RefreshCw, Calendar,
} from 'lucide-react';

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
    <div className={`rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-2 hover:border-white/15 transition-colors duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className={`kpi-value text-2xl text-foreground`}>{value}</div>
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

// ─── Sparkline Card ──────────────────────────────────────────────────────────
function SparkCard({
  label, data, weeks, color, formatter,
}: {
  label: string; data: number[]; weeks: string[]; color: string; formatter?: (v: number) => string;
}) {
  const chartData = weeks.map((w, i) => ({ week: w, value: data[i] }));
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const pct = prev ? (((latest - prev) / prev) * 100).toFixed(0) : null;
  const up = pct !== null && Number(pct) >= 0;

  return (
    <div className="rounded-xl border border-white/8 bg-card p-4 flex flex-col gap-3 hover:border-white/15 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{label}</span>
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
            itemStyle={{ color: color }}
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
  <td className={`px-3 py-2.5 text-sm text-slate-300 whitespace-nowrap ${className}`}>{children}</td>
);
const Th = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <th className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap ${className}`}>{children}</th>
);

// ─── Ad Row ───────────────────────────────────────────────────────────────────
function AdRow({ ad }: { ad: import('@/lib/mockData').AdData }) {
  return (
    <tr className="table-row-hover border-t border-white/4">
      <Td className="drill-level-2">
        <span className="text-slate-400 mr-2 text-xs">◆</span>
        <span className="text-slate-300 text-xs italic">{ad.headline}</span>
      </Td>
      <Td />
      <Td className="text-right">{ad.clicks.toLocaleString()}</Td>
      <Td className="text-right">{ad.ctr}</Td>
      <Td className="text-right">{fmt$(ad.spend)}</Td>
      <Td className="text-right">{cpc(ad.spend, ad.clicks)}</Td>
      <Td className="text-right text-cyan-400">{ad.leads}</Td>
      <Td className="text-right">{cpl(ad.spend, ad.leads)}</Td>
      <Td className="text-right text-emerald-400">{ad.won}</Td>
      <Td className="text-right">{cps(ad.spend, ad.won)}</Td>
      <Td className="text-right">{ad.revenue > 0 ? fmt$(ad.revenue) : '—'}</Td>
      <Td className={`text-right ${roasClass(ad.revenue, ad.spend)}`}>{roas(ad.revenue, ad.spend)}</Td>
      <Td className="text-right">{convRate(ad.leads, ad.clicks)}</Td>
    </tr>
  );
}

// ─── Ad Group Row ─────────────────────────────────────────────────────────────
function AdGroupRow({ ag }: { ag: import('@/lib/mockData').AdGroupData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="table-row-hover border-t border-white/5 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <Td className="drill-level-1">
          <span className="inline-flex items-center gap-1.5">
            <ChevronRight size={12} className={`chevron-icon text-slate-500 ${open ? 'open' : ''}`} />
            <span className="text-slate-400 text-xs font-medium">{ag.name}</span>
          </span>
        </Td>
        <Td />
        <Td className="text-right text-slate-400">{ag.clicks.toLocaleString()}</Td>
        <Td className="text-right text-slate-400">—</Td>
        <Td className="text-right text-slate-400">{fmt$(ag.spend)}</Td>
        <Td className="text-right text-slate-400">{cpc(ag.spend, ag.clicks)}</Td>
        <Td className="text-right text-cyan-400/80">{ag.leads}</Td>
        <Td className="text-right text-slate-400">{cpl(ag.spend, ag.leads)}</Td>
        <Td className="text-right text-emerald-400/80">{ag.won}</Td>
        <Td className="text-right text-slate-400">{cps(ag.spend, ag.won)}</Td>
        <Td className="text-right text-slate-400">{ag.revenue > 0 ? fmt$(ag.revenue) : '—'}</Td>
        <Td className={`text-right ${roasClass(ag.revenue, ag.spend)}`}>{roas(ag.revenue, ag.spend)}</Td>
        <Td className="text-right text-slate-400">{convRate(ag.leads, ag.clicks)}</Td>
      </tr>
      {open && ag.ads.map(ad => <AdRow key={ad.id} ad={ad} />)}
    </>
  );
}

// ─── Campaign Row ─────────────────────────────────────────────────────────────
function CampaignRow({ c }: { c: import('@/lib/mockData').CampaignData }) {
  const [open, setOpen] = useState(false);
  const hasGroups = c.adGroups.length > 0;

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
              : <span className="w-3.5" />
            }
            <span className={`font-medium ${hasGroups ? 'text-blue-400 hover:text-blue-300' : 'text-slate-400'}`}>
              {c.name}
            </span>
          </span>
        </Td>
        <Td><StatusBadge status={c.status} /></Td>
        <Td className="text-right">{c.impressions > 0 ? c.impressions.toLocaleString() : '—'}</Td>
        <Td className="text-right">{c.clicks > 0 ? c.clicks.toLocaleString() : '—'}</Td>
        <Td className="text-right">{c.clicks > 0 ? c.ctr : '—'}</Td>
        <Td className="text-right">{c.spend > 0 ? fmt$(c.spend) : '—'}</Td>
        <Td className="text-right">{cpc(c.spend, c.clicks)}</Td>
        <Td className="text-right text-cyan-400 font-semibold">{c.leads > 0 ? c.leads : '—'}</Td>
        <Td className="text-right">{cpl(c.spend, c.leads)}</Td>
        <Td className="text-right text-emerald-400 font-semibold">{c.won > 0 ? c.won : '—'}</Td>
        <Td className="text-right">{cps(c.spend, c.won)}</Td>
        <Td className="text-right">{c.revenue > 0 ? fmt$(c.revenue) : '—'}</Td>
        <Td className={`text-right ${roasClass(c.revenue, c.spend)}`}>{roas(c.revenue, c.spend)}</Td>
        <Td className="text-right">{convRate(c.leads, c.clicks)}</Td>
      </tr>
      {open && c.adGroups.map(ag => <AdGroupRow key={ag.id} ag={ag} />)}
    </>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Home() {
  // Totals
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalSpend       = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalLeads       = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalWon         = campaigns.reduce((s, c) => s + c.won, 0);
  const totalRevenue     = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgCpc           = totalClicks ? totalSpend / totalClicks : 0;
  const totalCpl         = totalLeads  ? totalSpend / totalLeads  : 0;
  const totalCps         = totalWon    ? totalSpend / totalWon    : 0;
  const totalRoas        = totalSpend  ? totalRevenue / totalSpend : 0;
  const convR            = totalClicks ? (totalLeads / totalClicks) * 100 : 0;

  // Funnel data for bar chart
  const funnelData = [
    { stage: 'Impressions', value: totalImpressions, fill: '#8b5cf6' },
    { stage: 'Clicks',      value: totalClicks,      fill: '#3b82f6' },
    { stage: 'Leads',       value: totalLeads,       fill: '#06b6d4' },
    { stage: 'Opps',        value: 45,               fill: '#f59e0b' },
    { stage: 'Won',         value: totalWon,         fill: '#10b981' },
  ];

  // Lead source pie
  const pieData = [
    { name: 'Brand Search', value: 65, fill: '#10b981' },
    { name: 'Non-Brand',    value: 35, fill: '#3b82f6' },
    { name: 'Perf Max',     value: 20, fill: '#8b5cf6' },
    { name: 'Display',      value: 5,  fill: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Zap size={14} className="text-blue-400" />
            </div>
            <span className="font-display font-bold text-sm text-foreground tracking-tight">Attribution Intelligence</span>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-xs text-muted-foreground">Google Ads × GoHighLevel</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
              <Calendar size={12} />
              <span>Jun 1 – Jun 26, 2026</span>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
              <RefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-6 py-6 flex flex-col gap-8">

        {/* ── Section: KPI Hero Cards ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Period Summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard label="Impressions"  value={totalImpressions.toLocaleString()} delta="+12%" deltaDir="up"   color="bg-purple-500/15 text-purple-400" icon={Eye} />
            <KpiCard label="Clicks"       value={totalClicks.toLocaleString()}       delta="+8%"  deltaDir="up"   color="bg-blue-500/15 text-blue-400"   icon={MousePointerClick} />
            <KpiCard label="Avg CPC"      value={`$${avgCpc.toFixed(2)}`}            delta="-5%"  deltaDir="up"   color="bg-cyan-500/15 text-cyan-400"   icon={Target} />
            <KpiCard label="Total Spend"  value={fmt$(totalSpend)}                   sub="Google Ads API"         color="bg-slate-500/15 text-slate-400" icon={DollarSign} />
            <KpiCard label="Total Leads"  value={totalLeads.toString()}              delta="+18%" deltaDir="up"   color="bg-cyan-500/15 text-cyan-400"   icon={Users} sub={`Conv: ${convR.toFixed(1)}%`} />
            <KpiCard label="Cost / Lead"  value={`$${totalCpl.toFixed(2)}`}          delta="-9%"  deltaDir="up"   color="bg-blue-500/15 text-blue-400"   icon={Target} />
            <KpiCard label="Won Deals"    value={totalWon.toString()}                delta="+22%" deltaDir="up"   color="bg-emerald-500/15 text-emerald-400" icon={Trophy} />
            <KpiCard label="Cost / Sale"  value={`$${totalCps.toFixed(2)}`}          delta="-14%" deltaDir="up"   color="bg-emerald-500/15 text-emerald-400" icon={TrendingUp} sub={`ROAS: ${totalRoas.toFixed(1)}x`} />
          </div>
        </section>

        {/* ── Section: Trend Sparklines ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weekly Trends</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SparkCard label="Impressions" data={trendData.impressions} weeks={trendData.weeks} color="#8b5cf6" />
            <SparkCard label="Clicks"      data={trendData.clicks}      weeks={trendData.weeks} color="#3b82f6" />
            <SparkCard label="Leads (GHL)" data={trendData.leads}       weeks={trendData.weeks} color="#06b6d4" />
            <SparkCard label="Won Deals"   data={trendData.won}         weeks={trendData.weeks} color="#10b981" />
          </div>
        </section>

        {/* ── Section: Funnel + Pie ── */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Funnel – CSS bars (renders in all contexts) */}
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
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-24 text-right flex-shrink-0">{stage.stage}</span>
                    <div className="flex-1 h-7 rounded bg-white/5 overflow-hidden relative">
                      <div
                        className="h-full rounded transition-all duration-700"
                        style={{ width: `${Math.max(pct, 0.5)}%`, background: stage.fill, opacity: 0.85 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground w-16 text-right flex-shrink-0 font-display">
                      {stage.value.toLocaleString()}
                    </span>
                    {nextConv && (
                      <span className="text-[10px] text-muted-foreground w-20 flex-shrink-0">→ {nextConv} conv.</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-4 text-[10px] text-muted-foreground border-t border-white/8 pt-3">
              {['Impr→Click: 1.3%', 'Click→Lead: 39.8%', 'Lead→Opp: 31.7%', 'Opp→Won: 40.0%'].map((label, i) => (
                <div key={i} className="text-center">
                  <span className="text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Source Mix – CSS bars */}
          <div className="rounded-xl border border-white/8 bg-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Users size={14} className="text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Lead Source Mix</h3>
            </div>
            {/* Stacked bar */}
            <div className="h-5 rounded-full overflow-hidden flex mb-5">
              {pieData.map(d => (
                <div
                  key={d.name}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(d.value / pieData.reduce((s, x) => s + x.value, 0)) * 100}%`, background: d.fill }}
                />
              ))}
            </div>
            {/* Legend rows with mini bars */}
            <div className="flex flex-col gap-3">
              {pieData.map(d => {
                const total = pieData.reduce((s, x) => s + x.value, 0);
                const pct = ((d.value / total) * 100).toFixed(0);
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                        <span className="text-xs text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground font-display">{d.value}</span>
                        <span className="text-[10px] text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.fill, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-white/8 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Leads</span>
              <span className="kpi-value text-lg text-foreground">{pieData.reduce((s, d) => s + d.value, 0)}</span>
            </div>
          </div>
        </section>

        {/* ── Section: Campaign Drill-Down Table ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Campaign Performance</h2>
              <span className="text-[10px] text-muted-foreground/60 ml-1">— click a campaign to expand Ad Groups, click an Ad Group to expand individual Ads</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Active</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Paused</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-white/4 border-b border-white/8">
                    <Th className="w-56">Campaign / Ad Group / Ad</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Impr.</Th>
                    <Th className="text-right">Clicks</Th>
                    <Th className="text-right">CTR</Th>
                    <Th className="text-right">Spend</Th>
                    <Th className="text-right">CPC</Th>
                    <Th className="text-right text-cyan-400">Leads</Th>
                    <Th className="text-right">CPL</Th>
                    <Th className="text-right text-emerald-400">Won</Th>
                    <Th className="text-right">CPS</Th>
                    <Th className="text-right">Revenue</Th>
                    <Th className="text-right">ROAS</Th>
                    <Th className="text-right">Conv %</Th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => <CampaignRow key={c.id} c={c} />)}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-white/15 bg-white/4">
                    <td className="px-3 py-3 text-sm font-bold text-foreground font-display">TOTAL</td>
                    <td />
                    <td className="px-3 py-3 text-sm font-bold text-right text-foreground">{totalImpressions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-foreground">{totalClicks.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-right text-muted-foreground">{convRate(totalLeads, totalClicks)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-foreground">{fmt$(totalSpend)}</td>
                    <td className="px-3 py-3 text-sm text-right text-muted-foreground">${avgCpc.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-cyan-400">{totalLeads}</td>
                    <td className="px-3 py-3 text-sm text-right text-muted-foreground">${totalCpl.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-emerald-400">{totalWon}</td>
                    <td className="px-3 py-3 text-sm text-right text-muted-foreground">${totalCps.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm font-bold text-right text-foreground">{fmt$(totalRevenue)}</td>
                    <td className={`px-3 py-3 text-sm font-bold text-right ${roasClass(totalRevenue, totalSpend)}`}>{roas(totalRevenue, totalSpend)}</td>
                    <td className="px-3 py-3 text-sm text-right text-muted-foreground">{convRate(totalLeads, totalClicks)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/8 pt-4 pb-8 flex items-center justify-between text-[11px] text-muted-foreground/60">
          <span>Data: Google Ads API (impressions, clicks, spend, CPC, CTR) × GoHighLevel API (leads, opportunities, won deals, revenue)</span>
          <span>KPIs calculated server-side · Prototype with mock data</span>
        </footer>
      </main>
    </div>
  );
}
