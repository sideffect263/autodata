# Autodata v2 — Fix Playbook

This is the **execution plan** for the issues in `02-weak-points-and-fixes.md`.
Each issue has a stable ID (W*x.y* matching the section number in doc 02), a risk
tier, a concrete patch sketch, a test plan, and exit criteria.

**Risk tiers**

| Tier | Meaning | Use in autonomous run? |
|---|---|---|
| 🟢 **Autorun** | Small, isolated, validatable in seconds | yes |
| 🟡 **Reviewable** | Touches several files or has visual regression risk | yes, but pause for diff approval |
| 🔴 **Collaborative** | Architectural decision; needs design discussion | no — full session with user |

The `/fix-issue` slash command honours these tiers automatically.

**Conventions**

- All paths are relative to the repo root; the production source lives under
  `v2/data-viz-platform/`.
- "Test plan" lists *concrete* shell commands. If a unit test for a fix doesn't yet
  exist, the playbook either creates one as part of the fix or marks the validation
  as "manual eyeball".
- "Status" is updated by the `/fix-issue` command: `pending` → `in-progress` →
  `done @ <sha>`.

---

## Dependency graph

```
                  W6.1 (test infra)
                        │
                        ▼
   W1.1 ─┬─► W1.4 ─┬─► W1.2 (Worker) ──► W1.3
         │         │
         │         └─► W10.1 (DuckDB)
         │
         ├─► W1.6
         ├─► W1.7  (after W6.1)
         ├─► W1.8
         ├─► W1.9  (after W6.1)
         ├─► W1.10
         ├─► W1.11
         └─► W1.12

   W2.1 ──► W2.2          (3D rewrite)
   W2.3 (independent)
   W2.4 (after W2.1)
   W2.5 (independent)
   W2.6 (after W2.1)

   W3.3 ──► W3.4          (cleanup)
   W3.2 (independent)
   W3.1 (Zustand)         (after W6.1)

   W4.1 (independent)
   W4.2 (independent)
   W4.3 ──► W4.4
   W4.5 (independent)
   W4.6 (independent)

   W5.1 (Vite) ──► W5.2 ──► W5.3 ──► W5.4
   W5.1 unblocks W1.2 (Comlink Worker prefers Vite)

   W7.1 W7.2 W7.3  (independent, manual verification)
   W8.1 W8.2       (manual verification)

   W9 W10.1 W10.2  (collaborative, do separately)
```

## Recommended execution order

The order below front-loads the safe wins so the first all-nighter delivers visible
results:

**Wave 1 — All-nighter friendly (🟢 only)**
W4.2 → W4.5 → W2.3 → W3.3 → W3.4 → W3.2 → W1.10 → W1.6 → W1.8 → W4.1 → W2.6 → W5.3

**Wave 2 — Test foundation (🟡)**
W6.1 (must precede most subsequent waves)

**Wave 3 — Reviewable Brain hardening (🟡 with W6.1 in place)**
W1.1 → W1.7 → W1.9 → W1.11 → W1.12 → W1.5

**Wave 4 — 3D rewrite (🟡)**
W2.1 → W2.2 → W2.4 → W2.5

**Wave 5 — Security + ingest (🟡)**
W4.3 → W4.4 → W4.6

**Wave 6 — Tooling (🔴 then 🟡)**
W5.1 (full session) → W5.2 → W5.4

**Wave 7 — Architectural (🔴)**
W1.2 → W1.3 → W1.4 → W3.1

**Wave 8 — A11y / Mobile / Observability**
W7.1 → W7.2 → W7.3 → W8.1 → W8.2 → W9

**Wave 9 — Strategic (🔴)**
W10.1 → W10.2 (only if you want them; doc 03 covers the case)

---

# Issues

> The format for each entry is intentionally compact and machine-parseable so that
> `/fix-issue` can ingest it without ambiguity.

---

### W1.1 — Replace shape-based cache key with content fingerprint

- **status**: pending
- **tier**: 🟡 (touches caching; needs unit test)
- **estimate**: 1 h
- **files**:
  - `v2/data-viz-platform/src/services/brain/processors/DataProcessor.js`
  - `v2/data-viz-platform/src/services/brain/processors/__tests__/DataProcessor.test.js` (new)
