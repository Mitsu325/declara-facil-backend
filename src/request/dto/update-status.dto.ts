import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  ArrayMinSize,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { RequestStatus } from '../request.entity';

export class UpdateStatusDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ApiProperty({ description: 'Lista de IDs das solicitações' })
  requestIds: string[];

  @IsEnum(RequestStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: RequestStatus, description: 'Status da solicitação' })
  status: RequestStatus;
}
