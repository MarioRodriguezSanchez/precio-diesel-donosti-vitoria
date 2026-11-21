import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import worker from './src/index.mjs'

createServer(async (req, res) => {
  if (req.url === '/favicon.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' })
    return res.end(await readFile('./public/favicon.svg'))
  }
  const response = await worker.fetch(new Request(`http://${req.headers.host}${req.url}`))
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(await response.text())
}).listen(8889, () => console.log('Listo en http://localhost:8889'))