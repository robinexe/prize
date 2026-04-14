import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface HGBrasilCurrentData {
  temp: number;
  humidity: number;
  cloudiness: number;
  rain: number;
  windSpeed: number; // km/h (parsed from string)
  windDirection: number;
  windCardinal: string;
  description: string;
  conditionSlug: string;
  currently: string; // 'dia' | 'noite'
  sunrise: string;
  sunset: string;
  city: string;
}

export interface HGBrasilForecastDay {
  date: string; // DD/MM
  fullDate: string; // DD/MM/YYYY
  weekday: string;
  max: number;
  min: number;
  humidity: number;
  cloudiness: number;
  rain: number;
  rainProbability: number;
  windSpeedy: string;
  description: string;
  condition: string;
}

@Injectable()
export class HGBrasilService {
  private readonly logger = new Logger(HGBrasilService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.hgbrasil.com/weather';

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('HGBRASIL_API_KEY', '');
  }

  private parseWindSpeed(windSpeedy: string): number {
    // "2.66 km/h" → 2.66
    const match = windSpeedy?.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  async fetchWeather(lat: number, lng: number): Promise<{
    current: HGBrasilCurrentData;
    forecast: HGBrasilForecastDay[];
  }> {
    if (!this.apiKey) throw new Error('HGBRASIL_API_KEY not configured');

    this.logger.log(`Fetching HGBrasil weather: lat=${lat}, lng=${lng}`);

    const response = await axios.get(this.baseUrl, {
      params: {
        key: this.apiKey,
        lat,
        lon: lng,
        user_ip: 'remote',
        forecast_days: 16,
      },
      timeout: 15_000,
    });

    const results = response.data?.results;
    if (!results) {
      throw new Error('HGBrasil returned empty data');
    }

    const current: HGBrasilCurrentData = {
      temp: results.temp,
      humidity: results.humidity,
      cloudiness: results.cloudiness,
      rain: results.rain ?? 0,
      windSpeed: this.parseWindSpeed(results.wind_speedy),
      windDirection: results.wind_direction,
      windCardinal: results.wind_cardinal,
      description: results.description,
      conditionSlug: results.condition_slug,
      currently: results.currently,
      sunrise: results.sunrise,
      sunset: results.sunset,
      city: results.city_name,
    };

    const forecast: HGBrasilForecastDay[] = (results.forecast || []).map(
      (f: any) => ({
        date: f.date,
        fullDate: f.full_date,
        weekday: f.weekday,
        max: f.max,
        min: f.min,
        humidity: f.humidity,
        cloudiness: f.cloudiness,
        rain: f.rain,
        rainProbability: f.rain_probability,
        windSpeedy: f.wind_speedy,
        description: f.description,
        condition: f.condition,
      }),
    );

    return { current, forecast };
  }
}
