import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { BoatsService } from './boats.service';

@ApiTags('marketplace')
@Controller('public/boats')
export class MarketplaceController {
  constructor(private boatsService: BoatsService) {}

  @Get('marketplace')
  @ApiOperation({ summary: 'Listar embarcações disponíveis para cotas (público)' })
  getMarketplace() {
    return this.boatsService.getMarketplaceBoats();
  }

  @Get(':id/image')
  @ApiOperation({ summary: 'Imagem da embarcação (público)' })
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const boat = await this.boatsService.findById(id);
    if (!boat?.imageUrl) {
      return res.status(404).send('Imagem não encontrada');
    }

    const match = boat.imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return res.status(404).send('Formato de imagem inválido');
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    });
    return res.send(buffer);
  }
}
