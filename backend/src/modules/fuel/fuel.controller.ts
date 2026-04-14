import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FuelService } from './fuel.service';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('fuel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fuel')
export class FuelController {
  constructor(private fuelService: FuelService) {}

  @Post()
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Registrar abastecimento' })
  logFuel(@CurrentUser('id') operatorId: string, @Body() dto: CreateFuelLogDto) {
    return this.fuelService.logFuel(operatorId, dto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar todos os abastecimentos' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.fuelService.findAll(page, limit);
  }

  @Get('my-logs')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Listar meus abastecimentos registrados' })
  getMyLogs(
    @CurrentUser('id') operatorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.fuelService.findByOperator(operatorId, page, limit);
  }

  // ---- Fuel Price Management ----

  @Get('price')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Preço atual do combustível' })
  getCurrentPrice(@Query('fuelType') fuelType?: string) {
    return this.fuelService.getCurrentPrice(fuelType);
  }

  @Put('price')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Definir preço do combustível' })
  setPrice(
    @CurrentUser('id') userId: string,
    @Body() body: { price: number; fuelType?: string; notes?: string },
  ) {
    if (!body.price || body.price <= 0) throw new BadRequestException('Preço inválido');
    return this.fuelService.setPrice(body.price, body.fuelType || 'GASOLINE', userId, body.notes);
  }

  @Get('price/history')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Histórico de preços do combustível' })
  getPriceHistory(@Query('fuelType') fuelType?: string) {
    return this.fuelService.getPriceHistory(fuelType);
  }

  // ---- Gauge Analysis (Gemini AI) ----

  @Post('analyze-gauge')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: 'Analisar medidor de combustível por foto (IA)' })
  analyzeGauge(@Body() body: { boatId: string; image: string; mimeType?: string; cropped?: boolean }) {
    if (!body.boatId || !body.image) throw new BadRequestException('boatId e image são obrigatórios');
    const mimeType = body.mimeType || 'image/jpeg';
    return this.fuelService.analyzeGauge(body.boatId, body.image, mimeType, body.cropped);
  }

  @Get('boat/:boatId')
  @ApiOperation({ summary: 'Histórico de combustível da embarcação' })
  getByBoat(@Param('boatId') boatId: string, @Query('page') page?: number) {
    return this.fuelService.getByBoat(boatId, page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar abastecimento por ID' })
  findById(@Param('id') id: string) {
    return this.fuelService.findById(id);
  }

  @Get('report/:boatId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Relatório de consumo' })
  getReport(
    @Param('boatId') boatId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.fuelService.getConsumptionReport(boatId, new Date(startDate), new Date(endDate));
  }

  // ---- Gauge Training Examples ----

  @Get('gauge-examples')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar exemplos de treinamento do medidor' })
  getGaugeExamples(@Query('dashboardType') dashboardType?: string) {
    return this.fuelService.getGaugeExamples(dashboardType);
  }

  @Post('gauge-examples')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Adicionar exemplo de treinamento do medidor' })
  addGaugeExample(@Body() body: { image: string; mimeType?: string; percentage: number; dashboardType?: string; description?: string }) {
    if (!body.image || body.percentage == null) throw new BadRequestException('image e percentage são obrigatórios');
    if (body.percentage < 0 || body.percentage > 100) throw new BadRequestException('percentage deve ser entre 0 e 100');
    return this.fuelService.addGaugeExample(body.image, body.mimeType || 'image/jpeg', body.percentage, body.dashboardType || 'SPARK_LCD', body.description);
  }

  @Get('gauge-examples/:id/image')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obter imagem de um exemplo de treinamento' })
  async getGaugeExampleImage(@Param('id') id: string, @Res() res: Response) {
    const example = await this.fuelService.getGaugeExampleWithImage(id);
    if (!example) throw new NotFoundException('Exemplo não encontrado');
    const buffer = Buffer.from(example.imageBase64, 'base64');
    res.set({ 'Content-Type': example.mimeType, 'Cache-Control': 'public, max-age=86400' });
    res.send(buffer);
  }

  @Delete('gauge-examples/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover exemplo de treinamento' })
  removeGaugeExample(@Param('id') id: string) {
    return this.fuelService.removeGaugeExample(id);
  }
}
