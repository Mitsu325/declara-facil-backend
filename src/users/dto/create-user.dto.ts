import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  rg: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  issuing_agency: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  postal_code: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  street: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  house_number: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  city: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  state: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @IsBoolean() // Adicionando a validação para o is_admin
  @IsOptional()
  @ApiProperty()
  is_admin?: boolean; // Inclua esta propriedade
}
