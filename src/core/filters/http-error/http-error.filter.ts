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

interface FieldError {
  field: string;
  message: string;
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = 'error';
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
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
      typeof message === 'string' ? message : JSON.stringify(message);

    const validationErrors = this.extractValidationErrors(exception);

    this.logger.error(`[${endpoint}] - ${statusCode} : ${messageStr}`, track);
    res.status(statusCode).json({
      status,
      statusCode,
      type,
      exceptionName,
      timestamp,
      endpoint,
      message: messageStr,
      errors: validationErrors,
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
