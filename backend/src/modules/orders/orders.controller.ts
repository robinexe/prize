import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos' })
  findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('restaurantTableId') restaurantTableId?: string,
  ) {
    return this.ordersService.findAll(status, date, restaurantTableId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas dos pedidos de hoje' })
  getStats() {
    return this.ordersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar pedido' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar pedido' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Put(':id/advance')
  @ApiOperation({ summary: 'Avançar status do pedido' })
  advance(@Param('id') id: string) {
    return this.ordersService.advanceStatus(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancelar pedido' })
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir pedido' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
