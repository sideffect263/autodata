# Autodata v2 — How the Project Works

This document describes the architecture of the `data-viz-platform` as it exists on the
`origin/v2` branch (the production branch). It is the result of a full source-code walk
of `v2/data-viz-platform/src/**`.

Companion documents:
- `02-weak-points-and-fixes.md` — code review and remediation plan
- `03-feature-proposals.md` — proposed enhancements

---

## 1. Product summary

Autodata is a **client-side, single-page React application** that lets a user upload a
dataset (CSV, JSON, or Excel) and instantly explore it through:

- a **2D charts view** (Recharts: bar, line, pie, scatter)
- a **3D visualisation view** (Three.js via react-three-fiber: 3D scatter, 3D bars,
  surface plot)
- a **table view** for raw inspection
- a **settings view** for theme and performance preferences

The differentiator is the **"Brain" service** — an in-browser analytics engine that
inspects the uploaded data, classifies columns, detects patterns (correlations,
distributions, outliers, time-series trends), and **auto-recommends** appropriate
visualisations with a confidence score.

There is **no backend, no database, no auth**. Everything runs in the browser. The site
is built and deployed as static assets.

---

## 2. Top-level layout

```
v2/data-viz-platform/
├── public/                # static assets, sample datasets, index.html
│   └── datasets/          # Iris.csv, cars.csv, planets.csv, stocks.csv
├── src/
│   ├── App.js             # root layout + routing
│   ├── index.js           # ReactDOM.render entry
│   ├── components/
│   │   ├── layout/        # AppHeader, Sidebar
│   │   ├── upload/        # DataUpload, DropZone, datasource/*
│   │   ├── views/         # ChartsView, ThreeDView, TableView, SettingsView
│   │   ├── visualizations/3d/   # ScatterPlot3D, BarChart3D, SurfacePlot3D, Axes3D
│   │   ├── charts/        # 2D Recharts wrappers
│   │   ├── controls/      # ChartControls
│   │   └── common/        # ErrorBoundary, LoadingOverlay, LoadingSpinner
│   ├── contexts/          # DataContext, SettingsContext
│   ├── hooks/             # useBrain, useAnalysis, useVisualizationData, useVisualizationSettings
│   ├── services/brain/    # the Brain analytics engine (see §5)
│   ├── utils/             # fileHandlers, visualization3DUtils
│   └── theme/             # MUI theme
├── package.json           # CRA / react-scripts
└── README.md
```

A few naming oddities to be aware of (called out in detail in doc 02):

- `views/ChartsView.jsx` (a flat wrapper file) **and** `views/ChartsView/` (a directory
  with `index.jsx`) coexist. `App.js` imports the flat wrapper.
- Same situation for `views/ThreeDView.jsx` vs `views/ThreeDView/`.
- `hooks/InsightsPanel.jsx` is a React component, not a hook, but lives under `hooks/`.
- Two files named `columnAnalyzer.js` exist: `services/brain/analyzers/columnAnalyzer.js`
  and `services/brain/analyzers/utils/columnAnalyzer.js`.

---

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | React 18.3 |
| Build tool | Create React App (`react-scripts` 5.0.1) |
| UI kit | Material-UI v6 + Emotion |
| 2D charts | Recharts 2.13 |
| 3D | Three.js 0.170 + `@react-three/fiber` + `@react-three/drei` |
| File parsing | PapaParse (CSV), XLSX (Excel), `JSON.parse` |
| Utilities | lodash, chroma-js, date-fns, file-saver |
| Onboarding | intro.js |
| Tests | `@testing-library/react`, jest (one trivial test only) |
| Deploy | Static hosting (Render-style); no `render.yaml` on v2 |

---

## 4. Application shell and routing

`src/App.js` is the root. There is **no router library**; "routing" is a `currentView`
string in `DataContext` that switches between `'upload' | 'table' | 'charts' | '3d' |
'settings'`. The shell layout is a fixed `AppHeader` + collapsible `Sidebar` + main
content area.

