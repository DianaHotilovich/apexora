// End-to-end smoke test of the main user flow. Usage: npm run build && npm run test:e2e -w @gridtrip/web
// Serves ./out on a free port, walks race -> level -> package -> pay -> checklist -> SOS, fails on any page error.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const root = new URL('../out/', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.pdf': 'application/pdf' };
const server = createServer(async (req, res) => {
  let p = join(root, decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'Content-Type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ locale: 'pl-PL', viewport: { width: 400, height: 860 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const step = async (name, fn) => { await fn(); console.log('ok', name); };
try {
  await step('home', () => page.goto(base + '/'));
  await step('races', async () => { await page.click('text=Wybierz wyścig'); await page.fill('input', 'Węg'); });
  await step('level', async () => { await page.click('text=GP Węgier'); await page.waitForURL(/hungary-2027\/?$/); });
  await step('package', async () => { await page.click('text=Średni'); await page.waitForSelector('text=Trybuna FAN Weekend'); });
  await step('pay', async () => { await page.click('text=Przejdź do płatności'); await page.click('button.btn'); await page.waitForURL(/trip/); });
  await step('checklist', async () => { await page.click('.check >> nth=0'); await page.waitForSelector('text=1/11'); });
  await step('sos', async () => { await page.click('text=SOS'); await page.waitForSelector('text=112'); });
  await step('pdf', async () => { const r = await page.request.get(base + '/pdf/pl/HU.pdf'); if (r.status() !== 200) throw new Error('pdf ' + r.status()); });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('E2E passed');
} finally {
  await browser.close(); server.close();
}
