import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterPaymentDto {
  @ApiProperty()
  @IsString()
  chargeId: string;

  @ApiProperty({ example: 350.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ['PIX', 'CREDIT_CARD', 'BANK_TRANSFER', 'CASH'] })
  @IsEnum(['PIX', 'CREDIT_CARD', 'BANK_TRANSFER', 'CASH'])
  method: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transactionId?: string;
}
