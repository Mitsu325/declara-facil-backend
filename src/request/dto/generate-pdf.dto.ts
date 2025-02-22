import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class GeneratePdfDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({ description: 'Lista de IDs das solicitações' })
  requestIds: string[];

  @IsString()
  @ApiProperty({ description: 'ID do diretor que irá assinar a declaração' })
  directorId: string;
}
