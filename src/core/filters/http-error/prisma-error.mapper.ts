import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { FieldError } from './field-error';
import z from 'zod';

export interface MappedError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

export function prismaErrorMapper(exception: unknown): MappedError | undefined {
  if (!(exception instanceof PrismaClientKnownRequestError)) {
    return undefined;
  }

  switch (exception.code) {
    case 'P2002': {
      const field = getUniqueField(exception);
      return {
        statusCode: 409,
        message: 'Data already exists',
        errors: field
          ? [{ field, message: `${field} already exists` }]
          : undefined,
      };
    }
    case 'P2025':
      return {
        statusCode: 404,
        message:
          'The requested record was not found or has already been deleted.',
      };

    case 'P2003':
      return {
        statusCode: 409,
        message:
          'Operation failed due to a foreign key constraint violation or existing related records.',
      };

    case 'P2000':
      return {
        statusCode: 400,
        message: 'The provided value is too long for the target column.',
      };
    default:
      return undefined;
  }
}

const UniqueMetaSchema = z.object({
  modelName: z.string(),
  driverAdapterError: z.object({
    cause: z.object({
      constraint: z.object({ index: z.string() }),
    }),
  }),
});

function getUniqueField(
  exception: PrismaClientKnownRequestError,
): string | undefined {
  const parsed = UniqueMetaSchema.safeParse(exception.meta);
  if (!parsed.success) return undefined;

  const { modelName, driverAdapterError } = parsed.data;
  const index = driverAdapterError.cause.constraint.index;

  const prefix = `${modelName}_`;
  const suffix = '_key';
  if (!index.startsWith(prefix) || !index.endsWith(suffix)) return undefined;

  return index.slice(prefix.length, -suffix.length) || undefined;
}