- **patch sketch**:
  ```js
  // top of file
  const fnv1a = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
  };

  generateCacheKey(data) {
    const schema = Object.keys(data[0] ?? {}).join('|');
    const head = JSON.stringify(data.slice(0, 16));
    const tail = JSON.stringify(data.slice(-16));
    return `${data.length}:${fnv1a(schema + head + tail)}`;
  }
  ```
- **test plan**: new unit test — two datasets with same shape but different values
  produce different keys; identical datasets produce identical keys
- **exit criteria**: test passes; existing app behaviour unchanged on sample data

---

### W1.2 — Move Brain into a Web Worker via Comlink

- **status**: pending
- **tier**: 🔴
- **estimate**: 2 days
- **prerequisites**: W5.1 (Vite) for clean `new URL(..., import.meta.url)` worker imports
- **files**: new `src/workers/brain.worker.js`; modify `src/hooks/useBrain.js`
- **patch sketch**: see doc 02 §1.2
- **test plan**: manual — upload Iris, confirm UI stays interactive while Brain runs;
  add a test that throws inside the Worker and verify it surfaces to React state
- **exit criteria**: 100k-row CSV no longer blocks input for >100ms

---

### W1.3 — Bound the Brain's caches and remove singleton mutable state

- **status**: pending
- **tier**: 🟡
- **estimate**: 3 h
- **prerequisites**: W1.2 (after Worker, the singleton is per-Worker)
- **files**: `src/services/brain/BrainService.js`
- **patch sketch**: replace `Map` caches with `lru-cache` (npm) bounded to ~200 entries;
  freeze the public API
- **test plan**: add a unit test that fills the cache past its limit and confirms
  oldest entries evict
- **exit criteria**: long sessions no longer accumulate unbounded memory

---

### W1.4 — Externalise Brain magic numbers into a config

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **files**:
  - `src/services/brain/BrainConfig.js` (new)
  - `src/services/brain/BrainService.js`
  - `src/contexts/SettingsContext.jsx` (expose overrides)
- **patch sketch**: extract the `this.settings = {...}` block in `BrainService` into a
  named export `DEFAULT_BRAIN_CONFIG`; let constructor accept `(overrides)` and
  shallow-merge
- **test plan**: unit test that overriding `maxSuggestions` actually limits output
- **exit criteria**: settings can be tuned at runtime via `SettingsContext`

---

### W1.5 — Cross-browser memory budget

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **files**: `src/services/brain/managers/MemoryManager.js`
- **patch sketch**:
  ```js
  getAvailableMemory() {
    const deviceGB = navigator.deviceMemory ?? 2;
    const heapBudget = Math.min(deviceGB * 1024**3 * 0.25, 512 * 1024**2);
    return { recommendedSize: Math.floor(heapBudget / this.bytesPerRow) };
  }
  ```
- **test plan**: unit test with mocked `navigator.deviceMemory` values 0.5, 2, 8
- **exit criteria**: behaves consistently across Firefox/Safari/Chrome

---

### W1.6 — Replace biased random sampling with reservoir sampling

- **status**: pending
- **tier**: 🟢
- **estimate**: 1 h
- **files**:
  - `src/services/brain/processors/DataProcessor.js`
  - `src/services/brain/processors/__tests__/DataProcessor.test.js`
- **patch sketch**:
  ```js
  sampleData(data, k) {
    if (data.length <= k) return data;
    const out = data.slice(0, k);
    for (let i = k; i < data.length; i++) {
      const j = Math.floor(Math.random() * (i + 1));
      if (j < k) out[j] = data[i];
    }
    return out;
  }
  ```
- **test plan**: unit test asserts `out.length === k` for any input ≥ k
- **exit criteria**: deterministic sample size; no empty samples

---

### W1.7 — Single-pass correlation matrix

- **status**: pending
- **tier**: 🟡
- **estimate**: 4 h
- **prerequisites**: W6.1 (need test infra to validate against existing implementation)
- **files**: `src/services/brain/analyzers/patternDetector.js`
- **patch sketch**: compute `mean[c]` and `std[c]` once from `ColumnAnalyzer` output;
  iterate rows once and update `sumXY[i][j]` for `j > i`; derive correlation at the end
