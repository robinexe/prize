import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class UpdateOrderDto {
  @ApiProperty({ enum: ['ANALYSIS', 'PREPARING', 'READY', 'DELIVERING', 'DONE', 'CANCELLED'], required: false })
  @IsOptional()
  @IsEnum(['ANALYSIS', 'PREPARING', 'READY', 'DELIVERING', 'DONE', 'CANCELLED'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
