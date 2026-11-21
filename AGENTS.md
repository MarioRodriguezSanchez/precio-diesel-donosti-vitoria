# AGENTS.md

## Architecture
- `src/index.mjs` — the whole app. Cloudflare Worker (`export default { fetch }`) that serves `/` as server-rendered HTML. Other paths return 404 (unless they match a static asset).
- `public/` — static assets only (favicon), served by Workers Static Assets. Do NOT add `index.html` here; it would shadow the Worker's `/` route.
- `wrangler.toml` — Worker config (`main`, `[assets]`). Deploy with `npm run deploy` after `npx wrangler login`.
- `local.mjs` — optional plain-Node local runner (port 8889); `npm run dev` (wrangler) is preferred.

## Data
- Source: MITECO REST API `EstacionesTerrestres/FiltroMunicipio/{IDMunicipio}`. Municipality IDs: Vitoria-Gasteiz `46` (province 01), Donostia-San Sebastián `3157` (province 20).
- Diesel = field `Precio Gasoleo A`. Numbers use comma decimals (`"1,875"`); empty string means not sold.
- `Fecha` is the ministry's snapshot timestamp (Spain local time), displayed as-is.

## Performance decisions
- No client JS, inline CSS, system fonts — keep it that way.
- Freshness over caching (user requirement): every page load fetches live prices from MITECO. Responses are `no-store`; do not reintroduce caching. The last good result is kept in memory only (per isolate) as a fallback when upstream fails, and is shown with a visible warning; with no fallback, a 503 is returned.
- Upstream fetch has a 14s timeout.

## Conventions
- To add a city, append `{ id, slug, name }` to `CITIES`.
