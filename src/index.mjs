// Server-rendered page listing the 10 cheapest diesel (Gasóleo A) stations
// in Vitoria and San Sebastian.
// Data: Spanish Ministry for Ecological Transition (MITECO) open REST API,
// refreshed by the ministry every 30 minutes.
// Freshness: every page load fetches live prices from the ministry. Nothing is
// cached at the CDN or in the browser. The last good result is kept in memory
// only as a fallback for when the ministry API fails, and is clearly labelled.

const API =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipio/'

const CITIES = [
  { id: '46', slug: 'vitoria', name: 'Vitoria' },
  { id: '3157', slug: 'donostia', name: 'San Sebastián' },
]

const TOP_N = 10
let lastGood = null // fallback only, used when the live fetch fails

const num = (s) => {
  const n = parseFloat(String(s ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

const coord = (s) => parseFloat(String(s ?? '').replace(',', '.'))

async function fetchCity(city) {
  const res = await fetch(API + city.id, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(14000),
  })
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${city.name}`)
  const json = await res.json()
  const stations = (json.ListaEESSPrecio ?? [])
    .map((s) => ({
      price: num(s['Precio Gasoleo A']),
      brand: (s['Rótulo'] || 'Gasolinera').trim(),
      address: (s['Dirección'] || '').trim(),
      cp: s['C.P.'] || '',
      hours: s['Horario'] || '',
      lat: coord(s['Latitud']),
      lon: coord(s['Longitud (WGS84)']),
    }))
    .filter((s) => s.price !== null)
    .sort((a, b) => a.price - b.price)
  return {
    ...city,
    updated: json.Fecha || '',
    total: stations.length,
    top: stations.slice(0, TOP_N),
  }
}

async function getData() {
  try {
    const data = await Promise.all(CITIES.map(fetchCity))
    lastGood = data
    return { data, stale: false }
  } catch (err) {
    if (lastGood) {
      console.error(err)
      return { data: lastGood, stale: true }
    }
    throw err
  }
}

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const title = (s) => s.toLowerCase().replace(/(^|[\s\-/(])(\p{L})/gu, (m, p, l) => p + l.toUpperCase())

const fmt = (n) => n.toFixed(3).replace('.', ',')

function cityCard(c, winner) {
  const cheapest = c.top[0]?.price
  const rows = c.top
    .map((s, i) => {
      const diff = i === 0 ? '' : `<span class="diff">+${((s.price - cheapest) * 100).toFixed(1).replace('.', ',')}¢</span>`
      const maps = Number.isFinite(s.lat) && Number.isFinite(s.lon)
        ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.address} ${s.cp} ${c.name}`)}`
      const cls = i === 0 ? (winner ? 'best win' : 'best') : ''
      return `<li${cls ? ` class="${cls}"` : ''}>
  <span class="rank">${i + 1}</span>
  <a class="info" href="${esc(maps)}" target="_blank" rel="noopener">
    <strong>${esc(s.brand)}</strong>
    <span class="addr">${esc(title(s.address))}</span>
    <span class="hours">${esc(s.hours)}</span>
  </a>
  <span class="price"><b>${fmt(s.price)}</b><small>€/L</small>${diff}</span>
</li>`
    })
    .join('')
  return `<section class="city" id="${c.slug}">
  <header><h2>${esc(c.name)}</h2><p>${c.total} gasolineras · más barata ${cheapest ? fmt(cheapest) + ' €/L' : '—'}</p></header>
  <ol>${rows || '<li class="empty">No hay precios de diésel disponibles ahora mismo.</li>'}</ol>
</section>`
}

function page(data, error, stale) {
  const updated = data?.[0]?.updated
  // Cheapest first-place price across all cities: that city's top station is shown in green.
  const minPrice = data ? Math.min(...data.map((c) => c.top[0]?.price ?? Infinity)) : Infinity
  const body = error
    ? `<p class="error">No se ha podido conectar con el servicio oficial de precios. Vuelve a cargar la página en unos instantes.</p>`
    : data.map((c) => cityCard(c, c.top[0]?.price === minPrice)).join('')
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Diésel más barato · Vitoria y San Sebastián</title>
<meta name="description" content="Los 10 precios más baratos de diésel (Gasóleo A) ahora mismo en Vitoria y San Sebastián, con datos oficiales del Ministerio.">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#111111">
<style>
:root{--bg:#111;--ink:#f3f1ea;--mut:#9a978e;--line:#2a2926;--card:#1a1917;--y:#f5c518;--g:#5fd38d}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font:15px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.wrap{max-width:1080px;margin:0 auto;padding:28px 16px 48px}
.top{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;border-bottom:2px solid var(--y);padding-bottom:16px;margin-bottom:20px}
.meta{color:var(--mut);font-size:13px}
.meta b{color:var(--ink);font-weight:600}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.city{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.city header{padding:14px 16px;border-bottom:1px solid var(--line)}
h2{font-size:19px;font-weight:700}
.city header p{color:var(--mut);font-size:13px}
ol{list-style:none}
li{display:grid;grid-template-columns:28px 1fr auto;gap:10px;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line)}
li:last-child{border-bottom:0}
li.best{background:linear-gradient(90deg,rgba(245,197,24,.12),transparent)}
li.win{background:linear-gradient(90deg,rgba(95,211,141,.14),transparent)}
.rank{font-weight:800;color:var(--mut);font-variant-numeric:tabular-nums;text-align:center}
.best .rank{color:var(--y)}
.win .rank{color:var(--g)}
.info{display:flex;flex-direction:column;min-width:0;color:inherit;text-decoration:none}
.info:hover strong{text-decoration:underline}
.info strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.addr,.hours{color:var(--mut);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.price{display:flex;flex-direction:column;align-items:flex-end;font-variant-numeric:tabular-nums}
.price b{font-size:20px;font-weight:800;letter-spacing:-.01em}
.best .price b{color:var(--y)}
.win .price b{color:var(--g)}
.price small{color:var(--mut);font-size:11px}
.diff{color:var(--mut);font-size:11px}
.warn{border:1px solid var(--y);color:var(--ink);border-radius:10px;padding:10px 12px;margin-bottom:14px;font-size:13px}
.empty,.error{padding:20px 16px;color:var(--mut)}
.error{border:1px solid var(--line);border-radius:12px;grid-column:1/-1}
@media (max-width:640px){
.wrap{padding:18px 8px 32px}
.top{margin-bottom:14px;padding-bottom:12px}
.meta{text-align:left;font-size:12px}
.grid{gap:8px}
.city{border-radius:10px}
.city header{padding:10px}
h2{font-size:15px}
.city header p{font-size:11px}
li{grid-template-columns:16px minmax(0,1fr);gap:2px 6px;align-items:start;padding:8px 8px 8px 6px}
.rank{font-size:12px;line-height:18px}
.info strong{font-size:12.5px}
.addr,.hours{font-size:10.5px}
.price{grid-column:2;flex-direction:row;align-items:baseline;gap:3px;margin-top:2px}
.price b{font-size:16px}
.price small,.diff{font-size:10px}
.diff{margin-left:auto}
}
footer{margin-top:24px;color:var(--mut);font-size:12px}
footer a{color:var(--mut)}
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <p class="meta">Gasóleo A · las ${TOP_N} más baratas por ciudad<br>${updated ? `Precios oficiales a <b>${esc(updated)}</b>` : ''}</p>
  </div>
  ${stale ? `<p class="warn">No se han podido obtener los precios en directo del Ministerio. Estos son los más recientes que tenemos (a ${esc(updated)}). Recarga la página para volver a intentarlo.</p>` : ''}
  <main class="grid">${body}</main>
  <footer>Fuente: <a href="https://geoportalgasolineras.es/" rel="noopener">Ministerio para la Transición Ecológica</a> — los precios se actualizan cada 30 minutos. Pulsa sobre una gasolinera para abrirla en Maps.</footer>
</div>
</body>
</html>`
}

async function handler(request) {
  const url = new URL(request.url)
  if (url.pathname !== '/') {
    return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
  try {
    const { data, stale } = await getData()
    return new Response(page(data, false, stale), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Live prices on every load: never cache at the CDN or in the browser.
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error(err)
    return new Response(page(null, true), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    })
  }
}

export default { fetch: (request) => handler(request) }
