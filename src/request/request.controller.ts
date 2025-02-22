import {
  Controller,
  Post,
  Request,
  Get,
  Param,
  Body,
  Patch,
  Query,
} from '@nestjs/common';
import { RequestService } from './request.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('requests')
@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) { }

  @ApiOperation({
    summary: 'Retorna todas as solicitações',
    description:
      'Retorna todas as solicitações de declarações realizadas. Apenas o usuário com privilégio de administrador pode visualizar as solicitações.',
  })
  @ApiBearerAuth('access-token')
  @Get()
  async getRequests(@Request() req) {
    return this.requestService.getRequests(req.user.sub);
  }

  @ApiOperation({
    summary: 'Retorna todas as solicitações com declaração gerada',
    description:
      'Retorna todas as solicitações de declarações realizadas. Apenas o usuário com privilégio de administrador pode visualizar as solicitações.',
  })
  @ApiBearerAuth('access-token')
  @Get('with-declarations')
  async getRequestsWithDeclarations(@Request() req) {
    return this.requestService.getRequestsWithDeclarations(req.user.sub);
  }

  @ApiOperation({
    summary: 'Dados gerais de solicitações',
    description:
      'Obter dados gerais de solicitações para um mês/ano específico. Apenas o usuário com privilégio de administrador pode visualizar.',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'month',
    description: 'Mês para o filtro (formato: MM)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano para o filtro (formato: YYYY)',
    required: true,
    type: String,
  })
  @Get('overview')
  async getRequestsOverview(
    @Query('month') month: string,
    @Query('year') year: string,
    @Request() req,
  ) {
    return this.requestService.getRequestsOverview(req.user.is_admin, month, year);
  }

  @ApiOperation({
    summary: 'Dados solicitações por tipo de declaração',
    description:
      'Obter quantidade de solicitações por tipo de declaração. Apenas o usuário com privilégio de administrador pode visualizar.',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'month',
    description: 'Mês para o filtro (formato: MM)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano para o filtro (formato: YYYY)',
    required: true,
    type: String,
  })
  @Get('overview/by-declaration')
  async getRequestsByDeclarationType(
    @Query('month') month: string,
    @Query('year') year: string,
    @Request() req,
  ) {
    return this.requestService.getRequestsByDeclarationType(req.user.is_admin, month, year);
  }

  @ApiOperation({
    summary: 'Solicitações diárias',
    description:
      'Obter quantidade de solicitações diárias. Apenas o usuário com privilégio de administrador pode visualizar.',
  })
  @ApiBearerAuth('access-token')
  @ApiQuery({
    name: 'month',
    description: 'Mês para o filtro (formato: MM)',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'year',
    description: 'Ano para o filtro (formato: YYYY)',
    required: true,
    type: String,
  })
  @Get('daily')
  getRequestsByDay(
    @Query('month') month: string,
    @Query('year') year: string,
    @Request() req,
  ) {
    return this.requestService.getRequestsByDay(req.user.is_admin, month, year);
  }

  @ApiOperation({
    summary: 'Solicitar uma declaração',
    description:
      'Permite que um usuário solicite a geração de uma nova declaração. O usuário deve estar autenticado para fazer a solicitação e não deve ser um admin.',
  })
  @ApiParam({
    name: 'declarationId',
    type: 'string',
    description: 'ID da declaração',
  })
  @ApiBearerAuth('access-token')
  @Post('create/:declarationId')
  async createRequest(@Request() req, @Param() param) {
    return this.requestService.createRequest(param.declarationId, req.user.sub);
  }

  @ApiOperation({
    summary: 'Lista de solicitações feitas pelo usuário logado',
    description:
      'Retorna todas as solicitações de declarações realizadas pelo usuário logado. Apenas o próprio usuário autenticado pode visualizar suas solicitações, proporcionando um histórico completo de suas declarações.',
  })
  @ApiBearerAuth('access-token')
  @Get('my-requests')
  async getUserRequests(@Request() req) {
    return this.requestService.getRequestsByUser(req.user.sub);
  }

  @ApiOperation({
    summary: 'Gerar as declarações em PDF',
    description:
      'Permite a geração de declarações em formato PDF. Somente usuários com privilégios de administradores podem realizar esta ação.',
  })
  @ApiBody({ type: GeneratePdfDto, description: 'Request body.' })
  @ApiBearerAuth('access-token')
  @Post('/generate-pdf')
  async update(@Body() generatePdfDto: GeneratePdfDto, @Request() req) {
    return this.requestService.generatePdf(req.user.is_admin, req.user.sub, generatePdfDto);
  }

  @ApiOperation({
    summary: 'Atualizar status das solicitações',
    description:
      'Permite a alteração do status de uma ou mais solicitações, podendo ser completada ou rejeitada.',
  })
  @Patch('update-status')
  async updateRequestStatus(
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.requestService.updateStatus(req.user.sub, updateStatusDto);
  }
}
