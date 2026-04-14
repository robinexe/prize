import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnterQueueDto {
  @ApiProperty()
  @IsString()
  boatId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
