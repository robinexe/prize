import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HGBrasilService } from './hgbrasil.service';
import { WeatherService } from './weather.service';
import { WeatherJob } from './weather.job';
import { WeatherController } from './weather.controller';

@Module({
  imports: [ConfigModule],
  controllers: [WeatherController],
  providers: [HGBrasilService, WeatherService, WeatherJob],
  exports: [WeatherService],
})
export class WeatherModule {}
