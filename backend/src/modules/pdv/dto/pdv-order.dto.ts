import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class PDVOrderItemDto {
  @IsOptional()
  @IsString()
  menuItemId?: string;

  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePDVOrderDto {
  @IsOptional()
  @IsString()
  type?: string; // TABLE | COUNTER | TAKEAWAY

  @IsOptional()
  @IsString()
  restaurantTableId?: string;

  @IsOptional()
  @IsString()
  waiterId?: string;

  @IsString()
  cashRegisterId: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  discountType?: string; // PERCENT | FIXED

  @IsOptional()
  @IsString()
  paymentMethod?: string; // CASH | CREDIT | DEBIT | PIX | VOUCHER | MIXED | PENDING

  @IsOptional()
  @IsBoolean()
  requiresPreparation?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PDVOrderItemDto)
  items: PDVOrderItemDto[];
}

export class FinalizePDVOrdersDto {
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @IsString()
  paymentMethod: string; // CASH | CREDIT | DEBIT | PIX | VOUCHER | MIXED

  @IsString()
  cashRegisterId: string;

  @IsOptional()
  @IsNumber()
  waiterFeeAmount?: number;
}
