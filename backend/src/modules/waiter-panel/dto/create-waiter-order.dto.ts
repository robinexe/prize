import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WaiterOrderItemDto {
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

export class CreateWaiterOrderDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  restaurantTableId?: string;

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

  @ApiProperty({ required: false, default: true, description: 'If true, order goes to kitchen (ANALYSIS). If false, order starts as READY.' })
  @IsOptional()
  @IsBoolean()
  sendToKitchen?: boolean;

  @ApiProperty({ type: [WaiterOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaiterOrderItemDto)
  items: WaiterOrderItemDto[];
}

export class FinalizeOrderDto {
  @ApiProperty({ enum: ['CASH', 'CREDIT', 'DEBIT', 'PIX', 'VOUCHER', 'MIXED'] })
  @IsString()
  paymentMethod: string;
}
