import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        message: 'Database connection is healthy',
        data: { status: 'ok' },
      };
    } catch (err) {
      this.logger.error(
        'Database health check failed',
        err instanceof Error ? err.stack : String(err),
      );
      throw new ServiceUnavailableException('Database is unavailable');
    }
  }
}
