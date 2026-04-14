import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ShareSaleService } from './share-sale.service';
import { CreateShareSaleDto } from './dto/create-share-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('share-sale')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ShareSaleController {
  constructor(private readonly shareSaleService: ShareSaleService) {}

  @Post()
  create(@Body() dto: CreateShareSaleDto) {
    return this.shareSaleService.create(dto);
  }

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.shareSaleService.findAll(page as any, limit as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shareSaleService.findOne(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.shareSaleService.cancel(id);
  }
}
