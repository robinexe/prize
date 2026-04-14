import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty()
  @IsString()
  boatId: string;

  @ApiProperty({ example: '2026-04-15T08:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-04-16T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID do usuário (admin pode criar para outro usuário)' })
  @IsOptional()
  @IsString()
  userId?: string;
}
