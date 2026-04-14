import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBoatDto {
  @ApiProperty({ example: 'Wave Runner Pro' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Yamaha VX Cruiser' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  year: number;

  @ApiProperty({ example: 'BR-SP-12345' })
  @IsString()
  registration: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional({ enum: ['GASOLINE', 'DIESEL', 'ETHANOL'], default: 'GASOLINE' })
  @IsOptional()
  @IsEnum(['GASOLINE', 'DIESEL', 'ETHANOL'])
  fuelType?: string;

  @ApiProperty({ example: 70 })
  @IsNumber()
  fuelCapacity: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  totalShares?: number;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  monthlyFee: number;

  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  shareValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Berço 12 — Pier A' })
  @IsOptional()
  @IsString()
  locationBerth?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hasSound?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
