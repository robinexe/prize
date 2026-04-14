import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherJob } from './weather.job';

@Controller('weather')
export class WeatherController {
  constructor(
    private weatherService: WeatherService,
    private weatherJob: WeatherJob,
  ) {}

  @Get('current')
  async getCurrent() {
    const snapshot = await this.weatherService.getLatestValid();
    if (!snapshot) {
      return { ok: false, message: 'Nenhum dado meteorológico disponível' };
    }
    return { ok: true, data: snapshot };
  }

  @Get('history')
  async getHistory(@Query('hours') hours?: string) {
    const h = hours ? parseInt(hours, 10) : 24;
    const data = await this.weatherService.getHistory(isNaN(h) ? 24 : h);
    return { ok: true, data };
  }

  @Get('forecast')
  async getForecast() {
    const result = this.weatherService.getForecastDays();
    if (!result.days.length) {
      return { ok: false, message: 'Previsão não disponível ainda. Aguarde a próxima coleta.' };
    }
    return { ok: true, data: result.days, cachedAt: result.cachedAt };
  }

  @Get('ai-summary')
  async getAiSummary() {
    const result = this.weatherService.getAiSummary();
    if (!result.summary) {
      return { ok: false, message: 'Resumo ainda não disponível. Aguarde a próxima coleta.' };
    }
    return { ok: true, data: result };
  }

  @Post('trigger')
  async trigger() {
    const result = await this.weatherJob.triggerManual();
    return { ok: true, data: result };
  }
}
