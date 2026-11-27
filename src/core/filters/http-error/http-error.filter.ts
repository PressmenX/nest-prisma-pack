import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { STATUS_CODES } from 'http';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { FieldError } from './field-error';
import { prismaErrorMapper } from './prisma-error.mapper';
import { ConfigService } from '@nestjs/config';

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

    const mapped = prismaErrorMapper(exception);

    const status = 'error';
    const statusCode =
      mapped?.statusCode ??
      (exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR);
    const type = STATUS_CODES[statusCode] || 'Internal Server Error';
    const exceptionName =
      exception instanceof Error ? exception.constructor.name : 'UnknownError';
    const endpoint = `${req.method} ${req.url}`;
    const timestamp = new Date().toISOString();
    const errors =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'An internal error occurred on the server';
    const message =
      typeof errors === 'object' && errors !== null
        ? ((errors as Record<string, unknown>)['message'] ??
          JSON.stringify(errors))
        : String(errors);
    const track = exception instanceof Error ? exception.stack : '';
    const messageStr =
      mapped?.message ??
      (typeof message === 'string' ? message : JSON.stringify(message));
    const fieldErrors =
      this.extractValidationErrors(exception) ?? mapped?.errors;

    const logMessage = `[${endpoint}] - ${statusCode} : ${messageStr}`;
    if (statusCode >= 500) this.logger.error(logMessage, track);
    else this.logger.warn(logMessage);

    res.status(statusCode).json({
      status,
      statusCode,
      type,
      exceptionName: this.isDev ? exceptionName : undefined,
      timestamp,
      endpoint,
      message: messageStr,
      errors: fieldErrors,
    });
  }

  private extractValidationErrors(
    exception: unknown,
  ): FieldError[] | undefined {
    if (!(exception instanceof ZodValidationException)) return undefined;

    const zodError = exception.getZodError();
    if (!(zodError instanceof ZodError)) return undefined;

    return zodError.issues.map((issue) => ({
      field: issue.path.map(String).join('.') || 'root',
      message: issue.message,
    }));
  }
}
