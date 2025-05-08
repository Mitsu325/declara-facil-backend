import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { SignatureType } from '../declaration.entity';

export class CreateDeclarationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nome da declaração' })
  type: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Título da declaração' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Corpo do texto' })
  content: string;

  // @IsString()
  // @IsNotEmpty()
  // @ApiProperty({ description: 'Rodapé da declaração' })
  // footer: string;

  @IsEnum(SignatureType)
  @IsNotEmpty()
  @ApiProperty({ enum: SignatureType, description: 'Tipo de assinante' })
  signatureType: SignatureType;
}
