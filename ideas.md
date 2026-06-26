# Attribution Intelligence Dashboard — Design Ideas

## Reference
The GHL Google Ads report screenshot is the ground-truth reference for data structure. The UI must improve on its readability while preserving all its columns and adding our new ones (Leads, Won, CPL, CPS, ROAS, drill-down levels).

## Three Approaches

### 1. "Mission Control" — Dark Ops Analytics
Probability: 0.07
Deep navy/slate dark mode, monospace accent font for numbers, neon green/cyan highlights for positive KPIs, red for underperformers. Feels like a Bloomberg terminal built for performance marketers.

### 2. "Clean Room" — Clinical Light Mode
Probability: 0.04
Pure white with cool gray structure, a single electric blue accent, tight grid, no decorative elements. Every pixel serves a data point. Feels like Stripe's dashboard.

### 3. "Ink & Signal" — Dark Mode with Editorial Typography
Probability: 0.06
Dark slate background (#0f172a), a bold condensed display font (Space Grotesk) for headlines and KPI numbers, Inter for table data. Accent colors are purposeful: emerald for positive, amber for warning, rose for negative. Subtle horizontal rule separators, no card borders — sections breathe with whitespace instead.

---

## Chosen Approach: "Ink & Signal"

### Design Movement
Data journalism meets performance marketing — the aesthetic of The Pudding or FiveThirtyEight applied to a SaaS dashboard.

### Core Principles
1. **Numbers are the hero.** KPI values are large, bold, and immediately scannable. Labels are small and muted.
2. **Color is semantic, not decorative.** Emerald = good, Amber = caution, Rose = bad. Used only on values, never on backgrounds.
3. **Tables breathe.** Generous row height, alternating subtle row tints, no heavy borders. The data speaks, not the chrome.
4. **Drill-down is spatial.** Clicking a campaign slides in an indented sub-table — the hierarchy is visible in the layout.

### Color Philosophy
- Background: `#0f172a` (slate-950) — deep enough to make numbers pop
- Card surface: `#1e293b` (slate-800) — subtle lift without harsh contrast
- Border: `#334155` (slate-700) — barely visible, structural only
- Emerald `#10b981` — positive KPIs, active status
- Amber `#f59e0b` — warning, paused, break-even ROAS
- Rose `#f43f5e` — negative KPIs, low ROAS
- Blue `#3b82f6` — primary interactive elements, links, selected state
- Cyan `#06b6d4` — secondary metric accent (clicks, impressions)
- Text primary: `#f8fafc` — near-white for values
- Text muted: `#94a3b8` — slate-400 for labels

### Layout Paradigm
Left sidebar navigation (fixed, narrow) + main content area with a sticky header bar. The main area is a single scrollable column: hero KPIs → sparkline row → funnel + donut → campaign table with inline drill-down. No tabs — everything is on one page, progressively disclosed.

### Signature Elements
1. Large monospace KPI numbers with a colored delta badge
2. Inline expandable table rows (campaign → ad group → ad) with left-border indentation
3. ROAS cells color-coded by threshold (green/amber/red)

### Typography System
- Display / KPI numbers: Space Grotesk 700 (loaded from Google Fonts)
- UI labels and table headers: Inter 600
- Table data: Inter 400
- Muted metadata: Inter 400, slate-400

### Brand Essence
"The attribution layer agencies have always needed." — For Google Ads + GoHighLevel users who want to see the full funnel from click to closed deal. Precise, fast, trustworthy.

### Brand Voice
Headlines: Direct and data-forward. "Every dollar. Every deal. Fully attributed."
CTAs: "Connect your accounts" / "View full funnel"

### Signature Brand Color
Electric Blue `#3b82f6` — the connective tissue between Google Ads data and GHL pipeline data.
