import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { Request } from './request.entity';
import { User } from 'src/users/user.entity';
import { Declaration } from 'src/declaration/declaration.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { DeclarationService } from 'src/declaration/declaration.service';
import { UploadFileModule } from 'src/upload-file/upload-file.module';

@Module({
  imports: [
    UploadFileModule,
    TypeOrmModule.forFeature([Request, User, Declaration]),
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    UsersService,
    DeclarationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [RequestService], // Se você precisar usar o RequestService em outros módulos
})
export class RequestModule {}
