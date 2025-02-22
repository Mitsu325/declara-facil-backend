import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './request/request.module';
import { DeclarationModule } from './declaration/declaration.module';
import { typeOrmConfig } from './configs/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    AuthModule,
    RequestModule,
    DeclarationModule,
  ],
})
export class AppModule { }
