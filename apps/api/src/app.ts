import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  GuidesController, HealthController, PaymentsController, RacesController, RatesController, TripsController, WaitlistController,
} from './controllers';
import { Db } from './db';
import { PaymentsService } from './payments.service';
import { RatesService } from './rates.service';

@Module({
  controllers: [HealthController, RacesController, GuidesController, RatesController, TripsController, PaymentsController, WaitlistController],
  providers: [Db, RatesService, PaymentsService],
})
export class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: process.env.NODE_ENV === 'test' ? false : undefined });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',') });
  app.enableShutdownHooks();
  return app;
}
