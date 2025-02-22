import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Importa o repositório da entidade User
  providers: [
    UsersService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
