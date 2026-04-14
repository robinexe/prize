import { IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ChecklistItemInput {
  @ApiProperty({ example: 'Nível de combustível verificado' })
  @IsString()
  label: string;
}

export class CreateChecklistDto {
  @ApiProperty()
  @IsString()
  boatId: string;

  @ApiProperty({ enum: ['PRE_LAUNCH', 'POST_USE', 'WEEKLY'] })
  @IsEnum(['PRE_LAUNCH', 'POST_USE', 'WEEKLY'])
  type: string;

  @ApiProperty({ type: [ChecklistItemInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemInput)
  items: ChecklistItemInput[];
}
