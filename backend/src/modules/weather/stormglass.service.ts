import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface StormglassData {
  windSpeed?: number;
  windDirection?: number;
  gust?: number;
  waveHeight?: number;
  wavePeriod?: number;
  waveDirection?: number;
  swellHeight?: number;
  swellDirection?: number;
  swellPeriod?: number;
  currentSpeed?: number;
  currentDirection?: number;
  airTemperature?: number;
  waterTemperature?: number;
  visibility?: number;
  cloudCover?: number;
  humidity?: number;
  precipitation?: number;
  rawJson?: string;
  time?: string;
}

export interface StormglassForecastHour {
  time: string;
  windSpeed?: number;
  windDirection?: number;
  gust?: number;
  waveHeight?: number;
  wavePeriod?: number;
  waveDirection?: number;
  swellHeight?: number;
  swellPeriod?: number;
  airTemperature?: number;
  waterTemperature?: number;
  visibility?: number;
  cloudCover?: number;
  humidity?: number;
  precipitation?: number;
}

@Injectable()
export class StormglassService {
  private readonly logger = new Logger(StormglassService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.stormglass.io/v2';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('STORMGLASS_API_KEY', '');
  }

  private readonly stormglassParams = [
    'windSpeed', 'windDirection', 'gust',
    'waveHeight', 'wavePeriod', 'waveDirection',
    'swellHeight', 'swellDirection', 'swellPeriod',
    'currentSpeed', 'currentDirection',
    'airTemperature', 'waterTemperature',
    'visibility', 'cloudCover', 'humidity', 'precipitation',
  ].join(',');

  private pick(entry: Record<string, unknown>, key: string): number | undefined {
    const val = entry[key];
    if (!val || typeof val !== 'object') return undefined;
    const obj = val as Record<string, number>;
    return obj.sg ?? obj.noaa ?? obj.icon ?? obj.meteo ?? Object.values(obj)[0];
  }

  async fetchWeatherWithForecast(lat: number, lng: number): Promise<{ current: StormglassData; forecast: StormglassForecastHour[] }> {
    if (!this.apiKey) throw new Error('STORMGLASS_API_KEY not configured');

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
    // Fetch 240 hours (10 days) ahead in a single API call — no extra cost
    const end = new Date(now.getTime() + 240 * 3600_000).toISOString();

    this.logger.log(`Fetching Stormglass (10d): lat=${lat}, lng=${lng}`);

    const response = await axios.get(`${this.baseUrl}/weather/point`, {
      params: { lat, lng, params: this.stormglassParams, start, end },
      headers: { Authorization: this.apiKey },
      timeout: 15_000,
    });

    const hours = response.data?.hours;
    if (!hours || hours.length === 0) {
      throw new Error('Stormglass returned empty data');
    }

    // Current = first hour
    const h = hours[0];
    const current: StormglassData = {
      windSpeed: this.pick(h, 'windSpeed'),
      windDirection: this.pick(h, 'windDirection'),
      gust: this.pick(h, 'gust'),
      waveHeight: this.pick(h, 'waveHeight'),
      wavePeriod: this.pick(h, 'wavePeriod'),
      waveDirection: this.pick(h, 'waveDirection'),
      swellHeight: this.pick(h, 'swellHeight'),
      swellDirection: this.pick(h, 'swellDirection'),
      swellPeriod: this.pick(h, 'swellPeriod'),
      currentSpeed: this.pick(h, 'currentSpeed'),
      currentDirection: this.pick(h, 'currentDirection'),
      airTemperature: this.pick(h, 'airTemperature'),
      waterTemperature: this.pick(h, 'waterTemperature'),
      visibility: this.pick(h, 'visibility'),
      cloudCover: this.pick(h, 'cloudCover'),
      humidity: this.pick(h, 'humidity'),
      precipitation: this.pick(h, 'precipitation'),
      rawJson: JSON.stringify(h),
    };

    // Forecast = all hours mapped to lightweight objects
    const forecast: StormglassForecastHour[] = hours.map((hr: Record<string, unknown>) => ({
      time: hr.time as string,
      windSpeed: this.pick(hr, 'windSpeed'),
      windDirection: this.pick(hr, 'windDirection'),
      gust: this.pick(hr, 'gust'),
      waveHeight: this.pick(hr, 'waveHeight'),
      wavePeriod: this.pick(hr, 'wavePeriod'),
      waveDirection: this.pick(hr, 'waveDirection'),
      swellHeight: this.pick(hr, 'swellHeight'),
      swellPeriod: this.pick(hr, 'swellPeriod'),
      airTemperature: this.pick(hr, 'airTemperature'),
      waterTemperature: this.pick(hr, 'waterTemperature'),
      visibility: this.pick(hr, 'visibility'),
      cloudCover: this.pick(hr, 'cloudCover'),
      humidity: this.pick(hr, 'humidity'),
      precipitation: this.pick(hr, 'precipitation'),
    }));

    return { current, forecast };
  }

  async fetchCurrentWeather(lat: number, lng: number): Promise<StormglassData> {
    const { current } = await this.fetchWeatherWithForecast(lat, lng);
    return current;
  }
}
