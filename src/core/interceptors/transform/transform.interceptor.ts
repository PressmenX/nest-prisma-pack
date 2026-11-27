import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

type Wrapped = { message: string; data: unknown };

function isWrapped(value: unknown): value is Wrapped {
  if (!value || typeof value !== 'object') return false;

  const obj = value as Record<string, unknown>;

  return (
    Object.keys(obj).length === 2 &&
    typeof obj.message === 'string' &&
    obj.data !== undefined
  );
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();
    const method = req.method;
    const statusCode = res.statusCode;

    const messageMapping: Record<string, string> = {
      GET: 'Data retrieved successfully',
      POST: 'Data created successfully',
      PUT: 'Data updated successfully',
      PATCH: 'Data updated successfully',
      DELETE: 'Data deleted successfully',
    };

    return next.handle().pipe(
      map((data: unknown) => {
        const wrapped = isWrapped(data) ? data : undefined;

        return {
          statusCode,
          status: 'success',
          endpoint: `${method} ${req.url}`,
          message:
            wrapped?.message ??
            messageMapping[method] ??
            'Operation successful',
          result: wrapped ? wrapped.data : data,
        };
      }),
    );
  }
}
