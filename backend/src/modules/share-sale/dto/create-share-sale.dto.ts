import { IsString, IsNumber, IsInt, IsOptional, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareSaleDto {
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

  @ApiProperty({ enum: ['AVISTA', 'FINANCIADO'] })
  @IsIn(['AVISTA', 'FINANCIADO'])
  paymentType: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0.01)
  totalValue: number;

  @ApiPropertyOptional({ example: 5000, description: 'Entrada (apenas para FINANCIADO)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @ApiProperty({ example: 12, description: 'Número de parcelas (1 para à vista)' })
  @IsInt()
  @Min(1)
  @Max(15)
  installments: number;

  @ApiProperty({ example: 10, description: 'Dia de vencimento das parcelas (1-28)' })
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @ApiProperty({ example: '2026-05-01', description: 'Data de início da venda' })
  @IsString()
  startDate: string;

  @ApiPropertyOptional({ example: 10, description: 'Dia de vencimento da mensalidade da marina (se diferente do dueDay)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  monthlyFeeDueDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
