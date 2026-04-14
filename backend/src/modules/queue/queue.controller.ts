import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { EnterQueueDto } from './dto/enter-queue.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Post('enter')
  @ApiOperation({ summary: 'Entrar na fila de descida' })
  enter(@CurrentUser('id') clientId: string, @Body() dto: EnterQueueDto) {
    return this.queueService.enterQueue(clientId, dto);
  }

  @Get('today')
  @ApiOperation({ summary: 'Fila de hoje' })
  @Roles('ADMIN', 'OPERATOR')
  getToday(@Query('boatId') boatId?: string) {
    return this.queueService.getTodayQueue(boatId);
  }

  @Get('my-position')
  @ApiOperation({ summary: 'Minha posição na fila' })
  getMyPosition(@CurrentUser('id') clientId: string) {
    return this.queueService.getQueuePosition(clientId);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Atualizar status na fila' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') operatorId: string,
  ) {
    return this.queueService.updateStatus(id, status, operatorId);
  }
}
