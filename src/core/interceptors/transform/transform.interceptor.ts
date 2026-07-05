import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { map, Observable } from 'rxjs';

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
        let customMessage: string | undefined;
        let resultData: unknown = data;

        if (data && typeof data === 'object') {
          const dataObj = data as Record<string, unknown>;

          if (typeof dataObj.message === 'string') {
            customMessage = dataObj.message;
          }

          if (dataObj.data !== undefined) {
            resultData = dataObj.data;
          }
        }

        return {
          statusCode,
          status: 'success',
          endpoint: `${method} ${req.url}`,
          message:
            customMessage ?? messageMapping[method] ?? 'Operation successful',
          result: resultData,
        };
      }),
    );
  }
}
