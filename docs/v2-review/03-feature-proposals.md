# Autodata v2 — Feature Proposals

A catalogue of features that would extend what `data-viz-platform` already does well —
in-browser, no-backend, instant data exploration with smart suggestions.

This doc is intentionally *opinionated*. Each proposal includes:

- **Why it fits** — how it builds on existing pieces
- **What it looks like** — concrete UX sketch
- **Cost** — approximate effort, plus any prerequisites from doc 02
- **Priority** — 🟢 quick win · 🟡 mid-term · 🔴 strategic / large

The proposals are grouped by theme, not priority — pick the ones that match your
near-term direction.

> Many of these depend on the **Phase 1–3 fixes** in doc 02 landing first
> (Vite, Web Worker, instancing). I flag those dependencies inline.

---

## Theme A — AI assistance ("the Brain becomes conversational")

### A1. 🟡 Natural-language query: "show me sales by region in 2024"

**Why it fits.** The Brain already detects column types and patterns. Adding an LLM in
front of it turns "data exploration" into "data conversation" — a category-defining
feature for self-serve viz tools in 2026
([Microsoft LIDA](https://microsoft.github.io/lida/) ·
[Chat2VIS paper](https://arxiv.org/pdf/2302.02094)).

**What it looks like.** A chat box at the bottom of the Charts view:

```
You: which two columns are most correlated?
Bot: weight ↔ mpg, r = -0.87 (strong negative).
     [Show scatter]   [Add to dashboard]

You: only show cars made after 1980
Bot: filtered 234 → 142 rows.
     [Show updated chart]
```

**Implementation.**

1. Build a *summariser* on top of the Brain's existing analysis: a JSON document with
   schema (column types, ranges, null counts, top values, detected patterns).
2. POST the summary + user query to a small LLM endpoint (Anthropic Claude Haiku 4.5
   is the right cost / latency tier for this; Sonnet 4.6 if quality matters more than
   cost). Return a **structured action**: `{type: 'chart', spec: {...}}` or
   `{type: 'filter', predicate: {...}}` rather than free text.
3. Render the action with the existing chart components.

This is exactly LIDA's pattern — Summariser → Goal Explorer → Visualisation
Generator — but tailored to autodata's existing rule-based suggester. Use the LLM as
the *intent parser*, keep your deterministic chart generation.

**Cost.** ~2 weeks. Needs a tiny backend (one endpoint to proxy the LLM call so the
API key isn't shipped to the browser).

**Priority.** 🟡 — high impact, but introduces a backend (the architecture's first
non-static piece). Do it after doc-02 phase 3.

### A2. 🟢 Auto-generated narrative ("data story")

**Why it fits.** `InsightGenerator` already produces sentences. Stringing them into a
*paragraph* with section headings turns one-off insights into a TL;DR a non-technical
user can paste into a Slack message.

**What it looks like.** A "Summary" tab next to Charts/3D/Table:

> **Cars dataset · 392 rows · 9 columns**
>
> The strongest relationship is between weight and miles-per-gallon (r = -0.87) — heavier
> cars use more fuel. Acceleration has a weaker but still meaningful negative correlation
> with mpg (r = -0.42). The dataset has a single outlier in `cylinders` (16 vs the modal
> 4 or 8). Vehicles from Japan (n = 79) are on average 1100 lbs lighter and 7 mpg more
> efficient than vehicles from the USA (n = 245).
>
> [Copy as Markdown]   [Download PDF]

**Implementation.** A function over `analysis` + `insights` that emits Markdown. No
LLM required for v1. Optional v2: pass it through an LLM for fluency.

**Cost.** 2–3 days.

**Priority.** 🟢.

### A3. 🟡 Anomaly explanation ("why is this point an outlier?")

**Why it fits.** PatternDetector already finds outliers. Today they're just dots. Click
one and get a comparison:

> Row 47 (`Cadillac Seville`) has mpg = 16.5, which is 2.3 σ below the mean (24.5).
> Among cars of similar weight (4000–4500 lbs), the average mpg is 17.8 — so this row
> is borderline normal *for its weight class*.

**Implementation.** When the user clicks a point, run a small *contextual* analysis:
nearest-neighbour distance, conditional statistics by category. Reuse Brain primitives.

**Cost.** ~3 days.

**Priority.** 🟡.

---

## Theme B — Data ingest beyond CSV

### B1. 🟡 Parquet + Arrow IPC support

**Why it fits.** Once doc 02 §10.1 (DuckDB-Wasm) lands, Parquet ingest is *one extra
line*. Parquet is the lingua franca of modern data engineering — analysts already have
it. CSV is a downgrade.

**What it looks like.** The DropZone accepts `.parquet`, `.arrow`, `.feather`. Files up
to ~500 MB load in seconds because the format is columnar.

**Cost.** 2–3 days (after DuckDB-Wasm). Without DuckDB, ~1 week (use `apache-arrow`
JS package directly).

**Priority.** 🟡 if you have data-engineering users; 🟢 if you already plan to add
DuckDB.

### B2. 🟢 Direct connection to public datasets

**Why it fits.** The platform already has built-in samples (Iris, cars, planets,
stocks). Generalise that into a "dataset library" panel that pulls from:

- HuggingFace Datasets (`datasets-server.huggingface.co`)
- data.gov / data.europa.eu CSV catalogues
- a curated list of "tutorial" datasets (titanic, NYC taxi, US flights)

**What it looks like.** A "Browse datasets" tab in the upload view, with thumbnails,
search, and one-click load.

**Cost.** ~1 week. No backend needed if you whitelist a handful of CORS-friendly
sources.

**Priority.** 🟢.

### B3. 🟡 Google Sheets / Airtable connector

**Why it fits.** `datasource/CloudStorage.jsx` is a placeholder. Live spreadsheet
connections turn the app from "upload-then-explore" into "always-fresh dashboard".

**What it looks like.** OAuth → user picks a sheet → autodata reads it on a 5-minute
refresh interval.

**Implementation.** Sheets exposes a public CSV export URL that, with OAuth, can pull
private sheets. Airtable has a REST API.

**Cost.** ~2 weeks (most of it is OAuth + token storage). Needs a backend for OAuth
unless you push users to copy/paste a public-share URL.

**Priority.** 🟡.

### B4. 🟢 Drag-and-drop **multiple** files / merge / join

**Why it fits.** Single-file uploads only today. Real exploration almost always
involves joining a fact table to a dimension table.

**What it looks like.** Drop two files. Autodata detects shared columns
(`id`/`product_id`) and offers `inner / left / outer` join with a preview.

**Cost.** ~1 week. DuckDB-Wasm makes the join trivial.

**Priority.** 🟢.

---

## Theme C — Visualisation depth

### C1. 🟡 More chart types: heatmap, treemap, sankey, geo-map

**Why it fits.** The four current 2D types (bar, line, pie, scatter) cover ~60 % of
exploratory needs. Adding heatmap (correlation matrices, calendar heatmaps), treemap
(hierarchies), sankey (flows), and a Leaflet-based geo-map would round it out.

**Cost.** ~3 days per chart type if you stay on Recharts (treemap is built-in). Or move
to ECharts for all of them at once (~1 week).

**Priority.** 🟡.

### C2. 🟡 Interactive filtering / brushing / linked views

**Why it fits.** "Brush a region of the scatter, see the rest of the dashboard update"
is the single most-loved feature in tools like Tableau and Observable. Recharts has
a `<Brush>` component; the missing piece is a shared selection state.

**What it looks like.** Multiple charts on one page, all listening to the same
`SelectionContext`. Brushing in one filters the others.

**Cost.** ~1 week.

**Priority.** 🟡.

### C3. 🟢 Dashboard mode: multiple charts on a grid

**Why it fits.** Today the user sees one chart at a time. A simple `react-grid-layout`
arrangement turns a single insight into a saveable dashboard.

**What it looks like.** "Add to dashboard" button on each chart and on each
suggestion. The dashboard is saved to `localStorage` (or shared via URL — see C5).

**Cost.** ~1 week.

**Priority.** 🟢. Strong amplifier for A2 (narrative) and C2 (linked views).

### C4. 🟡 "What-if" sliders / parameter-driven charts

**Why it fits.** Analysts often want "what if I assume revenue grows 10 %?". A slider
that drives a derived column (`{ name: 'projected_revenue', expr: 'revenue * (1 + g)' }`)
turns a static chart into a model.

**Cost.** Depends on how rich the expression language gets. v1 (single-variable linear
scale): ~3 days. v2 (DuckDB SQL parameter): ~1 week.

**Priority.** 🟡.

### C5. 🟢 Shareable URLs ("permalink to this view")

**Why it fits.** Right now there is no way to share a chart. Encode the dataset hash +
chart spec in the URL hash and you have a permalink that anyone can open.

**Implementation.** For uploaded data, you have a problem (the recipient can't see your
file). Solutions:

- For the *built-in* and *URL-loaded* datasets: encode dataset id + chart spec.
- For uploaded data: optional "export shareable file" that bundles data + spec into one
  JSON download.
- With a backend: store a dataset blob and return a short URL (cost adds up).

**Cost.** ~3 days for the URL-encoded version.

**Priority.** 🟢.

---

## Theme D — Performance and scale

### D1. 🔴 100 k → 10 M rows by streaming + downsampling

**Why it fits.** Doc 02 §1.2 + §10.1 set up the foundation. Add **viewport-aware
downsampling** (LTTB algorithm for line charts, hex-binning for scatter, datashader-
style aggregation for very large clouds) and the platform handles datasets a hundred
times larger than today.

**Cost.** ~2 weeks. Needs DuckDB-Wasm (doc 02 §10.1) or a custom Worker.

**Priority.** 🔴 if you're targeting analytics professionals; 🟡 otherwise.

### D2. 🟡 Real-time / streaming data view

**Why it fits.** PatternDetector has time-series logic. Wire it to a websocket /
Server-Sent-Events feed and you have a live dashboard. Three.js handles 60 fps line
animations comfortably.

**Cost.** ~1 week.

**Priority.** 🟡.

### D3. 🟢 Export to PNG / SVG / PDF

**Why it fits.** `file-saver` is already a dependency. Recharts SVGs serialise; the 3D
canvas has `gl.domElement.toDataURL`. Wrap them up.

**Cost.** ~2 days.

**Priority.** 🟢.

---

## Theme E — Collaboration and workflow

### E1. 🔴 Accounts + persisted workspaces

**Why it fits.** Once dashboards (C3) and shareable URLs (C5) exist, accounts are the
natural next step.

**What it looks like.** Sign in with Google or magic-link email → save datasets +
dashboards in the cloud.

**Implementation.** This is the platform's first real backend. Lightweight options
(in approximate increasing complexity): Supabase, Firebase, Convex, a small Node/
Postgres of your own. Supabase pairs well — it gives you Postgres + auth + storage,
and exports CSV directly to autodata.

**Cost.** ~3 weeks.

**Priority.** 🔴 strategic — this is the moment the product becomes a SaaS. Don't do
it until you have validation that paying users want a hosted version.

### E2. 🟡 Comments + annotations on charts

**Why it fits.** Sticky notes on data points / regions ("this spike is the marketing
launch"). Trivially viral when combined with shareable URLs.

**Cost.** ~1 week (after E1).

**Priority.** 🟡.

### E3. 🟢 Embed mode

**Why it fits.** A query parameter that strips the chrome and renders a single chart in
an iframe. Lets users embed an autodata chart in Notion, blogs, internal wikis.

**Cost.** ~3 days.

**Priority.** 🟢. Good marketing — every embed is a backlink.

---

## Theme F — Trust and quality of insights

### F1. 🟡 Statistical significance badges

**Why it fits.** Today the Brain reports "weight and mpg are correlated (r = -0.87)".
That's true but incomplete — small samples produce big spurious correlations.

**What it looks like.** Each insight gets a confidence badge: `r = -0.87, n = 392,
p < 0.001`. Insights below a threshold are shown but flagged.

**Cost.** ~3 days. Add p-value calculation (`statisticalUtils.js`) and a badge
component.

**Priority.** 🟡 — small change, big credibility win for serious users.

### F2. 🟢 Data quality report

**Why it fits.** The first thing a real analyst does is a missingness audit. The Brain
already counts nulls per column.

**What it looks like.** A "Data quality" tab right after upload:

> 392 rows × 9 columns. 0 % missing on most columns; `horsepower` has 6 missing values
> (1.5 %). 1 outlier in `cylinders`. No duplicate rows. 3 columns are highly correlated
> (r > 0.85) — consider dropping one before regression.

**Cost.** ~3 days.

**Priority.** 🟢.

### F3. 🟡 Schema inference improvements

**Why it fits.** The current type detection has known holes (doc 02 §1.8). Beyond the
fixes there, add:

- **Currency / unit detection**: `"$1,234.56"` → numeric with currency metadata.
- **Geo detection**: `"40.7,-74.0"` → lat/long pair → unlocks geo-map (C1).
- **Hierarchy detection**: `category > subcategory > item` paths → unlocks treemap.

**Cost.** ~1 week.

**Priority.** 🟡.

---

## Theme G — Onboarding and education

### G1. 🟢 Tutorial mode that *teaches statistics*

**Why it fits.** intro.js is already a dependency for app onboarding. Expand it: walk
the user through *what a correlation actually means*, *why a histogram bin matters*,
etc., using the loaded dataset.

**Cost.** ~1 week of content writing + 2 days of integration.

**Priority.** 🟢. Differentiator vs Tableau et al.

### G2. 🟢 Sample-data gallery → notebook-style scrollytelling

**Why it fits.** "Click here for a guided tour of the Iris dataset" → autodata animates
through five charts and explains each one.

**Cost.** ~1 week per dataset narrative.

**Priority.** 🟢.

---

## Suggested release roadmap

A pragmatic three-quarter sequence, assuming doc 02's fixes are absorbed in parallel.

**Q1 — foundations + visible wins**
- Doc 02 phases 1–3 (perf, security, Vite migration)
- C3 dashboards
- C5 shareable URLs
- D3 export to PNG/PDF
- A2 narrative summary
- F2 data quality report

**Q2 — analytical depth**
- DuckDB-Wasm + Web Worker (doc 02 §1.2 + §10.1)
- C1 more chart types
- C2 linked views / brushing
- B1 Parquet support
- B4 multi-file join
- F1 significance badges

**Q3 — going hosted**
- A1 natural-language query (LLM-backed)
- E1 accounts + workspaces
- E2 annotations
- E3 embed mode
- B3 Sheets connector
- D2 streaming data

By the end of Q3, autodata is a credible, hosted, AI-assisted alternative to the
"upload CSV and explore" tier of Tableau / Looker, with a moat in the
auto-suggestion engine.

---

## What I would *not* build

A few features that would tempt you but probably shouldn't make the roadmap:

- **A query language of your own.** SQL via DuckDB is enough.
- **A code-first notebook (à la Observable).** Different product, different audience.
- **Native mobile apps.** A good PWA is sufficient for this use case.
- **An on-device LLM.** WebLLM / WASM Llama is fun but the latency / quality trade-off
  is bad in 2026 for the conversational features you'd want.

---

## Sources informing this doc

- [Microsoft LIDA — automated visualisations with LLMs](https://microsoft.github.io/lida/)
- [Chat2VIS: generating data visualisations via natural language (arXiv)](https://arxiv.org/pdf/2302.02094)
- [LLM-powered visualisations from natural language queries (CEUR 2024)](https://ceur-ws.org/Vol-4099/ER25_PAD_Nascimento.pdf)
- [Evaluating LLMs for visualisation generation — Springer Discover Data, 2025](https://link.springer.com/article/10.1007/s44248-025-00036-4)
- [DuckDB-Wasm: in-browser OLAP](https://motherduck.com/blog/duckdb-wasm-in-browser/)
- [12 helpful tips for powerful React graphs (2026)](https://www.fusioncharts.com/blog/12-helpful-tips-for-doing-powerful-react-graphs/)
- [Top 5 React chart libraries to know in 2026 — Syncfusion](https://www.syncfusion.com/blogs/post/top-5-react-chart-libraries)
- [3D data visualisation with React + Three.js — Cortico](https://medium.com/cortico/3d-data-visualization-with-react-and-three-js-7272fb6de432)
