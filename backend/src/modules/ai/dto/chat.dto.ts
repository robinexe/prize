import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ example: 'Quando é minha próxima reserva?' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'tela de reservas' })
  @IsOptional()
  @IsString()
  context?: string;
}
