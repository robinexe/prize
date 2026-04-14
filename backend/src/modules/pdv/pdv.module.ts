import { Module } from '@nestjs/common';
import { PdvController } from './pdv.controller';
import { SelfServiceController, MesaController } from './self-service.controller';
import { PdvService } from './pdv.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PdvController, SelfServiceController, MesaController],
  providers: [PdvService],
  exports: [PdvService],
})
export class PdvModule {}