**Provider tree** (top to bottom in the actual code):

```
<ErrorBoundary>
  <DataProvider>
    <SettingsProvider>
      <ChartProvider>
        <ThemeProvider theme={…}>
          <CssBaseline />
          <AppHeader /> <Sidebar /> <ViewContent />
```

`ViewContent` reads `currentView`, `error`, `isLoading`, `data`, `analysis` from
`DataContext` and chooses what to render. If the active view requires data and there is
none, it falls back to `<DataUpload />`.

---

## 5. Data flow — what happens when you upload a file

This is the heart of the application. The flow is:

```
  ┌──────────────────────────┐
  │ User drops a file or     │
  │ picks a sample dataset   │
  └─────────────┬────────────┘
                │
                ▼
  ┌──────────────────────────────────────────┐
  │ utils/fileHandlers.js → processFile()    │
  │  • size check (100 MB hard cap)          │
  │  • detects mobile vs desktop user-agent  │
  │  • mobile  → processMobileFile (chunks)  │
  │  • desktop → processDesktopFile          │
  │  • parses with PapaParse / XLSX / JSON   │
  │  • validateAndCleanData() → row[]        │
  └─────────────┬────────────────────────────┘
                │ Array of row objects
                ▼
  ┌──────────────────────────────────────────┐
  │ contexts/DataContext.js → processData()  │
  │  • Promise.race vs 30s timeout           │
  │  • setProcessingStatus({stage, progress})│
  │  • emits BRAIN_EVENTS to UI              │
  │  • delegates to BrainService             │
  └─────────────┬────────────────────────────┘
                │
                ▼
  ┌──────────────────────────────────────────┐
  │ services/brain/BrainService.js           │
  │ runs the analysis pipeline (§6)          │
  └─────────────┬────────────────────────────┘
                │ { analysis, suggestions, insights }
                ▼
  ┌──────────────────────────────────────────┐
  │ DataContext stores the result.           │
  │ Components read via useData(),           │
  │ useBrain(), useChart(), useThreeD().     │
  └──────────────────────────────────────────┘
```

### File parsing details

- **CSV** uses `Papa.parse` with `header: true, dynamicTyping: true,
  skipEmptyLines: 'greedy'`. `dynamicTyping` means numbers are auto-cast.
- **Excel** uses `XLSX.read(arrayBuffer, { cellDates: true, dateNF: 'yyyy-mm-dd' })` and
  reads only the first sheet.
- **JSON** assumes either an array or a single object (wrapped in `[data]`).
- **Mobile chunking** slices the file into 1 MB chunks, parses each chunk independently,
  and concatenates the results. For CSV, this means **headers are re-parsed in every
  chunk** — see doc 02.
- **Validation** is `validateAndCleanData()` which today only filters empty rows. It is
  not a schema validator.

### DataContext processing pipeline

`DataContext` adds a 30-second timeout wrapper, sets `processingStatus.stage` and
`processingStatus.progress` so the loading overlay can show progress, and forwards
`BRAIN_EVENTS` (the `BrainService` extends `EventEmitter`).

---

## 6. The Brain service

`services/brain/` is the analytics engine. It is structured as five layers:

```
                ┌─────────────────────────────────┐
                │       BrainService              │  orchestrator + cache
                │   (extends EventEmitter)        │
                └────────┬────────────────────────┘
                         │
       ┌─────────────────┼──────────────────────────────┐
       ▼                 ▼                              ▼
┌────────────┐   ┌────────────────┐              ┌──────────────┐
│ DataProc.  │   │ Memory         │              │ Insight      │
│ clean +    │   │ Manager        │              │ Generator    │
│ normalise  │   │ size estimates │              │ (text)       │
└─────┬──────┘   └──────┬─────────┘              └──────┬───────┘
      │                 │                                │
      ▼                 ▼                                ▲
┌────────────────────────────────────────┐               │
│ Analyzers                              │               │
│  • ColumnAnalyzer  (type + stats)      ├──────────────►│
│  • PatternDetector (corr, dist, time)  │               │
│  • VisualizationSuggester (rules+score)│               │
└────────────────────────────────────────┘               │
                         │                               │
                         ▼                               │
                ┌─────────────────┐                      │
                │  Managers       │ ◄────────────────────┘
                │  Analysis,      │
                │  Insight,       │
                │  Visualization  │
                └─────────────────┘
```

