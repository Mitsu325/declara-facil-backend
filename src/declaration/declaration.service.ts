import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Declaration, SignatureType } from './declaration.entity';
import { CreateDeclarationDto } from './dto/create-declaration.dto'; // Importar o DTO
import { UsersService } from 'src/users/users.service';

export interface FormatDeclarationTypes {
  id: string;
  type: string;
}

export interface FormatDeclaration {
  id: string;
  type: string;
  title: string;
  content: string;
  footer: string;
  signatureType: SignatureType;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

@Injectable()
export class DeclarationService {
  constructor(
    private readonly usersService: UsersService,

    @InjectRepository(Declaration)
    private declarationRepository: Repository<Declaration>,
  ) { }

  async getDeclarations(): Promise<FormatDeclaration[]> {
    const declarations = await this.declarationRepository.find();

    return declarations.map((declaration) => ({
      id: declaration.id,
      type: declaration.type,
      title: declaration.title,
      content: declaration.content,
      footer: declaration.footer,
      signatureType: declaration.signatureType,
      active: declaration.is_active,
      createdBy: declaration.user.name,
      createdAt: declaration.createdAt,
      updatedAt: declaration.updatedAt,
    }));
  }

  async getDeclaration(declarationId: string): Promise<Omit<Declaration, 'user'>> {
    const { user, ...declaration } = await this.declarationRepository.findOne({
      where: { id: declarationId },
    });

    return { ...declaration };
  }

  async getDeclarationsType(): Promise<FormatDeclarationTypes[]> {
    const declarations = await this.declarationRepository.find({
      where: { is_active: true }
    });

    return declarations.map((declaration) => ({
      id: declaration.id,
      type: declaration.type,
    }));
  }

  async findById(declarationId: string): Promise<Declaration> {
    return await this.declarationRepository.findOne({
      where: { id: declarationId },
    });
  }

  async createDeclaration(
    userId: string,
    createDeclarationDto: CreateDeclarationDto,
  ): Promise<Declaration> {
    const user = await this.usersService.findById(userId);
    if (user && !user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
    const declaration = this.declarationRepository.create({
      ...createDeclarationDto,
      user,
    });
    return this.declarationRepository.save(declaration);
  }

  async updateDeclaration(
    isAdmin: string,
    declarationId: string,
    updateDeclarationDto: CreateDeclarationDto,
  ): Promise<Declaration> {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const declaration = await this.declarationRepository.findOne({
      where: { id: declarationId },
    });
    if (!declaration || !declaration.is_active) {
      throw new NotFoundException('Declaration not found.');
    }

    declaration.type = updateDeclarationDto.type ?? declaration.type;
    declaration.title = updateDeclarationDto.title ?? declaration.title;
    declaration.content = updateDeclarationDto.content ?? declaration.content;
    declaration.footer = updateDeclarationDto.footer ?? declaration.footer;
    declaration.signatureType = updateDeclarationDto.signatureType ?? declaration.signatureType;

    return this.declarationRepository.save(declaration);
  }

  async deactivate(
    isAdmin: string,
    declarationId: string
  ): Promise<void> {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const declaration = await this.declarationRepository.findOne({
      where: { id: declarationId },
    });
    if (!declaration || !declaration.is_active) {
      throw new NotFoundException('Declaration not found.');
    }

    await this.declarationRepository.update(declarationId, {
      is_active: false,
      type: declaration.type + ' (Desativado)'
    });

    return;
  }
}
