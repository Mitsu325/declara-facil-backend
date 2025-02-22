// request.service.ts
import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Request as RequestEntity, RequestStatus } from './request.entity';
import { UsersService } from 'src/users/users.service';
import { DeclarationService } from 'src/declaration/declaration.service';
import { GeneratePdfDto } from './dto/generate-pdf.dto';
import { UploadFileService } from 'src/upload-file/upload-file.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { Declaration } from 'src/declaration/declaration.entity';
import { User } from 'src/users/user.entity';

export interface FormatRequestType {
  id: string;
  declaration: string;
  name: string;
  requestDate: Date;
  status: RequestStatus;
  url?: string;
  generationDate?: Date;
}

export interface UserRequestType {
  id: string;
  declaration: string;
  attendantName?: string;
  requestDate: Date;
  status: RequestStatus;
  generationDate?: Date;
}

@Injectable()
export class RequestService {
  constructor(
    private readonly usersService: UsersService,
    private readonly declarationService: DeclarationService,
    private readonly uploadFileService: UploadFileService,

    @InjectRepository(RequestEntity)
    private requestRepository: Repository<RequestEntity>,
  ) { }

  async getRequests(userId: string): Promise<FormatRequestType[]> {
    const user = await this.usersService.findById(userId);
    if (user && !user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const requests = await this.requestRepository.find({
      order: { createdAt: 'DESC' },
    });

    return requests.map((request: RequestEntity) => ({
      id: request.id,
      declaration: request.declaration.type,
      name: request.user.name,
      requestDate: request.createdAt,
      status: request.status,
      declarationSignature: request.declaration.signatureType
    }));
  }

  async getRequestsWithDeclarations(
    userId: string,
  ): Promise<FormatRequestType[]> {
    const user = await this.usersService.findById(userId);
    if (user && !user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
    const requests = await this.requestRepository.find({
      where: {
        url: Not(IsNull()),
        generation_date: MoreThan(sevenDaysAgo),
      },
      order: { generation_date: 'DESC' },
    });

    return requests.map((request: RequestEntity) => ({
      id: request.id,
      declaration: request.declaration.type,
      name: request.user.name,
      requestDate: request.createdAt,
      url: request.url,
      status: request.status,
      generationDate: request.generation_date,
    }));
  }

  async getRequestsOverview(isAdmin: boolean, month: string, year: string) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    const startDate = `${year}-${month}-01`;
    const nextMonth = new Date(Number(year), Number(month) - 1, 1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0).toISOString().split('T')[0];

    const totalRequests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();

    const pendingRequests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('request.status = :status', { status: 'pending' })
      .getCount();

    const completedRequests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('request.status = :status', { status: 'completed' })
      .getCount();

    const rejectedRequests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('request.status = :status', { status: 'rejected' })
      .getCount();

    const approvalRate = completedRequests + rejectedRequests > 0
      ? (completedRequests / (completedRequests + rejectedRequests)) * 100
      : 0;

    const requests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('request.status IN (:...statuses)', { statuses: ['completed', 'rejected'] })
      .getMany();

    const totalDuration = requests.reduce((acc, request) => {
      const createdAt = request.createdAt.getTime();
      const updatedAt = request.updatedAt.getTime();
      const durationInSeconds = (updatedAt - createdAt) / 1000;

      return acc + durationInSeconds;
    }, 0);

    const averageCompletionTime = requests.length > 0 ? totalDuration / requests.length : 0;

    return {
      totalRequests,
      pendingRequests,
      approvalRate,
      averageCompletionTime,
    };
  }

  async getRequestsByDeclarationType(isAdmin: boolean, month: string, year: string) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    const startDate = `${year}-${month}-01`;
    const nextMonth = new Date(Number(year), Number(month) - 1, 1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0).toISOString().split('T')[0];

    const result = await this.requestRepository
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.declaration', 'declaration')
      .select('request.declaration_id', 'declarationId')
      .addSelect('declaration.type', 'declarationType')
      .addSelect('COUNT(request.id)', 'totalRequests')
      .where('request.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('request.declaration_id, declaration.type')
      .getRawMany();

    return result.map((row) => ({
      declarationId: row.declarationId,
      declarationType: row.declarationType,
      totalRequests: parseInt(row.totalRequests, 10),
    }));
  }

  async getRequestsByDay(isAdmin: boolean, month: string, year: string) {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);
    endDate.setHours(23, 59, 59, 999);

    const requests = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })
      .select([
        'EXTRACT(DAY FROM request.createdAt) AS day',
        'COUNT(request.id) AS total',
      ])
      .groupBy('EXTRACT(DAY FROM request.createdAt)')
      .orderBy('EXTRACT(DAY FROM request.createdAt)', 'ASC')
      .getRawMany();

    return requests.map((request: any) => ({
      date: request.day.padStart(2, '0') + `/${month}`,
      totalRequests: parseInt(request.total, 10),
    }));
  }

  async createRequest(
    declarationId: string,
    userId: string,
  ): Promise<RequestEntity> {
    const user = await this.usersService.findById(userId);
    if (user && user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action. 4',
      );
    }

    const declaration = await this.declarationService.findById(declarationId);
    if (!declaration || !declaration.is_active) {
      throw new ForbiddenException('Declaration not found.');
    }

    const hasPendingRequest = await this.checkForPendingRequests(
      userId,
      declarationId,
    );
    if (hasPendingRequest) {
      throw new ConflictException(
        'You already have a pending request. Please wait for its completion before requesting again.',
      );
    }

    const request = this.requestRepository.create({
      user,
      declaration,
    });

    return this.requestRepository.save(request);
  }

  async updateStatus(
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<FormatRequestType[]> {
    const user = await this.usersService.findById(userId);
    if (user && !user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const requests: FormatRequestType[] = [];
    const { status, requestIds } = updateStatusDto;
    for (const requestId of requestIds) {
      const requestData = await this.getRequestById(requestId);

      const completedStatus = [RequestStatus.COMPLETED, RequestStatus.REJECTED];

      if (
        completedStatus.includes(requestData.status) ||
        (completedStatus.includes(status) &&
          requestData.status !== RequestStatus.PROCESSING)
      ) {
        continue;
      }

      await this.requestRepository.update(
        { id: requestId },
        {
          status,
        },
      );

      const updatedRequest = await this.getRequestById(requestId);
      requests.push({
        id: requestId,
        declaration: updatedRequest.declaration.type,
        name: updatedRequest.user.name,
        requestDate: updatedRequest.createdAt,
        status: updatedRequest.status,
      });
    }

    return requests;
  }

  async getRequestsByUser(userId: string): Promise<UserRequestType[]> {
    const user = await this.usersService.findById(userId);
    if (user && user.is_admin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    const requests = await this.requestRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    return requests.map((request: RequestEntity) => ({
      id: request.id,
      declaration: request.declaration.type,
      attendantName: request.attendant?.name ?? '',
      requestDate: request.createdAt,
      status: request.status,
      generationDate: request.generation_date,
    }));
  }

  async checkForPendingRequests(
    userId: string,
    declarationId: string,
  ): Promise<boolean> {
    const pendingRequest = await this.requestRepository.findOne({
      where: {
        user: { id: userId },
        declaration: { id: declarationId },
        status: RequestStatus.PENDING, // Verificar se há uma solicitação com status 'pending'
      },
    });

    return !!pendingRequest; // Retorna true se existir uma solicitação pendente
  }

  async getRequestById(requestId: string): Promise<RequestEntity> {
    return await this.requestRepository.findOne({ where: { id: requestId } });
  }

  async generatePdf(
    isAdmin: boolean,
    userId: string,
    generatePdfDto: GeneratePdfDto,
  ): Promise<FormatRequestType[]> {
    if (!isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    const { requestIds, directorId } = generatePdfDto;
    const user = await this.usersService.findById(userId);

    let director: User;
    if (directorId) {
      director = await this.usersService.findById(directorId);
    }

    const tmpDir = this.ensureTmpDir();

    const requests: FormatRequestType[] = [];

    for (const requestId of requestIds) {
      try {
        const requestData = await this.getRequestById(requestId);

        if (!requestData || requestData.status !== RequestStatus.PENDING) {
          console.warn(
            `Request ${requestId} not found or not in PENDING status`,
          );
          continue;
        }

        const declaration = await this.declarationService.findById(
          requestData.declaration.id,
        );
        if (!declaration || !declaration.is_active) {
          console.warn(`Declaration ${requestData.declaration.id} not found`);
          continue;
        }

        const userData = this.buildUserData(requestData, director);

        const modifiedContent = this.replacePlaceholders(
          declaration.content,
          userData,
        );

        const footerContent = this.buildFooterContent(declaration, userData);

        const fileName = `${requestId}_${Date.now().toString()}.pdf`;
        const filePath = path.join(tmpDir, fileName);

        const fileBuffer = await this.generatePdfFile(
          filePath,
          declaration,
          modifiedContent,
          footerContent,
        );

        const { signedUrl } = await this.uploadFileService.uploadStorage(
          'declaration',
          fileName,
          fileBuffer,
          'application/pdf',
        );

        await this.requestRepository.update(
          { id: requestId },
          {
            url: signedUrl,
            status: RequestStatus.PROCESSING,
            generation_date: new Date(),
            attendant: user,
          },
        );

        const updatedRequest = await this.getRequestById(requestId);
        requests.push({
          id: requestId,
          declaration: updatedRequest.declaration.type,
          name: updatedRequest.user.name,
          requestDate: updatedRequest.createdAt,
          status: updatedRequest.status,
          url: updatedRequest.url,
        });

        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Erro ao processar a requisição ${requestId}:`, error);
      }
    }

    return requests.filter((req) => req !== null);
  }

  private replacePlaceholders(
    template: string,
    data: Record<string, string>,
  ): string {
    return Object.entries(data).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, template);
  };

  private ensureTmpDir(): string {
    const tmpDir = path.join(__dirname, '..', '..', 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
    return tmpDir;
  }

  private buildUserData(
    requestData: RequestEntity,
    director?: User,
  ): Record<string, string> {
    const formatDate = (date: Date): string => {
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const formatCep = (cep) => {
      const sanitizedCep = cep.replace(/\D/g, '');
      const paddedCep = sanitizedCep.padStart(8, '0');
      return `${paddedCep.slice(0, 5)}-${paddedCep.slice(5)}`;
    };

    function formatCPF(cpf: string): string {
      return cpf.replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{2})$/, '$1-$2');
    }

    function formatRG(rg: string): string {
      return rg.replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }

    return {
      nome: requestData.user.name,
      rua: requestData.user.street,
      numero_casa: requestData.user.house_number,
      complemento: requestData.user.complement || '',
      bairro: requestData.user.neighborhood,
      cidade: requestData.user.city,
      estado: requestData.user.state,
      cep: formatCep(requestData.user.postal_code),
      data_atual: formatDate(new Date()),
      rg: formatRG(requestData.user.rg),
      cpf: formatCPF(requestData.user.cpf),
      orgao_emissor: requestData.user.issuing_agency,
      diretor_nome: director?.name || '',
      diretor_cpf: director ? formatCPF(director.cpf) : '',
      diretor_cargo: director?.job_title || '',
    };
  }

  private buildFooterContent(
    declaration: Declaration,
    userData: Record<string, string>,
  ): string {
    switch (declaration.signatureType) {
      case 'requester':
        declaration.footer = `${declaration.footer}\n \n{{nome}}\nRG nº {{rg}}/{{orgao_emissor}}\nCPF/MF nº {{cpf}}`;
        break;
      case 'director':
        declaration.footer = `${declaration.footer}\n \n{{diretor_nome}}\nCPF: {{diretor_cpf}}\n{{diretor_cargo}}`;
        break;
      default:
        break;
    }
    return this.replacePlaceholders(declaration.footer, userData);
  }

  private async generatePdfFile(
    filePath: string,
    declaration: Declaration,
    modifiedContent: string,
    footerContent: string,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4' });

      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      doc.moveDown(10);

      doc
        .font('Times-Bold')
        .fontSize(14)
        .text(declaration.title, { align: 'center' });

      doc.moveDown(4);

      const contentLines = modifiedContent.split('\\n');
      contentLines.forEach((line) => {
        doc.font('Times-Roman').fontSize(14).text(line.trim(), {
          align: 'justify',
          lineGap: 12,
          indent: 60,
        });

        doc.moveDown();
      });

      doc.moveDown();

      const footerLines = footerContent.split('\\n');
      footerLines.forEach((line) => {
        doc.font('Times-Roman').fontSize(14).text(line, {
          align: 'center',
          lineGap: 0,
        });
      });

      doc.moveDown();

      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font('Times-Roman')
        .fontSize(9)
        .text(
          'Rua Francisca Júlia, nº 290 - Santana - CEP 02403-010 - São Paulo - SP - Tel.: (11) 2281.0300 - CNPJ 02.090.452/0001-37',
          75,
          doc.page.height - oldBottomMargin / 2,
          {
            align: 'center',
            lineGap: 0,
          },
        );

      doc.font('Times-Roman').fontSize(9).text('E-mail: adm@acnsf.org.br', {
        align: 'center',
        lineGap: 0,
      });
      doc.page.margins.bottom = oldBottomMargin;

      doc.end();

      writeStream.on('finish', () => {
        try {
          const fileBuffer = fs.readFileSync(filePath);

          if (fileBuffer.length === 0) {
            return reject(new Error(`O arquivo ${filePath} está vazio`));
          }

          resolve(fileBuffer);
        } catch (error) {
          reject(`Erro ao ler o arquivo: ${error.message}`);
        }
      });
      writeStream.on('error', reject);
    });
  }
}
