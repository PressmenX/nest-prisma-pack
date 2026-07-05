import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { HttpErrorFilter } from './core/filters/http-error/http-error.filter';
import { TransformInterceptor } from './core/interceptors/transform/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = new ConfigService();

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableShutdownHooks();

  await app.listen(configService.get('PORT') ?? 3000);
}
void bootstrap();
