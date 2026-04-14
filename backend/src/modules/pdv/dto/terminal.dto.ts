import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTerminalDto {
  @IsString()
  name: string;
}

export class UpdateTerminalDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