### `BrainService` (orchestrator)

- Singleton instance exported at the bottom of the file.
- Holds three `Map`s in memory: `analysisCache`, `suggestionHistory`,
  `userPreferences`.
- `settings` object has the magic numbers that drive the whole pipeline:
  - `maxDataPoints: 100000`
  - `minConfidenceScore: 0.6`
  - `maxSuggestions: 10`
  - `correlationThreshold: 0.5`
  - `patternDetectionThreshold: 0.7`
  - `maxInsightsPerType: 5`
  - `maxTotalInsights: 20`
- Public API: `initialize()`, `processData()`, `updatePreferences()`,
  `getCurrentAnalysis()`, plus EventEmitter events (`ready`, `analysisComplete`,
  `error`, …).

### `DataProcessor` (`processors/DataProcessor.js`)

Trims string values, removes fully-empty rows, and (when memory is tight) samples
random rows down to a target size. Caches by row-count + column-name list.

### `ColumnAnalyzer` (`analyzers/columnAnalyzer.js`)

For each column, infers a `type` (`numeric | categorical | date | text`) and computes
descriptive statistics:

- numeric → min, max, mean, median, stdDev, quartiles, skewness, kurtosis
- categorical → distinct values, mode, frequency, entropy
- date → min/max date, range
- text → length distribution

### `PatternDetector` (`analyzers/patternDetector.js`)

Runs five detectors in `Promise.all`:

1. **Correlations** — Pearson across every pair of numeric columns.
2. **Time-series** — picks date columns + numeric columns, looks for trend and
   seasonality (counts turning points in differences — not FFT).
3. **Distributions** — classifies each numeric column as normal / skewed / bimodal.
4. **Outliers** — z-score (`|z| > outlierThreshold = 2`) plus a naive DBSCAN.
5. **Categorical patterns** — top-K frequencies, entropy, association heuristics.

### `VisualizationSuggester` (`analyzers/visualizationSuggester.js`)

Imports declarative rules from `analyzers/rules/*.js` (categoricalRules,
numericRules, numerical3DRules, relationshipRules, statisticalRules,
timeSeriesRules) and combines them with the detected patterns to produce a list of
suggestions. Each suggestion has:

```
{
  type: 'scatter' | 'bar' | 'line' | 'pie' | 'scatter3D' | 'bar3D' | 'surface3D',
  columns: { x, y, z?, group? },
  score: 0..1,                  // confidence
  rationale: 'string',
  rule: 'rule-id'
}
```

The score is `relevance * preferenceWeight * patternStrength`. Suggestions below
`minConfidenceScore` are dropped, and the top `maxSuggestions` survive.

### `InsightGenerator` (`analyzers/insightGenerator.js`)

