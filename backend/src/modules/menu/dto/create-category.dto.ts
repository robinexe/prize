import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() slug: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() order?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}
