process.env.NODE_ENV = 'test';
process.env.RATES_OFFLINE = '1';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../dist/app');

let app;
let http;

before(async () => {
  app = await createApp();
  await app.init();
  http = app.getHttpServer();
});
after(async () => app.close());

test('health', async () => {
  const r = await request(http).get('/api/health').expect(200);
  assert.equal(r.body.status, 'ok');
});

test('lists 24 races and returns one with offers and guide', async () => {
  const r = await request(http).get('/api/races').expect(200);
  assert.equal(r.body.length, 24);
  const hu = await request(http).get('/api/races/hungary-2027').expect(200);
  assert.ok(hu.body.offers.length >= 5);
  assert.equal(hu.body.guide.code, 'HU');
  await request(http).get('/api/races/nope').expect(404);
});

test('filters offers by level and rejects bad level', async () => {
  const r = await request(http).get('/api/races/hungary-2027/offers?level=budget').expect(200);
  assert.ok(r.body.every((o) => o.level === 'budget'));
  await request(http).get('/api/races/hungary-2027/offers?level=cheap').expect(400);
});

test('guides and country checklist', async () => {
  const g = await request(http).get('/api/guides/hu').expect(200);
  assert.equal(g.body.sos[0].number, '112');
  const c = await request(http).get('/api/guides/HU/checklist?date=2027-08-01&lang=en').expect(200);
  assert.ok(c.body.some((i) => i.id === 'id'));
  await request(http).get('/api/guides/HU/checklist?date=tomorrow').expect(400);
});

test('rates fall back to the offline snapshot', async () => {
  const r = await request(http).get('/api/rates').expect(200);
  assert.equal(r.body.live, false);
  assert.equal(r.body.rates.PLN, 4.4038);
});

test('suggests and quotes the standard Hungarian GP trip', async () => {
  const s = await request(http).post('/api/trips/suggest').send({ raceId: 'hungary-2027', level: 'standard', currency: 'PLN' }).expect(200);
  assert.equal(Math.round(s.body.summary.total), 4040);
  const q = await request(http).post('/api/trips/quote').send({ items: [{ offerId: 'hu-ticket-fan', quantity: 2 }], currency: 'EUR' }).expect(200);
  assert.ok(Math.abs(q.body.total - 3100 / 4.4038) < 0.01);
  await request(http).post('/api/trips/quote').send({ items: [], currency: 'PLN' }).expect(400);
});

test('saves a trip and pays with the test provider', async () => {
  const t = await request(http).post('/api/trips').send({
    raceId: 'hungary-2027', level: 'standard', currency: 'PLN',
    items: [{ offerId: 'hu-ticket-fan', quantity: 1 }, { offerId: 'hu-pkg-standard', quantity: 1 }],
  }).expect(201);
  assert.equal(t.body.total, 404000);
  const p = await request(http).post('/api/payments').send({ tripId: t.body.id, method: 'pay_now', country: 'PL' }).expect(201);
  assert.equal(p.body.status, 'authorised');
  const after = await request(http).get(`/api/trips/${t.body.id}`).expect(200);
  assert.equal(after.body.status, 'paid');
});

test('rejects offers from another race', async () => {
  await request(http).post('/api/trips').send({
    raceId: 'hungary-2027', level: 'budget', currency: 'PLN', items: [{ offerId: 'cn-ticket-ga', quantity: 1 }],
  }).expect(400);
});

test('instalments only where a partner exists; save-up works everywhere', async () => {
  const pl = await request(http).get('/api/payments/methods?country=PL').expect(200);
  assert.equal(pl.body.find((m) => m.method === 'instalments').available, true);
  const kz = await request(http).get('/api/payments/methods?country=KZ').expect(200);
  assert.equal(kz.body.find((m) => m.method === 'instalments').available, false);
  assert.equal(kz.body.find((m) => m.method === 'save_up').available, true);
  const t = await request(http).post('/api/trips').send({
    raceId: 'hungary-2027', level: 'budget', currency: 'PLN', items: [{ offerId: 'hu-pkg-budget', quantity: 1 }],
  }).expect(201);
  await request(http).post('/api/payments').send({ tripId: t.body.id, method: 'instalments', country: 'KZ' }).expect(400);
  const s = await request(http).post('/api/payments').send({ tripId: t.body.id, method: 'save_up', country: 'KZ' }).expect(201);
  assert.equal(s.body.status, 'scheduled');
});

test('waitlist validates and de-duplicates e-mails', async () => {
  await request(http).post('/api/waitlist').send({ email: 'not-an-email' }).expect(400);
  await request(http).post('/api/waitlist').send({ email: 'Fan@Example.com' }).expect(201);
  await request(http).post('/api/waitlist').send({ email: 'fan@example.com' }).expect(409);
  const c = await request(http).get('/api/waitlist/count').expect(200);
  assert.equal(c.body.count, 1);
});

test('race alerts: one sign-up per e-mail and race, unknown races rejected', async () => {
  await request(http).post('/api/race-alerts').send({ email: 'fan@example.com', raceId: 'australia-2027' }).expect(201);
  await request(http).post('/api/race-alerts').send({ email: 'FAN@example.com', raceId: 'australia-2027' }).expect(409);
  await request(http).post('/api/race-alerts').send({ email: 'fan@example.com', raceId: 'japan-2027' }).expect(201);
  await request(http).post('/api/race-alerts').send({ email: 'fan@example.com', raceId: 'nowhere-2027' }).expect(404);
});