- **test plan**: snapshot test on `Iris.csv` — new and old implementation must agree
  to ±1e-9 on every cell
- **exit criteria**: correlation step on cars.csv runs ≥10× faster, identical results

---

### W1.8 — Robust column type detection

- **status**: pending
- **tier**: 🟢
- **estimate**: 2 h
- **files**:
  - `src/services/brain/analyzers/columnAnalyzer.js`
  - new `src/services/brain/analyzers/__tests__/columnAnalyzer.test.js`
- **patch sketch**:
  ```js
  const NUMERIC = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
  const isNumber = v => typeof v === 'number'
    ? Number.isFinite(v)
    : typeof v === 'string' && NUMERIC.test(v.trim());
  // for date: parseISO from date-fns + isValid
  ```
- **test plan**: table-driven unit test covering ints, floats, scientific, NaN,
  Infinity, ISO dates, malformed dates, currency, booleans
- **exit criteria**: every test case classifies correctly

---

### W1.9 — Remove the duplicate `columnAnalyzer.js`

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **prerequisites**: W6.1 to ensure imports still resolve everywhere
- **files**:
  - delete `src/services/brain/analyzers/utils/columnAnalyzer.js`
  - extract its unique helpers (`findRelatedColumns`, `getWordSimilarity`) to new
    `src/services/brain/analyzers/utils/columnRelationships.js`
  - update all importers
- **test plan**: `grep -r "analyzers/utils/columnAnalyzer" src` returns zero hits;
  build passes
- **exit criteria**: single source of truth for column analysis

---

### W1.10 — Replace stub methods with explicit `NotImplemented`

- **status**: pending
- **tier**: 🟢
- **estimate**: 1 h
- **files**: `src/services/brain/analyzers/visualizationSuggester.js`,
  `src/services/brain/analyzers/insightGenerator.js`
- **patch sketch**: stubs (`return true;`, `return [];`, missing methods) →
  `throw new Error('NotImplemented: <name>')` or remove the method entirely if no
  call site relies on it
- **test plan**: `grep -r "NotImplemented" src` to inventory the stubs; verify the app
  still runs on the sample dataset (any thrown stub should be exposed as a real bug)
- **exit criteria**: no method silently returns the wrong-shaped value

---

### W1.11 — `useBrain` cancellable analysis with `AbortController`

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **files**: `src/hooks/useBrain.js`, `src/services/brain/BrainService.js` (accept `signal`)
- **patch sketch**: `useEffect` creates an `AbortController`; cleanup aborts it; the
  Brain checks `signal.aborted` between detector calls and returns early
- **test plan**: render a component that flips `data` 10 times in a tight loop,
  assert only one analysis result lands in state
- **exit criteria**: rapid prop changes never produce stale results

---

### W1.12 — Clear timeout in `DataContext.processData`

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/contexts/DataContext.js`
- **patch sketch**: wrap in `try/finally` and `clearTimeout(processingTimeoutRef.current)`
- **test plan**: unit test with fake timers — fast resolution clears the timer
- **exit criteria**: no dangling timer warnings in long sessions

---

### W2.1 — `InstancedMesh` for 3D scatter and bar charts

- **status**: pending
- **tier**: 🟡
- **estimate**: 1 day
- **files**:
  - `src/components/visualizations/3d/ScatterPlot3D.jsx`
  - `src/components/visualizations/3d/BarChart3D.jsx`
- **patch sketch**: replace `points.map(... <mesh><sphereGeometry/></mesh>)` with
  `<Instances>` from `@react-three/drei`. Use `useFrame` + `instanceMatrix.needsUpdate`
  for hover. Implement raycasting on the parent `<Instances>` mesh and look up
  `instanceId` to identify the hovered point.
- **test plan**: visual — load `cars.csv`, switch to 3D scatter, confirm 60 fps. Load
  a synthetic 50k-row dataset and confirm the canvas still renders.
- **exit criteria**: 10k+ point datasets render at ≥60 fps on a mid-range laptop

---

### W2.2 — Memoise geometries and dispose on unmount

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **prerequisites**: W2.1
- **files**: same as W2.1
- **patch sketch**: declare a single `useMemo`-ed `SphereGeometry` and reuse; add a
  `useEffect` cleanup that disposes it
- **test plan**: open Chrome DevTools Memory tab; mount and unmount the 3D view 10
  times; assert no growing geometry count
- **exit criteria**: zero geometry leak across mount/unmount cycles

---

### W2.3 — Replace `Math.min(...arr)` with finite-aware reducer

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/components/visualizations/3d/ScatterPlot3D.jsx`,
  `BarChart3D.jsx`, `SurfacePlot3D.jsx`
