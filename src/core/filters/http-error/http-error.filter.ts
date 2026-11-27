import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { FieldError } from './field-error';
import { MappedError, prismaErrorMapper } from './prisma-error.mapper';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);
  private readonly isDev: boolean;

  constructor(configService: ConfigService) {
    this.isDev = configService.get<string>('NODE_ENV') === 'development';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { statusCode, message, errors } = this.parseException(exception);

    const exceptionName =
      exception instanceof Error ? exception.constructor.name : 'UnknownError';
    const endpoint = `${req.method} ${req.url}`;

    const logMessage = `[${endpoint}] - ${statusCode} : ${message}`;
    if (statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(logMessage, stack);
    } else {
      this.logger.warn(logMessage);
    }

    res.status(statusCode).json({
      status: 'error',
      statusCode,
      type: STATUS_CODES[statusCode] ?? 'Internal Server Error',
      exceptionName: this.isDev ? exceptionName : undefined,
      timestamp: new Date().toISOString(),
      endpoint,
      message,
      errors,
    });
  }

  private parseException(exception: unknown): MappedError {
    const mapped = prismaErrorMapper(exception);
    if (mapped) return mapped;

    if (exception instanceof ZodValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors: this.extractValidationErrors(exception),
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const raw =
        typeof response === 'object' && 'message' in response
          ? response.message
          : exception.message;

      return {
        statusCode: exception.getStatus(),
        message: typeof raw === 'string' ? raw : JSON.stringify(raw),
      };
    }

    if (typeof exception === 'object' && exception !== null) {
      const { status, expose } = exception as Record<string, unknown>;

      if (
        expose === true &&
        typeof status === 'number' &&
        status >= 400 &&
        status < 500
      ) {
        return {
          statusCode: status,
          message: STATUS_CODES[status] ?? 'Client Error',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal error occurred on the server',
    };
  }

  private extractValidationErrors(
    exception: ZodValidationException,
  ): FieldError[] | undefined {
    const zodError = exception.getZodError();
    if (!(zodError instanceof ZodError)) return undefined;

    return zodError.issues.map((issue) => ({
      field: issue.path.map(String).join('.') || 'root',
      message: issue.message,
    }));
  }
}
