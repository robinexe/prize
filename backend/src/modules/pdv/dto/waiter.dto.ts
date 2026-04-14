import { IsString, IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class CreateWaiterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
}

export class UpdateWaiterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
