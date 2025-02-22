import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Declara Fácil')
    .setDescription('The Declara Facil API description')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('declarations')
    .addTag('requests')
    .addBearerAuth(
      {
        description: `Please enter token in following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: 'https://declara-facil-frontend.vercel.app',
    credentials: true,
  });

  app.use(function (request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    next();
  });

  await app.listen(3000);
}
bootstrap();
