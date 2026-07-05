import { ConfigModuleOptions } from '@nestjs/config';
import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
});

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  validate(config) {
    return envSchema.parse(config);
  },
};