- **patch sketch**:
  ```js
  let mn = Infinity, mx = -Infinity;
  for (const v of arr) {
    if (Number.isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v; }
  }
  ```
- **test plan**: smoke — load a dataset that contains a `NaN` cell; confirm no
  `NaN` propagation into camera bounds
- **exit criteria**: `NaN` in source data produces a sensible fallback (mn=0, mx=1)
  rather than crashing

---

### W2.4 — Stable per-row IDs for 3D point keys

- **status**: pending
- **tier**: 🟡
- **estimate**: 1 h
- **prerequisites**: W2.1 makes this largely moot; do this only if W2.1 is deferred
- **files**: `src/utils/fileHandlers.js` (assign `__id` at parse time),
  3D components
- **patch sketch**: `validateAndCleanData` adds `row.__id = row.__id ?? crypto.randomUUID()`
- **test plan**: unit test on `validateAndCleanData` asserts ids are unique
- **exit criteria**: keys remain stable across filtering/sorting

---

### W2.5 — Narrow `<Canvas>` config dependencies

- **status**: pending
- **tier**: 🟡
- **estimate**: 1 h
- **files**: `src/components/views/ThreeDView.jsx`
- **patch sketch**: split the single `useMemo([settings])` into three with narrow
  deps: `settings.display.enableShadows`, `settings.performance.pixelRatio`,
  `settings.camera.*`
- **test plan**: render the 3D view, toggle theme — Canvas should not re-mount
- **exit criteria**: no unnecessary WebGL context resets on settings changes

---

