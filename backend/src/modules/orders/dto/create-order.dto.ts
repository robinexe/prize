import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  menuItemId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: ['TABLE', 'TAKEAWAY', 'DELIVERY'], default: 'TABLE' })
  @IsOptional()
  @IsEnum(['TABLE', 'TAKEAWAY', 'DELIVERY'])
  type?: string;

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

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
