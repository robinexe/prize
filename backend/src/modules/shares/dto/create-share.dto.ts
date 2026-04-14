import { IsString, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShareDto {
  @ApiProperty()
  @IsString()
  boatId: string;

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  shareNumber: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate: string;
}