### W2.6 — `frameloop="demand"` plus explicit invalidate

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/components/views/ThreeDView.jsx`
- **patch sketch**: `<Canvas frameloop="demand">` and `invalidate()` on
  `OrbitControls.onChange`
- **test plan**: open the 3D view and idle — DevTools "Performance" should show
  rAF callbacks at ~0/s; orbit the camera, callbacks rise
- **exit criteria**: idle CPU ≈ 0 % when 3D view is open but unattended

---

### W3.1 — Migrate global app state to Zustand

- **status**: pending
- **tier**: 🔴
- **estimate**: 4 days
- **prerequisites**: W6.1
- **files**: `src/store/*` (new), then a sweep of every consumer
- **patch sketch**: see doc 02 §3.1; one store per concern (`useDataStore`,
  `useChartStore`, `useThreeDStore`); keep `SettingsContext` for static-ish theme
- **test plan**: add a perf test: trigger 100 `processingStatus` updates and assert
  unrelated components do not re-render
- **exit criteria**: no `Provider` for app data state; React DevTools shows targeted
  re-renders

---

### W3.2 — Stable preference reference in `ChartContext`

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/components/views/ChartsView/ChartContext.jsx`
- **patch sketch**: maintain a `useRef` of the preferences `Map`, mutate in place,
  and call `updatePreferences(prefsRef.current)`
- **test plan**: React Profiler — selecting a chart type re-renders only the
  visualization area
- **exit criteria**: chart type change does not cascade through siblings

---

### W3.3 — Delete duplicate `ChartsView.jsx` / `ThreeDView.jsx` wrappers

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**:
  - delete `src/components/views/ChartsView.jsx`
  - delete `src/components/views/ThreeDView.jsx`
  - update imports in `src/App.js` to point at `./components/views/ChartsView` and
    `./components/views/ThreeDView` (Node will resolve to `index.jsx`)
- **test plan**: `npm run build` succeeds; smoke-load the app and switch to each view
- **exit criteria**: only one ChartsView and one ThreeDView per kind

---

### W3.4 — Move `InsightsPanel.jsx` out of `hooks/`

- **status**: pending
- **tier**: 🟢
- **estimate**: 15 min
- **files**:
  - move `src/hooks/InsightsPanel.jsx` → `src/components/insights/InsightsPanel.jsx`
  - update importers
- **test plan**: build succeeds; insights panel still renders on the home view
- **exit criteria**: `hooks/` contains only hooks

---

### W4.1 — Tighten Content-Security-Policy

- **status**: pending
- **tier**: 🟢ish — small change but verify nothing breaks at runtime
- **estimate**: 1 h
- **files**: `v2/data-viz-platform/public/index.html`
- **patch sketch**:
  ```html
  <meta http-equiv="Content-Security-Policy"
    content="
      default-src 'self';
      script-src 'self';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data:;
      connect-src 'self';
      frame-ancestors 'none';
    ">
  ```
- **test plan**: open every view, check the browser console for CSP violations.
  Likely needs `style-src 'unsafe-inline'` for MUI's emotion runtime — keep that.
- **exit criteria**: no `'unsafe-eval'`; no wildcard `connect-src`/`img-src`; app works

---

### W4.2 — Sanitise CSV / Excel cells against formula injection

- **status**: pending
- **tier**: 🟢
- **estimate**: 1 h
- **files**: `src/utils/fileHandlers.js`,
  new `src/utils/__tests__/fileHandlers.test.js`
- **patch sketch**:
  ```js
  const FORMULA_RE = /^[=+\-@\t\r]/;
  export const sanitizeCell = v =>
    (typeof v === 'string' && FORMULA_RE.test(v)) ? `'${v}` : v;
  // apply inside validateAndCleanData() per cell
  ```
- **test plan**: unit test feeds `[{a: '=cmd|...'}]`, asserts `a` becomes `"'=cmd|..."`
- **exit criteria**: every cell starting with the dangerous chars is prefixed before
  it enters the analysis pipeline

---

### W4.3 — Magic-byte file-type validation

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **files**: `src/utils/fileHandlers.js`
- **patch sketch**: add `detectFileTypeFromBytes(arrayBuffer)` that reads first 8
  bytes; XLSX → `50 4B 03 04`; XLS → `D0 CF 11 E0 A1 B1 1A E1`; JSON → leading `{`
  or `[`; otherwise CSV best-effort sniff. Compare to claimed extension; reject
  mismatches.
- **test plan**: unit test with fake `ArrayBuffer`s for each file type and a renamed
  binary
- **exit criteria**: can't slip an executable in by renaming it `.csv`

---

### W4.4 — Validate API responses with Zod

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **files**: add `zod` dependency; `src/components/upload/datasource/ApiConnection.jsx`,
  `src/utils/apiSchema.js` (new)
- **patch sketch**:
  ```js
  import { z } from 'zod';
  const RowSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));
  const PayloadSchema = z.array(RowSchema).max(1_000_000);
  ```
  Strip prototype-pollution keys (`__proto__`, `prototype`, `constructor`) from each row.
- **test plan**: unit test rejects non-array payloads, oversized payloads, and
  prototype-poisoned rows
- **exit criteria**: malformed API responses are rejected with a clear error to the user

---

### W4.5 — Mobile-aware file size cap

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/utils/fileHandlers.js`
- **patch sketch**:
  ```js
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const MAX_FILE_SIZE = isMobile ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
  ```
- **test plan**: unit test with mocked user-agent
- **exit criteria**: mobile rejects >10 MB with a friendly error

---

### W4.6 — Streaming PapaParse instead of mobile chunk-and-concat

- **status**: pending
- **tier**: 🟡
- **estimate**: 3 h
- **files**: `src/utils/fileHandlers.js` (replace `processMobileFile` /
  `processFileChunk` for CSV)
- **patch sketch**:
  ```js
  Papa.parse(file, {
    header: true, dynamicTyping: true, skipEmptyLines: 'greedy',
    chunk: ({ data }) => rows.push(...data),
    complete: () => resolve(rows),
    error: reject,
  });
  ```
  PapaParse handles the chunking; the header is read once.
- **test plan**: parse a 50 MB synthetic CSV on mobile-emulated viewport; row count
  matches `wc -l - 1`
- **exit criteria**: no missing-row bug on mobile uploads

---

### W5.1 — Migrate from CRA to Vite

- **status**: pending
- **tier**: 🔴 (full session, multi-file moves)
- **estimate**: 1 day
- **files**:
  - move `public/index.html` → root `index.html` (replace `%PUBLIC_URL%` with `/`)
  - new `vite.config.js`, `vite.config.test.js` (vitest)
  - rename `process.env.REACT_APP_*` → `import.meta.env.VITE_*` everywhere
  - replace `react-scripts` with `vite`, `@vitejs/plugin-react`, `vitest`
  - update `package.json` scripts (`dev`/`build`/`test`)
  - fix any `require()` in source (Vite is ESM-first)
- **test plan**: `npm run dev` (HMR working), `npm run build` (output bytes <
  current), `npm test` (existing test still runs in vitest)
- **exit criteria**: dev server starts in <1 s; production build size shrinks

---

### W5.2 — Route-level code splitting

- **status**: pending
- **tier**: 🟡
- **estimate**: 2 h
- **prerequisites**: W5.1
- **files**: `src/App.js`
- **patch sketch**: `const ThreeDView = lazy(() => import('./components/views/ThreeDView'))`
  for each top-level view; wrap with `<Suspense fallback={<LoadingOverlay />}>`
- **test plan**: build, inspect output — separate chunk for each view; main bundle
  shrinks by ≥40 %
- **exit criteria**: 3D bundle is not loaded until the user opens the 3D view

---

### W5.3 — Disable production source maps

- **status**: pending
- **tier**: 🟢
- **estimate**: 15 min
- **files**: `package.json` (CRA) or `vite.config.js` (post-W5.1)
- **patch sketch**: `"build": "GENERATE_SOURCEMAP=false react-scripts build"` (CRA)
  or `build: { sourcemap: false }` (Vite)
- **test plan**: build, confirm no `.map` files in `build/`/`dist/`
- **exit criteria**: production assets ship without source maps

---

### W5.4 — ESLint with `jsx-a11y` and stricter hooks rules

- **status**: pending
- **tier**: 🟡
- **estimate**: 3 h (will surface real issues to fix)
- **files**: `package.json`, `eslint.config.js`
- **patch sketch**: extend `'plugin:jsx-a11y/recommended'` and
  `'plugin:react-hooks/recommended'` (error-level for `exhaustive-deps`)
- **test plan**: `npm run lint` returns 0 errors after fixes
- **exit criteria**: a11y plugin runs in CI

---

### W6.1 — Bootstrap a real test harness

- **status**: pending
- **tier**: 🟡 (foundational)
- **estimate**: 1 day
- **files**: `vitest.config.js` (or `jest.config.js`); `src/__tests__/setup.js`;
  delete the bogus `App.test.js`; add tests for `statisticalUtils`, `DataProcessor`,
  `columnAnalyzer`, `fileHandlers`
- **patch sketch**: install `vitest`, `@testing-library/react@latest`,
  `@testing-library/user-event@latest`, `jsdom`; configure `vitest.config.js` with
  `environment: 'jsdom'` and a setup file that wires `@testing-library/jest-dom`
- **test plan**: `npm test` runs ≥30 unit tests, all green; coverage ≥40 % on
  `services/brain/`
- **exit criteria**: tests run locally and are wired into CI

---

### W7.1 — ARIA-accessible 2D charts

- **status**: pending
- **tier**: 🟡
- **estimate**: 4 h
- **files**: `src/components/charts/*.jsx`
- **patch sketch**: wrap each chart in `<figure role="figure" aria-labelledby aria-describedby>`;
  add a hidden `<figcaption>` summarising the chart; on Recharts 2.12+ enable
  `accessibilityLayer`
- **test plan**: VoiceOver / NVDA reads the chart's purpose
- **exit criteria**: WAVE / axe DevTools report 0 errors on the charts page

---

### W7.2 — Accessible alternative for the 3D canvas

- **status**: pending
- **tier**: 🟡
- **estimate**: 4 h
- **files**: `src/components/views/ThreeDView/index.jsx`
- **patch sketch**: add a "View as table" toggle that renders the same data as a
  scrollable `<table>`; add `aria-label` to the canvas
- **test plan**: keyboard navigation hits the table; screen reader announces it
- **exit criteria**: 3D view is usable via the alternative table

---

### W7.3 — Label every slider, select, and icon button

- **status**: pending
- **tier**: 🟢
- **estimate**: 2 h
- **files**: `src/components/views/ThreeDView/ControlPanel.jsx`,
  `src/components/controls/ChartControls.jsx`, header / sidebar icon buttons
- **patch sketch**: `aria-label="Point size"` etc on every interactive element
- **test plan**: `eslint-plugin-jsx-a11y/no-noninteractive-element-interactions` clean
- **exit criteria**: no a11y warnings in the panel

---

### W8.1 — Responsive 3D canvas height

- **status**: pending
- **tier**: 🟢
- **estimate**: 30 min
- **files**: `src/components/views/ThreeDView/index.jsx`
- **patch sketch**: `sx={{ height: { xs: '50vh', md: '70vh' } }}`; collapse the
  ControlPanel to a bottom sheet on `xs`
- **test plan**: open in DevTools mobile emulator — controls don't push the canvas
  off screen
- **exit criteria**: mobile experience usable without horizontal scrolling

---

### W8.2 — `touch-action` on the canvas; PWA polish

- **status**: pending
- **tier**: 🟢
- **estimate**: 1 h
- **files**: 3D canvas wrapper; `vite.config.js` (workbox plugin)
- **patch sketch**: `style={{ touchAction: 'none' }}`; add Workbox/`vite-plugin-pwa`
  with offline runtime caching
- **test plan**: install the app on a phone; confirm gesture isolation
- **exit criteria**: pinch/orbit doesn't fight page scroll; PWA installable

---

### W9 — Observability

- **status**: pending
- **tier**: 🔴
- **estimate**: 1 day
- **files**: `src/index.js`, `package.json`
- **patch sketch**: add `@sentry/react` for errors; wire `web-vitals` to a tiny
  serverless endpoint or to PostHog/Plausible
- **test plan**: throw a test error in dev — see it in Sentry
- **exit criteria**: errors and core web vitals reach a dashboard

---

### W10.1 — DuckDB-Wasm + Apache Arrow for analytics core

- **status**: pending
- **tier**: 🔴
- **estimate**: 2 weeks
- **prerequisites**: W1.2 (Worker), W6.1 (tests)
- **files**: large change; new `src/services/duck/` module; rewrite of
  `PatternDetector` aggregations to SQL
- **patch sketch**: see doc 02 §10.1 and doc 03 B1
- **test plan**: snapshot tests against the existing implementation on Iris and cars
- **exit criteria**: 10× perf on correlation matrix; same numerical results

---

### W10.2 — Replace Recharts with ECharts for >5k-point views

- **status**: pending
- **tier**: 🔴
- **estimate**: 1 week
- **files**: `src/components/charts/*`
- **patch sketch**: introduce `<EChart>` component as a Recharts drop-in alternative
  selected based on data size
- **test plan**: visual regressions for each chart type
- **exit criteria**: 50k-point line chart renders smoothly

---

## Notes for autonomous runs

- **One commit per issue.** Branch per wave (e.g. `claude/wave-1`).
- **Push only at end of wave.** This gives you one PR per wave to review.
- **If a 🟢 issue's test plan fails twice**, downgrade to 🟡 (pause for review).
- **Never escalate a 🔴 issue to autorun.** If `/fix-issue` is called on a 🔴, it
  must stop and produce the diff for review.
- **Time budget per issue.** The estimates above are for an experienced engineer; an
  autonomous run should give itself 2× and stop if exceeded — that's a signal the
  issue is harder than expected.
- **Update this file's `status` line** as you go. The `/fix-issue` command does this
  automatically.
