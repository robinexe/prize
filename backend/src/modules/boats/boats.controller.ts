import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BoatsService } from './boats.service';
import { CreateBoatDto } from './dto/create-boat.dto';
import { UpdateBoatDto } from './dto/update-boat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('boats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boats')
export class BoatsController {
  constructor(private boatsService: BoatsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cadastrar embarcação (Admin)' })
  create(@Body() dto: CreateBoatDto) {
    return this.boatsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar embarcações' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('page') page?: number, @Query('status') status?: string) {
    return this.boatsService.findAll(page, undefined, status);
  }

  @Get('my-boats')
  @ApiOperation({ summary: 'Minhas embarcações (cotas)' })
  getMyBoats(@CurrentUser('id') userId: string) {
    return this.boatsService.getUserBoats(userId);
  }

  @Get('available')
  @ApiOperation({ summary: 'Embarcações disponíveis para período' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getAvailable(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.boatsService.getAvailableForDate(new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes da embarcação' })
  findById(@Param('id') id: string) {
    return this.boatsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Atualizar embarcação (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateBoatDto) {
    return this.boatsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remover embarcação (Admin)' })
  remove(@Param('id') id: string) {
    return this.boatsService.softDelete(id);
  }
}
