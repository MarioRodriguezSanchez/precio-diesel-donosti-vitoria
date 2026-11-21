# AGENTS.md

## Architecture
- `netlify/server/index.mjs` — the whole app. A handler-style Netlify Server (default export `(request) => Response`) that serves `/` as server-rendered HTML. Other paths return 404.
- `public/` — publish directory, static assets only (favicon). Do NOT add `index.html` here; it would shadow the server's `/` route.
- `netlify.toml` — sets `publish = "public"`.

## Data
- Source: MITECO REST API `EstacionesTerrestres/FiltroMunicipio/{IDMunicipio}`. Municipality IDs: Vitoria-Gasteiz `46` (province 01), Donostia-San Sebastián `3157` (province 20).
- Diesel = field `Precio Gasoleo A`. Numbers use comma decimals (`"1,875"`); empty string means not sold.
- `Fecha` is the ministry's snapshot timestamp (Spain local time), displayed as-is.

## Performance decisions
- No client JS, inline CSS, system fonts — keep it that way.
- Freshness over caching (user requirement): every page load fetches live prices from MITECO. Responses are `no-store` for both the browser and the CDN; do not reintroduce caching. The last good result is kept in memory only as a fallback when upstream fails, and is shown with a visible warning; with no fallback, a 503 is returned.
- Upstream fetch has a 14s timeout (server must send headers within 20s).

## Conventions
- To add a city, append `{ id, slug, name }` to `CITIES`.
