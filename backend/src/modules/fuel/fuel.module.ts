import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FuelController } from './fuel.controller';
import { FuelService } from './fuel.service';

@Module({
  imports: [ConfigModule],
  controllers: [FuelController],
  providers: [FuelService],
  exports: [FuelService],
})
export class FuelModule {}
