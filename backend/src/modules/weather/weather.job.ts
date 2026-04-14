import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HGBrasilService } from './hgbrasil.service';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherJob implements OnModuleInit {
  private readonly logger = new Logger(WeatherJob.name);

  constructor(
    private hgbrasil: HGBrasilService,
    private weather: WeatherService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    setTimeout(() => this.collectWeather(), 5000);
  }

  // Every hour from 06:00 to 22:00 BRT
  @Cron('0 6-22 * * *', { timeZone: 'America/Sao_Paulo' })
  async collectWeather() {
    const lat = parseFloat(this.config.get<string>('MARINA_LATITUDE', '-22.9714'));
    const lng = parseFloat(this.config.get<string>('MARINA_LONGITUDE', '-42.0192'));

    this.logger.log('Starting weather collection (HGBrasil)...');

    try {
      const { current, forecast } = await this.hgbrasil.fetchWeather(lat, lng);
      const classification = this.weather.classifyWeather(current);
      const clientSummary = this.weather.generateClientSummary(classification.level, current);
      const operatorSummary = this.weather.generateOperatorSummary(current);

      await this.weather.saveSnapshot(lat, lng, current, classification, clientSummary, operatorSummary);
      this.weather.cacheForecast(forecast);

      // Generate AI navigation summary (non-blocking)
      this.weather.generateAiSummary(current, forecast).catch(() => {});

      this.logger.log(
        `Weather collected: ${classification.level} (score: ${classification.score}) — ${forecast.length} days forecast cached`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Weather collection failed: ${msg}`);

      try {
        await this.weather.saveErrorSnapshot(lat, lng, msg);
      } catch (dbErr) {
        this.logger.error(`Failed to save error snapshot: ${dbErr}`);
      }
    }
  }

  async triggerManual() {
    this.logger.log('Manual weather collection triggered');
    await this.collectWeather();
    return this.weather.getLatestValid();
  }
}
