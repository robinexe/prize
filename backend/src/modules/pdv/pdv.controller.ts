import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PdvService } from './pdv.service';
import {
  CreateTableDto, UpdateTableDto,
  CreateWaiterDto, UpdateWaiterDto,
  CreateTerminalDto, UpdateTerminalDto,
  OpenCashRegisterDto, CloseCashRegisterDto, CashRegisterTransactionDto,
  CreatePDVOrderDto, FinalizePDVOrdersDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('pdv')
@Controller('pdv')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class PdvController {
  constructor(private pdvService: PdvService) {}

  // ─── Tables ─────────────────────────────────────────────
  @Get('tables')
  @ApiOperation({ summary: 'Listar mesas' })
  getTables() { return this.pdvService.getTables(); }

  @Post('tables')
  @ApiOperation({ summary: 'Criar mesa' })
  createTable(@Body() dto: CreateTableDto) { return this.pdvService.createTable(dto); }

  @Put('tables/:id')
  @ApiOperation({ summary: 'Atualizar mesa' })
  updateTable(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.pdvService.updateTable(id, dto);
  }

  @Delete('tables/:id')
  @ApiOperation({ summary: 'Excluir mesa' })
  deleteTable(@Param('id') id: string) { return this.pdvService.deleteTable(id); }

  @Post('tables/:id/generate-token')
  @ApiOperation({ summary: 'Gerar/regenerar token de auto-atendimento' })
  generateTableToken(@Param('id') id: string) {
    return this.pdvService.generateTableToken(id);
  }

  // ─── Waiters ────────────────────────────────────────────
  @Get('waiters')
  @ApiOperation({ summary: 'Listar garçons' })
  getWaiters() { return this.pdvService.getWaiters(); }

  @Post('waiters')
  @ApiOperation({ summary: 'Criar garçom' })
  createWaiter(@Body() dto: CreateWaiterDto) { return this.pdvService.createWaiter(dto); }

  @Put('waiters/:id')
  @ApiOperation({ summary: 'Atualizar garçom' })
  updateWaiter(@Param('id') id: string, @Body() dto: UpdateWaiterDto) {
    return this.pdvService.updateWaiter(id, dto);
  }

  @Delete('waiters/:id')
  @ApiOperation({ summary: 'Excluir garçom' })
  deleteWaiter(@Param('id') id: string) { return this.pdvService.deleteWaiter(id); }

  @Get('waiters/:id/commissions')
  @ApiOperation({ summary: 'Comissões do garçom' })
  getWaiterCommissions(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pdvService.getWaiterCommissions(id, from, to);
  }

  // ─── Terminals ──────────────────────────────────────────
  @Get('terminals')
  @ApiOperation({ summary: 'Listar terminais' })
  getTerminals() { return this.pdvService.getTerminals(); }

  @Post('terminals')
  @ApiOperation({ summary: 'Criar terminal' })
  createTerminal(@Body() dto: CreateTerminalDto) { return this.pdvService.createTerminal(dto); }

  @Put('terminals/:id')
  @ApiOperation({ summary: 'Atualizar terminal' })
  updateTerminal(@Param('id') id: string, @Body() dto: UpdateTerminalDto) {
    return this.pdvService.updateTerminal(id, dto);
  }

  @Delete('terminals/:id')
  @ApiOperation({ summary: 'Excluir terminal' })
  deleteTerminal(@Param('id') id: string) { return this.pdvService.deleteTerminal(id); }

  // ─── Cash Registers ────────────────────────────────────
  @Post('cash-registers/open')
  @ApiOperation({ summary: 'Abrir caixa' })
  openCashRegister(@Body() dto: OpenCashRegisterDto) {
    return this.pdvService.openCashRegister(dto);
  }

  @Put('cash-registers/:id/close')
  @ApiOperation({ summary: 'Fechar caixa' })
  closeCashRegister(@Param('id') id: string, @Body() dto: CloseCashRegisterDto) {
    return this.pdvService.closeCashRegister(id, dto);
  }

  @Get('cash-registers')
  @ApiOperation({ summary: 'Listar caixas' })
  getCashRegisters(
    @Query('status') status?: string,
    @Query('terminalId') terminalId?: string,
  ) {
    return this.pdvService.getCashRegisters(status, terminalId);
  }

  @Get('cash-registers/history')
  @ApiOperation({ summary: 'Histórico de fechamentos' })
  getCashRegisterHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pdvService.getCashRegisterHistory(from, to);
  }

  @Get('cash-registers/:id')
  @ApiOperation({ summary: 'Detalhes do caixa' })
  getCashRegister(@Param('id') id: string) {
    return this.pdvService.getCashRegister(id);
  }

  @Post('cash-registers/:id/transactions')
  @ApiOperation({ summary: 'Adicionar transação (sangria/suprimento)' })
  addTransaction(@Param('id') id: string, @Body() dto: CashRegisterTransactionDto) {
    return this.pdvService.addTransaction(id, dto);
  }

  // ─── PDV Sell ──────────────────────────────────────────
  @Post('sell')
  @ApiOperation({ summary: 'Criar venda PDV' })
  createPDVOrder(@Body() dto: CreatePDVOrderDto) {
    return this.pdvService.createPDVOrder(dto);
  }

  @Put('orders/finalize')
  @ApiOperation({ summary: 'Fechar conta — finalizar pedidos com pagamento' })
  finalizeOrders(@Body() dto: FinalizePDVOrdersDto) {
    return this.pdvService.finalizeOrders(dto);
  }

  // ─── Stats ─────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas do PDV' })
  getStats(@Query('cashRegisterId') cashRegisterId?: string) {
    return this.pdvService.getPDVStats(cashRegisterId);
  }
}
