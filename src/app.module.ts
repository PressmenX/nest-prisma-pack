import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { pinoConfigAsync } from './core/config/logger.config';
import { ConfigModule } from '@nestjs/config';
import { envConfig } from './core/config/env.config';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig),
    LoggerModule.forRootAsync(pinoConfigAsync),
    PrismaModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
