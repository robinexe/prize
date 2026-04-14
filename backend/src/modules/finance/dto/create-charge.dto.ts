import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChargeDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Abastecimento Jet-ski Wave Runner' })
  @IsString()
  description: string;

  @ApiProperty({ example: 350.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: '2026-05-05' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'FUEL' })
  @IsString()
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  boatId?: string;
}
