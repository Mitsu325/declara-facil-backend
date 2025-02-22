import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cpf: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  rg: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  issuing_agency: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  house_number: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  neighborhood: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  state: string;
}
