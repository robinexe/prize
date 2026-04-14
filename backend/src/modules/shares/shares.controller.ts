import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SharesService } from './shares.service';
import { CreateShareDto } from './dto/create-share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('shares')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shares')
export class SharesController {
  constructor(private sharesService: SharesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Criar cota para embarcação (Admin)' })
  create(@Body() dto: CreateShareDto) {
    return this.sharesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as cotas' })
  findAll(@Query('boatId') boatId?: string, @Query('userId') userId?: string) {
    return this.sharesService.findAll({ boatId, userId });
  }

  @Get('my-shares')
  @ApiOperation({ summary: 'Minhas cotas' })
  getMyShares(@CurrentUser('id') userId: string) {
    return this.sharesService.findByUser(userId);
  }

  @Get('boat/:boatId')
  @ApiOperation({ summary: 'Cotas de uma embarcação' })
  findByBoat(@Param('boatId') boatId: string) {
    return this.sharesService.findByBoat(boatId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desativar cota (Admin)' })
  deactivate(@Param('id') id: string) {
    return this.sharesService.deactivate(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar cota (Admin)' })
  update(@Param('id') id: string, @Body() body: { maxReservations?: number }) {
    return this.sharesService.update(id, body);
  }
}
