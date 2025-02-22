import {
  Controller,
  Post,
  Body,
  Request,
  Patch,
  Param,
  Get,
  Delete,
} from '@nestjs/common';
import { DeclarationService } from './declaration.service';
import { CreateDeclarationDto } from './dto/create-declaration.dto'; // Certifique-se de que o caminho está correto
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('declarations')
@Controller('declarations')
export class DeclarationController {
  constructor(private readonly declarationService: DeclarationService) { }

  @ApiOperation({
    summary: 'Lista as declarações',
    description: 'Retorna todas as declarações.',
  })
  @ApiBearerAuth('access-token')
  @Get()
  async getAll() {
    return await this.declarationService.getDeclarations();
  }

  @ApiOperation({
    summary: 'Lista as declarações',
    description: 'Retorna todas as declarações.',
  })
  @ApiBearerAuth('access-token')
  @Get('type')
  async getType() {
    return await this.declarationService.getDeclarationsType();
  }

  @ApiOperation({
    summary: 'Dados de uma declaração',
    description: 'Retorna dados de uma declaração.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID da declaração',
  })
  @ApiBearerAuth('access-token')
  @Get(':id')
  async get(@Param() params: { id: string; },) {
    return await this.declarationService.getDeclaration(params.id);
  }

  @ApiOperation({
    summary: 'Criar uma declaração',
    description:
      'Permite que um usuário com privilégios de administrador crie uma nova declaração no sistema. O administrador deve fornecer as informações necessárias para a criação da declaração. Apenas usuários autenticados com permissão de admin podem acessar essa funcionalidade.',
  })
  @ApiBody({ type: CreateDeclarationDto, description: 'Request body.' })
  @ApiBearerAuth('access-token')
  @Post()
  async create(
    @Body() createDeclarationDto: CreateDeclarationDto,
    @Request() req,
  ) {
    return await this.declarationService.createDeclaration(
      req.user.sub,
      createDeclarationDto,
    );
  }

  @ApiOperation({
    summary: 'Atualizar uma declaração',
    description:
      'Atualizar o conteúdo de uma declaração. Somente usuários com privilégios de administradores podem realizar esta ação.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID da declaração',
  })
  @ApiBody({ type: CreateDeclarationDto, description: 'Request body.' })
  @ApiBearerAuth('access-token')
  @Patch(':id')
  async update(
    @Body() updateDeclarationDto: CreateDeclarationDto,
    @Param() params: { id: string; },
    @Request() req,
  ) {
    return await this.declarationService.updateDeclaration(
      req.user.is_admin,
      params.id,
      updateDeclarationDto,
    );
  }

  @ApiOperation({
    summary: 'Desativar declaração',
    description:
      'A declaração é desativada.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'ID da declaração',
  })
  @ApiBearerAuth('access-token')
  @Delete(':id')
  async deactivateUser(
    @Request() req,
    @Param() params: { id: string; },
  ) {
    return await this.declarationService.deactivate(req.user.is_admin, params.id);
  }
}
