// Weekly data refresh (run by .github/workflows/data-refresh.yml):
// 1) updates the offline exchange-rate snapshot from the ECB feed,
// 2) checks that every offer and ticket link still opens, and writes data-report.md.
import { readFileSync, writeFileSync } from 'node:fs';

const RATES_FILE = 'packages/shared/src/data/rates.ts';
const KEEP = ['PLN', 'USD', 'GBP', 'JPY', 'HUF', 'CHF', 'CAD', 'CZK', 'AUD', 'BRL', 'MXN', 'SGD', 'TRY', 'CNY'];
const report = [];

const res = await fetch('https://api.frankfurter.app/latest?from=EUR');
if (res.ok) {
  const { date, rates } = await res.json();
  const [y, m, d] = date.split('-');
  const lines = ['    EUR: 1,', ...KEEP.filter((c) => rates[c]).map((c) => `    ${c}: ${rates[c]},`)].join('\n');
  const block = `export const RATES_SNAPSHOT: Rates = {\n  base: 'EUR',\n  date: '${date}',\n  source: 'ECB euro reference rates, ${d}.${m}.${y}',\n  rates: {\n${lines}\n  },\n};`;
  const src = readFileSync(RATES_FILE, 'utf8');
  writeFileSync(RATES_FILE, src.replace(/export const RATES_SNAPSHOT: Rates = \{[\s\S]*?\n\};/, block));
  report.push(`Rates snapshot: ECB ${date} (1 EUR = ${rates.PLN} PLN).`);
} else {
  report.push(`Rates: feed unavailable (HTTP ${res.status}); snapshot unchanged.`);
}

const urls = new Set();
for (const f of ['packages/shared/src/data/offers.ts', 'packages/shared/src/data/races.ts']) {
  for (const m of readFileSync(f, 'utf8').matchAll(/https:\/\/[^'"\s)]+/g)) urls.add(m[0]);
}
const broken = [];
for (const url of urls) {
  try {
    const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 Driftora link check' } });
    // 401/403/429: the site blocks bots – not proof the page is gone.
    if (r.status >= 400 && ![401, 403, 429].includes(r.status)) broken.push(`${r.status} ${url}`);
  } catch (e) {
    broken.push(`ERR ${url} (${e.name})`);
  }
}
report.push(`Links checked: ${urls.size}. Not opening: ${broken.length}.`);
if (broken.length) report.push('', 'Check these offers – the price or the page may have changed:', ...broken.map((b) => `- ${b}`));
writeFileSync('data-report.md', `# Driftora data check ${new Date().toISOString().slice(0, 10)}\n\n${report.join('\n')}\n`);
console.log(report.join('\n'));
if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `broken=${broken.length}\n`, { flag: 'a' });
