import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Senha do usuário para confirmar a desativação.',
    example: 'sua_senha',
  })
  @IsString()
  password: string;
}