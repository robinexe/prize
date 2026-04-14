import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsString()
  terminalId: string;

  @IsString()
  operatorName: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingAmount?: number;
}

export class CloseCashRegisterDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  closingAmount?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CashRegisterTransactionDto {
  @IsString()
  type: string; // WITHDRAWAL | DEPOSIT

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
