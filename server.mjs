import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'www');
const api = 'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/stations') {
      const upstream = await fetch(api, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (!upstream.ok) throw new Error(`官方資料服務回應 ${upstream.status}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(await upstream.text());
      return;
    }
    const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const file = normalize(join(root, pathname));
    if (!file.startsWith(root)) throw new Error('Not found');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (error) {
    const status = error.code === 'ENOENT' ? 404 : 502;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(Number(process.env.PORT || 4173), '0.0.0.0', () => {
  console.log(`YouBike 預覽服務已啟動：http://localhost:${process.env.PORT || 4173}`);
});
