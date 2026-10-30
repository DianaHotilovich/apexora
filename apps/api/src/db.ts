import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  language: text('language').notNull().default('pl'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** "Tell me when ticket sales open" alerts for one race. */
export const raceAlerts = pgTable('race_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  raceId: text('race_id').notNull(),
  language: text('language').notNull().default('pl'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const trips = pgTable('trips', {
  id: uuid('id').primaryKey().defaultRandom(),
  raceId: text('race_id').notNull(),
  level: text('level').notNull(),
  currency: text('currency').notNull(),
  items: jsonb('items').notNull(),
  total: integer('total_minor').notNull(),
  status: text('status').notNull().default('planned'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tripId: uuid('trip_id').notNull().references(() => trips.id),
  method: text('method').notNull(),
  amount: integer('amount_minor').notNull(),
  currency: text('currency').notNull(),
  provider: text('provider').notNull(),
  providerRef: text('provider_ref'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  language text NOT NULL DEFAULT 'pl',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS race_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  race_id text NOT NULL,
  language text NOT NULL DEFAULT 'pl',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, race_id)
);
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id text NOT NULL,
  level text NOT NULL,
  currency text NOT NULL,
  items jsonb NOT NULL,
  total_minor integer NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id),
  method text NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  provider text NOT NULL,
  provider_ref text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);`;

const schema = { waitlist, raceAlerts, trips, payments };

/**
 * Database access. Uses a real PostgreSQL server when DATABASE_URL is set,
 * otherwise an embedded PostgreSQL (PGlite) – in memory, or in DATA_DIR on disk.
 */
@Injectable()
export class Db implements OnModuleInit, OnModuleDestroy {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orm: any;
  private close: () => Promise<void> = async () => undefined;

  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      const { Pool } = await import('pg');
      const { drizzle } = await import('drizzle-orm/node-postgres');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query(SCHEMA_SQL);
      this.orm = drizzle(pool, { schema });
      this.close = () => pool.end();
    } else {
      const { PGlite } = await import('@electric-sql/pglite');
      const { drizzle } = await import('drizzle-orm/pglite');
      const client = new PGlite(process.env.DATA_DIR || undefined);
      await client.exec(SCHEMA_SQL);
      this.orm = drizzle(client, { schema });
      this.close = () => client.close();
    }
  }

  async onModuleDestroy() {
    await this.close();
  }
}
