import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { z, ZodSchema } from 'zod';
import {
  checklistFor, getGuide, getRace, GUIDES, Lang, Level, MissingRateError, OFFERS, offersForRace, RACES,
  suggestTrip, summarizeTrip,
} from '@gridtrip/shared';
import { Db, payments, trips, waitlist } from './db';
import { methodsFor, PaymentsService } from './payments.service';
import { RatesService } from './rates.service';

function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new BadRequestException(r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
  return r.data;
}
const lang = (v?: string): Lang => (v === 'en' ? 'en' : 'pl');
const currency = z.string().regex(/^[A-Z]{3}$/);
const level = z.enum(['budget', 'standard', 'premium']);
const items = z.array(z.object({ offerId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(10);

@Controller('health')
export class HealthController {
  @Get() health() { return { status: 'ok', time: new Date().toISOString() }; }
}

@Controller('races')
export class RacesController {
  @Get() list() { return RACES; }

  @Get(':id')
  one(@Param('id') id: string) {
    const race = getRace(id);
    if (!race) throw new NotFoundException('Race not found');
    return { ...race, offers: offersForRace(id), guide: getGuide(race.countryCode) };
  }

  @Get(':id/offers')
  offers(@Param('id') id: string, @Query('level') lvl?: string) {
    if (!getRace(id)) throw new NotFoundException('Race not found');
    const l = lvl ? parse(level, lvl) : undefined;
    return offersForRace(id, l as Level | undefined);
  }
}

@Controller('guides')
export class GuidesController {
  @Get() list() { return GUIDES.map((g) => ({ code: g.code, name: g.name, region: g.region })); }

  @Get(':code')
  one(@Param('code') code: string) {
    const g = getGuide(code);
    if (!g) throw new NotFoundException('Guide not found');
    return g;
  }

  @Get(':code/checklist')
  checklist(@Param('code') code: string, @Query('date') date?: string, @Query('lang') l?: string) {
    if (!getGuide(code)) throw new NotFoundException('Guide not found');
    const d = parse(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), date ?? '');
    return checklistFor(code.toUpperCase(), d, lang(l));
  }
}

@Controller('rates')
export class RatesController {
  constructor(private readonly rates: RatesService) {}
  @Get() get() { return this.rates.get(); }
}

@Controller('trips')
export class TripsController {
  constructor(private readonly db: Db, private readonly rates: RatesService) {}

  private async price(input: { items: { offerId: string; quantity: number }[]; currency: string }) {
    const r = await this.rates.get();
    try {
      return summarizeTrip(input.items, input.currency, r);
    } catch (e) {
      if (e instanceof MissingRateError) throw new BadRequestException(`Currency not supported offline: ${e.currency}`);
      throw new BadRequestException((e as Error).message);
    }
  }

  @Post('suggest') @HttpCode(200)
  async suggest(@Body() body: unknown) {
    const b = parse(z.object({ raceId: z.string(), level, currency }), body);
    if (!getRace(b.raceId)) throw new NotFoundException('Race not found');
    const r = await this.rates.get();
    const suggested = suggestTrip(b.raceId, b.level, r);
    if (!suggested.length) return { items: [], summary: null, officialTicketsUrl: getRace(b.raceId)!.officialTicketsUrl };
    return { items: suggested, summary: await this.price({ items: suggested, currency: b.currency }) };
  }

  @Post('quote') @HttpCode(200)
  async quote(@Body() body: unknown) {
    const b = parse(z.object({ items, currency }), body);
    return this.price(b);
  }

  @Post()
  async create(@Body() body: unknown) {
    const b = parse(z.object({ raceId: z.string(), level, currency, items }), body);
    if (!getRace(b.raceId)) throw new NotFoundException('Race not found');
    if (b.items.some((i) => OFFERS.find((o) => o.id === i.offerId)?.raceId !== b.raceId)) {
      throw new BadRequestException('All offers must belong to the selected race');
    }
    const s = await this.price(b);
    const [row] = await this.db.orm.insert(trips)
      .values({ raceId: b.raceId, level: b.level, currency: b.currency, items: b.items, total: Math.round(s.total * 100) })
      .returning();
    return { ...row, summary: s };
  }

  @Get(':id')
  async one(@Param('id') id: string) {
    parse(z.string().uuid(), id);
    const [row] = await this.db.orm.select().from(trips).where(eq(trips.id, id));
    if (!row) throw new NotFoundException('Trip not found');
    return row;
  }
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly db: Db, private readonly pay: PaymentsService) {}

  @Get('methods')
  methods(@Query('country') country?: string) {
    return methodsFor(parse(z.string().regex(/^[A-Za-z]{2}$/), country ?? ''));
  }

  @Post()
  async create(@Body() body: unknown) {
    const b = parse(z.object({ tripId: z.string().uuid(), method: z.enum(['pay_now', 'instalments', 'save_up', 'split']), country: z.string().length(2) }), body);
    const [trip] = await this.db.orm.select().from(trips).where(eq(trips.id, b.tripId));
    if (!trip) throw new NotFoundException('Trip not found');
    const allowed = methodsFor(b.country).find((m) => m.method === b.method);
    if (!allowed?.available) throw new BadRequestException('This payment method is not available in your country');
    const result = await this.pay.charge(b.method, trip.total, trip.currency, trip.id);
    const [row] = await this.db.orm.insert(payments).values({
      tripId: trip.id, method: b.method, amount: trip.total, currency: trip.currency,
      provider: result.provider, providerRef: result.providerRef, status: result.status,
    }).returning();
    await this.db.orm.update(trips).set({ status: result.status === 'authorised' ? 'paid' : 'payment_pending' }).where(eq(trips.id, trip.id));
    return { ...row, redirectUrl: result.redirectUrl };
  }
}

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly db: Db) {}

  @Post()
  async join(@Body() body: unknown) {
    const b = parse(z.object({ email: z.string().email().max(200), language: z.enum(['pl', 'en']).default('pl') }), body);
    const email = b.email.trim().toLowerCase();
    const existing = await this.db.orm.select().from(waitlist).where(eq(waitlist.email, email));
    if (existing.length) throw new ConflictException('Already on the waitlist');
    await this.db.orm.insert(waitlist).values({ email, language: b.language });
    return { ok: true };
  }

  @Get('count')
  async count() {
    const rows = await this.db.orm.select().from(waitlist);
    return { count: rows.length };
  }
}
