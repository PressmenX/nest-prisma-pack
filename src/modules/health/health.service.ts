import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkConnection() {
    try {
      return await this.prisma.$queryRaw`SELECT 1 AS status`;
    } catch (err) {
      if (err instanceof Error)
        throw new InternalServerErrorException(err.message);
      throw err;
    }
  }
}
