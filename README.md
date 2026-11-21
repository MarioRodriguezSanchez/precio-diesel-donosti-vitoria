# Diésel más barato · Vitoria-Gasteiz y Donostia

Página única que muestra los 10 precios más baratos de gasóleo A en Vitoria-Gasteiz y Donostia-San Sebastián con los datos abiertos del Ministerio para la Transición Ecológica (actualizados cada 30 min).

## Tecnología
- Cloudflare Worker (`src/index.mjs`), sin dependencias. HTML renderizado en servidor, CSS inline, sin JS de cliente.
- Estáticos (`public/favicon.svg`) servidos por Workers Static Assets (ver `wrangler.toml`).
- Sin caché: cada carga consulta el API en vivo (`Cache-Control: no-store`).

## Desarrollo local
```bash
npm install
npm run dev        # wrangler dev -> http://localhost:8787
```

## Despliegue en Cloudflare
```bash
npm install
npx wrangler login   # abre el navegador para autenticarte (una sola vez)
npm run deploy       # wrangler deploy
```
Quedará en `https://precio-diesel-donosti-vitoria.<tu-subdominio>.workers.dev`. Para dominio propio: Workers & Pages → el Worker → Settings → Domains & Routes.

Despliegue desde CI: define `CLOUDFLARE_API_TOKEN` (plantilla "Edit Cloudflare Workers") y `CLOUDFLARE_ACCOUNT_ID` como secretos y ejecuta `npx wrangler deploy`.
