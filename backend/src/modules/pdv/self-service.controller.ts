import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PdvService } from './pdv.service';
import { CreateSelfServiceOrderDto } from './dto';

@ApiTags('self-service')
@Controller('self-service')
export class SelfServiceController {
  constructor(private pdvService: PdvService) {}

  // Old direct-token endpoints (kept for compatibility)
  @Get(':token')
  @ApiOperation({ summary: 'Cardápio auto-atendimento (público)' })
  getMenu(@Param('token') token: string) {
    return this.pdvService.getSelfServiceMenu(token);
  }

  @Post(':token/order')
  @ApiOperation({ summary: 'Criar pedido auto-atendimento (público)' })
  createOrder(@Param('token') token: string, @Body() dto: CreateSelfServiceOrderDto) {
    return this.pdvService.createSelfServiceOrder(token, dto);
  }
}

@ApiTags('mesa')
@Controller('mesa')
export class MesaController {
  constructor(private pdvService: PdvService) {}

  @Post(':code/session')
  @ApiOperation({ summary: 'Criar sessão temporária (10 min) para mesa' })
  createSession(@Param('code') code: string) {
    return this.pdvService.createMesaSession(code);
  }

  @Get(':code/comanda')
  @ApiOperation({ summary: 'Comanda da mesa (pedidos do dia)' })
  getComanda(@Param('code') code: string) {
    return this.pdvService.getTableComanda(code);
  }

  @Post(':code/fechar-conta')
  @ApiOperation({ summary: 'Solicitar fechamento da conta' })
  requestClosure(@Param('code') code: string) {
    return this.pdvService.requestTableClosure(code);
  }

  @Get('session/:sessionToken')
  @ApiOperation({ summary: 'Cardápio via sessão temporária' })
  getMenuBySession(@Param('sessionToken') sessionToken: string) {
    return this.pdvService.getMenuBySession(sessionToken);
  }

  @Post('session/:sessionToken/order')
  @ApiOperation({ summary: 'Criar pedido via sessão temporária' })
  createOrderBySession(@Param('sessionToken') sessionToken: string, @Body() dto: CreateSelfServiceOrderDto) {
    return this.pdvService.createOrderBySession(sessionToken, dto);
  }
}
