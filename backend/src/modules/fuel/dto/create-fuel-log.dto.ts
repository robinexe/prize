import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFuelLogDto {
  @ApiProperty()
  @IsString()
  boatId: string;

  @ApiProperty({ example: 40.5 })
  @IsNumber()
  @Min(0.1)
  liters: number;

  @ApiPropertyOptional({ example: 6.89 })
  @IsOptional()
  @IsNumber()
  pricePerLiter?: number;

  @ApiPropertyOptional({ example: 152.3 })
  @IsOptional()
  @IsNumber()
  hourMeter?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID do cotista específico para cobrança (se vazio, rateia entre todos)' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'Foto do painel/medidor (base64 data URL)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
