# Standalone Android build (no Lovable hosting at runtime)

## Findings from the audit

The app is already 100% client-side. Verified:

- No `createServerFn`, no `src/routes/api/*`, no `process.env` / `import.meta.env` usage anywhere in `src/`.
- Weather (`src/lib/weather/open-meteo.ts`), geocoding + reverse geocoding (`src/lib/map/geocode.ts`), and tiles (`src/lib/map/provider.ts`) are all direct browser `fetch`/tile requests to keyless public APIs.
- Only one route (`/`), rendered fully in the browser; the map is already behind `ClientOnly` + `React.lazy`.
- `src/server.ts` / `src/start.ts` exist only as the SSR error wrapper — nothing the mobile app needs.

So SSR is not a blocker. The blocker is only that `vite build` with the TanStack Start plugin emits a Nitro server bundle, not a static `index.html` SPA. The fix is a second, mobile-only Vite config + entry that builds the same `src/` components as a pure SPA into `dist/mobile` — exactly the Toplan `dist/mobile` approach. The existing web build, `vite.config.ts`, and the published site stay untouched.

The current GitHub workflow points Capacitor's `server.url` at `turkey-map-weather.lovable.app`; that gets replaced with the bundled `webDir: dist/mobile` and no `server.url`.

## File-by-file plan

New files:

1. `vite.mobile.config.ts` — plain Vite (no `@lovable.dev/vite-tanstack-config`, no `tanstackStart`, no nitro):
   - plugins: `@vitejs/plugin-react`, `@tailwindcss/vite`, `vite-tsconfig-paths`, and `@tanstack/router-plugin/vite` in **code-based/generator mode only** (`target: 'react'`, `autoCodeSplitting: false`) so `routeTree.gen.ts` stays valid.
   - `root: 'mobile'`, `base: './'` (critical: Capacitor loads from `file:`-like origin, absolute `/assets/...` paths 404), `build.outDir: '../dist/mobile'`, `build.emptyOutDir: true`.
   - `define`/`resolve.dedupe` for react as in the web config.
2. `mobile/index.html` — static shell with `<meta charset>`, viewport (`viewport-fit=cover, maximum-scale=1`), theme-color, `<title>Hava Haritası</title>`, and `<script type="module" src="/main.tsx">`. Includes the Leaflet + Manrope stylesheet links (see CSP note) — or omit and import locally per step 4.
3. `mobile/main.tsx` — SPA bootstrap:
   - `import "../src/styles.css"`, `import "leaflet/dist/leaflet.css"`.
   - build a `QueryClient`, `createRouter({ routeTree, context: { queryClient }, history: createMemoryHistory({ initialEntries: ['/'] }) })` — memory history avoids WebView URL/deep-link weirdness.
   - `createRoot(...).render(<RouterProvider router={router} />)`.
4. `mobile/MobileRoot.tsx` (or reuse) — the mobile build must not use `__root.tsx`'s `shellComponent`/`HeadContent`/`Scripts` (SSR-only document rendering). Cleanest: add a small root route for mobile that renders only `<QueryClientProvider><Outlet/></QueryClientProvider>` plus the existing `NotFoundComponent`/`ErrorComponent`, and generate the mobile route tree from a `mobile/routes/` folder whose `index.tsx` re-exports the page component from `src/routes/index.tsx`.
   - To keep this trivial, refactor-free option: extract the page body of `src/routes/index.tsx` into `src/components/weather/WeatherHome.tsx` and have both the web route and the mobile route render it. This is the one edit to existing app code, and it is behaviour-neutral for the web build.
5. `capacitor.config.ts` (repo root, committed) — `appId: com.kawiq.weathermap`, `appName: 'Weather Map - Hava Haritası'`, `webDir: 'dist/mobile'`, **no `server.url`**, `android: { androidScheme: 'https' }` (gives origin `https://localhost` → secure context, required for geolocation and clean CORS), `server: { cleartext: false }`.

Edited files:

6. `package.json` — add `"build:mobile": "vite build --config vite.mobile.config.ts"`. No dependency changes required beyond `@capacitor/*`, which the workflow already installs (better: move them to real devDependencies so the build is reproducible).
7. `.github/workflows/build-android-debug.yml` — replace the "placeholder web directory" + heredoc `capacitor.config.ts` (with `server.url`) steps with: `bun install`, `bun run build:mobile`, then `bunx cap add android` / `cap sync android` using the committed config. Keep the Java/Bun setup, icon generation, permission injection, `assembleDebug`, and artifact upload steps as-is. Optionally add an `assembleRelease`/`bundleRelease` job for AAB later.
8. `src/routes/index.tsx` — only if step 4's extraction is taken: import and render `WeatherHome` instead of holding the body inline. No logic changes.
9. Leaflet marker-icon note: if any Leaflet default icon is used, its images resolve relative to the CSS; with `base: './'` and local `leaflet/dist/leaflet.css` Vite copies them. `MapCanvas.tsx` uses `divIcon`/HTML chips, so this is likely a no-op — verify during build.

Nothing in `src/server.ts`, `src/start.ts`, `vite.config.ts`, or the published deployment changes.

## Android WebView / CORS / network notes

- With `androidScheme: 'https'` the page origin is `https://localhost`. All three upstreams send permissive CORS (`access-control-allow-origin: *`): `api.open-meteo.com`, `geocoding-api.open-meteo.com`, `api.bigdatacloud.net`. CARTO tiles are `<img>` loads, not subject to CORS at all. So no proxy and no server component is needed.
- Requests are cross-origin plain GETs with no custom headers → no preflight, so no OPTIONS handling is required.
- All endpoints are HTTPS, so Android 9+ cleartext blocking is a non-issue; keep `cleartext: false` and do not add a network-security-config exception.
- Geolocation needs both the manifest permissions (already injected by the workflow) **and** a runtime prompt. In a plain WebView, `navigator.geolocation` silently fails unless the app grants `onGeolocationPermissionsShowPrompt`; Capacitor's bridge handles this only when the runtime permission has been granted. Recommended: add `@capacitor/geolocation` and request permission on first tap of the location button, keeping the existing browser-geolocation code as the fallback. The current "izin verilmedi" Turkish message already covers the denied path.
- Remote CSS from unpkg/Google Fonts would leave the app dependent on the network for its fonts/map CSS. Bundle Leaflet CSS locally (step 3) and either self-host Manrope in `mobile/` or accept a system-font fallback offline.
- Offline behaviour: shell loads from the APK; weather/tiles fail with the existing Turkish error states. No extra work planned.

## Test criteria

1. `bun run build:mobile` produces `dist/mobile/index.html` plus `dist/mobile/assets/*`, with **only relative** asset URLs in the HTML, and no `.output`/nitro directory.
2. Serving `dist/mobile` from a static file server renders the Turkey map, city chips with live temperatures, tap → bottom sheet with real Open-Meteo data, hourly/daily wind, and district search (Kadıköy / İncekum) — i.e. no functional regression versus preview.
3. `grep -ri "lovable.app" dist/mobile` returns nothing, and DevTools network shows requests only to open-meteo, bigdatacloud, and cartocdn.
4. Debug APK installs; with Wi-Fi on, the map and weather work; the app never requests `turkey-map-weather.lovable.app`.
5. Airplane mode: app still opens to the shell and shows Turkish error/empty states instead of a white screen.
6. Location button: prompts for permission, centers and loads weather on grant; shows the Turkish denial message on refusal, map stays usable.
7. The existing web app at `turkey-map-weather.lovable.app` still builds and behaves identically after the refactor in step 8.
