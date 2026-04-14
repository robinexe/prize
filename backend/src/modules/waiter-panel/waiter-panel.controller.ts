import {
  Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WaiterPanelService } from './waiter-panel.service';
import { CreateWaiterOrderDto, FinalizeOrderDto } from './dto/create-waiter-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('waiter-panel')
@Controller('waiter-panel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WAITER', 'ADMIN')
export class WaiterPanelController {
  constructor(private service: WaiterPanelService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Perfil do garçom logado' })
  getProfile(@Req() req: any) {
    return this.service.getProfile(req.user.id);
  }

  @Get('tables')
  @ApiOperation({ summary: 'Listar mesas com pedidos ativos' })
  getTables() {
    return this.service.getTables();
  }

  @Get('orders')
  @ApiOperation({ summary: 'Listar pedidos abertos' })
  getOrders(@Req() req: any, @Query('mine') mine?: string) {
    if (mine === 'true') {
      return this.service.getOrders(req.user.waiterId);
    }
    return this.service.getOrders();
  }

  @Get('menu')
  @ApiOperation({ summary: 'Cardápio para criação de pedidos' })
  getMenu() {
    return this.service.getMenu();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do garçom hoje' })
  getStats(@Req() req: any) {
    return this.service.getMyStats(req.user.id);
  }

  @Post('orders')
  @ApiOperation({ summary: 'Criar pedido (vinculado ao garçom)' })
  createOrder(@Req() req: any, @Body() dto: CreateWaiterOrderDto) {
    return this.service.createOrder(req.user.id, dto);
  }

  @Put('orders/:id/advance')
  @ApiOperation({ summary: 'Avançar status do pedido' })
  advanceOrder(@Param('id') id: string) {
    return this.service.advanceOrder(id);
  }

  @Put('orders/:id/finalize')
  @ApiOperation({ summary: 'Finalizar pedido com pagamento' })
  finalizeOrder(@Param('id') id: string, @Body() dto: FinalizeOrderDto) {
    return this.service.finalizeOrder(id, dto);
  }
}