Turns numeric findings into human-readable strings ("`mpg` is strongly negatively
correlated with `weight` (r = -0.87)"). It is weighted by an `importanceWeights`
table (correlation = 0.9, trend = 0.85, distribution = 0.7, outlier = 0.65,
categorical = 0.6).

### Managers

- `AnalysisManager` — bookkeeping for the current analysis.
- `InsightManager` — caps insights per type + total.
- `MemoryManager` — estimates dataset size in bytes and queries
  `performance.memory.jsHeapSizeLimit` to decide whether to sample.
- `VisualizationManager` — keeps track of the active visualisation choice.

### Utilities

- `utils/statisticalUtils.js` — Pearson correlation, trend / seasonality helpers.
- `utils/deviceDetection.js` — user-agent based mobile detection.
- `optimizers/performanceOptimizer.js` — adapts settings (sample size, animation,
  shadows) based on device class.

---

## 7. State management

All state is **React Context**. There is no Redux / Zustand / Jotai. The four contexts
are:

| Context | Owner | What lives in it |
|---|---|---|
| `DataContext` | `contexts/DataContext.js` | `data`, `analysis`, `error`, `isLoading`, `processingStatus`, `currentView`, plus `processData()` and `clearData()` |
| `SettingsContext` | `contexts/SettingsContext.jsx` | theme mode, animation, perf prefs, persisted to `localStorage` |
| `ChartProvider` | `components/views/ChartsView/ChartContext.jsx` | active 2D chart type, selected suggestion, axis mappings |
| `ThreeDProvider` | `components/views/ThreeDView/context/ThreeDContext.jsx` | 3D camera, point size, max points, rendering quality, axis mappings |

Each has its own `useX()` hook that throws if used outside the provider.

The `useBrain` hook is a façade that proxies into the `BrainService` singleton from a
component, keeping `analysis`, `suggestions`, `insights`, and `visualizationConfig` in
local state and re-running the pipeline whenever `data` changes.

---

## 8. Rendering

### 2D charts (`components/charts/*.jsx`)

Thin Recharts wrappers (`<BarChart>`, `<LineChart>`, `<PieChart>`, `<ScatterPlot>`).
`ChartVisualization.jsx` picks one based on the user's choice and the suggestion. They
operate on the full dataset returned by the Brain — there is no virtualization or
downsampling at the chart layer.

### 3D charts (`components/visualizations/3d/*.jsx`)

A single `<Canvas>` from `@react-three/fiber` is mounted in `views/ThreeDView.jsx`.
Inside it:

- `Axes3D.jsx` draws the grid and labels.
- `ScatterPlot3D.jsx` and `BarChart3D.jsx` render **one `<mesh>` per data point** and
  use `<Html>` from drei for tooltips.
- `SurfacePlot3D.jsx` builds a `BufferGeometry` over an X/Z grid.

Camera, lighting, shadows, antialiasing, and pixel ratio are pulled from
`SettingsContext.performance`. `ControlPanel.jsx` is a sidebar of MUI sliders that mutate
`ThreeDContext`.

### Common UI

- `ErrorBoundary` wraps the whole app and renders a fallback alert if a child throws.
- `LoadingOverlay` shows the staged progress message from `processingStatus`.
- `intro.js` provides a guided tour that fires on the first visit.

---

## 9. Build, deploy, and security posture

- **Build**: `npm run build` → CRA's webpack → `build/` directory of static assets.
- **Deploy**: any static host (the README mentions Render). There is **no `render.yaml`
  on v2**; the dev branch I was developing on (`claude/check-git-access-Ppl26`) carries
  one.
- **CSP**: defined in `public/index.html` as
  `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src *;
  img-src *; style-src 'self' 'unsafe-inline';`. This is permissive — see doc 02.
- **PWA**: there is a `manifest.json` and an apple-touch-icon, but no service worker,
  so it is not installable.

---

## 10. What runs on the main thread

Everything. There is no Web Worker, no WebAssembly, no off-main-thread analytics. On a
100 k-row CSV with many numeric columns, the Brain's `Promise.all` of detectors will
block the UI for several seconds while correlation matrices and outlier detection run.
Doc 02 quantifies this and recommends moving the Brain into a Worker via Comlink.

---

## 11. Reading order if you're new

1. `src/App.js` — the shell (10 minutes).
2. `src/utils/fileHandlers.js` — how files become rows (15 minutes).
3. `src/contexts/DataContext.js` — how rows become app state (10 minutes).
4. `src/services/brain/BrainService.js` then `analyzers/columnAnalyzer.js`,
   `patternDetector.js`, `visualizationSuggester.js` — the brain (60 minutes).
5. `src/components/views/ChartsView/index.jsx` and
   `components/views/ThreeDView.jsx` + `visualizations/3d/ScatterPlot3D.jsx` — how
   suggestions become pictures (45 minutes).

That sequence is the same one I would take to onboard a new engineer.
