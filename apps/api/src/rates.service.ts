import { Injectable, Logger } from '@nestjs/common';
import { Rates, RATES_SNAPSHOT } from '@apexora/shared';

const SIX_HOURS = 6 * 60 * 60 * 1000;

/** ECB reference rates via the Frankfurter API, cached for 6 hours, with an offline snapshot as fallback. */
@Injectable()
export class RatesService {
  private readonly log = new Logger(RatesService.name);
  private cache: { at: number; rates: Rates } | null = null;

  async get(): Promise<Rates & { live: boolean }> {
    if (this.cache && Date.now() - this.cache.at < SIX_HOURS) return { ...this.cache.rates, live: true };
    if (process.env.RATES_OFFLINE === '1') return { ...RATES_SNAPSHOT, live: false };
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=EUR', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { date: string; rates: Record<string, number> };
      const rates: Rates = { base: 'EUR', date: body.date, source: 'ECB via frankfurter.app', rates: { EUR: 1, ...body.rates } };
      this.cache = { at: Date.now(), rates };
      return { ...rates, live: true };
    } catch (e) {
      this.log.warn(`Live rates unavailable (${(e as Error).message}); using snapshot ${RATES_SNAPSHOT.date}`);
      return { ...RATES_SNAPSHOT, live: false };
    }
  }
}
