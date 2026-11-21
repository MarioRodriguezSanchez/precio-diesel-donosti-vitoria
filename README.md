# Cheapest Diesel · Vitoria-Gasteiz & Donostia

A single, lightweight web page that shows the 10 cheapest diesel (Gasóleo A) prices right now in Vitoria-Gasteiz and Donostia-San Sebastián, using the official open data published by Spain's Ministry for Ecological Transition (refreshed every 30 minutes).

## Why it's fast
- The page is rendered on the server as plain HTML with inline CSS: no JavaScript, no web fonts, no images (~12 KB).
- Netlify's CDN caches the page for 5 minutes and keeps serving it while refreshing in the background (stale-while-revalidate), so visitors almost never wait for the Ministry API.

## Tech
- Netlify Server (`netlify/server/index.mjs`) — plain Node.js 24, zero dependencies.
- Data: `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipio/{id}` (Vitoria-Gasteiz = 46, Donostia = 3157).

## Run locally
```bash
netlify dev --port 8889
```
Then open http://localhost:8889.
