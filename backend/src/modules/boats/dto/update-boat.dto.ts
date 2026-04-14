import { PartialType } from '@nestjs/swagger';
import { CreateBoatDto } from './create-boat.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBoatDto extends PartialType(CreateBoatDto) {
  @ApiPropertyOptional({ enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BLOCKED'] })
  @IsOptional()
  @IsEnum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BLOCKED'])
  status?: string;
}
