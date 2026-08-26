# CARTO "API KEY REQUIRED" watermark on the Play release — diagnosis

## What I compared

- `.github/workflows/build-android-debug.yml` vs `.github/workflows/build-android-release.yml`: the web-asset half is byte-identical — same `bun install`, same `bun run build:mobile`, same standalone assertion, same `cap add/sync android`, same icons and permissions, same committed `capacitor.config.ts`. The only differences are Android-side: release sets `compileSdk`/`targetSdk` to 36, restores the keystore, and runs `bundleRelease` instead of `assembleDebug`.
- Build mode: both run the exact same `build:mobile` script (`vite build --config vite.mobile.config.ts`). There is no `--mode` difference, no `NODE_ENV`-dependent branch, and `vite.mobile.config.ts` contains no `define`/env injection at all.
- Env injection: `src/` uses no `import.meta.env`/`process.env` anywhere; nothing about tiles is configurable per build.
- Tile provider: hardcoded in `src/lib/map/provider.ts` — `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, no API key, `detectRetina` so `{r}` becomes `@2x`. Identical in both bundles.

So the two artifacts request the **same tile URLs from the same code**. The watermark is not a build/config regression.

## Root cause

`basemaps.cartocdn.com` without an API key is CARTO's unauthenticated/dev tier. CARTO serves those tiles freely up to a limit and then, instead of returning an error, returns the same tiles **with an "API KEY REQUIRED" watermark burned in**. The switch is server-side and keyed to the calling traffic (volume/origin over time), not to anything in the APK. A Play-distributed release simply generates far more unkeyed tile traffic (many devices, `https://localhost` origin, no Referer allowlist) than the single debug install did, so it crossed into watermarked responses. Spot-checking a tile now returns a clean 512×512 PNG regardless of `Referer` — consistent with a usage-based, not origin-based, gate; cached edge tiles can still come back clean while live app traffic is watermarked.

Conclusion: no code difference between debug and release explains it; the debug APK was simply below the unkeyed threshold.

## Identical commits/configs?

I can confirm both workflows would produce identical web bundles from the same commit, and that the tile config is not build-mode dependent. I **cannot** confirm from here which commits the two artifacts were actually built from — both workflows are `workflow_dispatch` and the run metadata lives on GitHub. If it matters, compare the two runs' checkout SHAs in the Actions log; the map difference does not depend on it either way.

## Minimal safe fix

Because only `src/lib/map/provider.ts` knows the vendor, the fix is a one-file change. Two viable directions:

1. **Keyless provider swap (recommended, no account, no key, no billing).** Point `tileUrl` at a raster basemap that permits app usage without a key and keep the same pale/minimal look, e.g. Esri "World Light Gray Canvas" raster tiles (`https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, no `{s}`/`{r}`, `maxZoom` 16) with the required Esri attribution. Plain OpenStreetMap tiles (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) also work keyless but OSM's tile usage policy discourages distributed mobile apps, so it is a stopgap rather than a durable answer.
2. **Keep CARTO and add an API key.** Requires a CARTO account and a usage-billed key; the key would ship inside the APK (client-side, restricted by CARTO-side domain/usage rules only). Bigger operational cost and does not fit the "no secrets, no accounts" shape of this app.

Whichever is chosen: no API key is *required* to fix this — switching provider removes the watermark outright. `maxZoom`, `subdomains`, `detectRetina` (`{r}`) and the attribution string must be adjusted to match the new provider, and both the web app and mobile bundle pick the change up automatically since they share `provider.ts`.

## Test criteria for the eventual fix

1. Preview at mobile viewport: Türkiye basemap renders with no watermark, city chips and labels still legible on the pale style.
2. Zoom to a district (e.g. Kadıköy) and confirm tiles exist up to the provider's real `maxZoom` — no grey voids past the limit.
3. Network panel shows tile requests only to the new provider host; no `basemaps.cartocdn.com`.
4. `bun run build:mobile` succeeds and `grep -ri lovable.app dist/mobile` stays empty.
5. Attribution control shows the new provider's required credit.
6. Rebuild the release AAB and confirm a clean map on a real device.

No changes made yet — awaiting your call on option 1 vs 2.
