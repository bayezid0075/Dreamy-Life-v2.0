import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/nestjs';
import { FileLoggerService } from '../logger/file-logger.service';

export interface StandardErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    detail?: any;
  };
}

const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
];
const envOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly fileLogger = new FileLoggerService();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const origin = request.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : exceptionResponse.message || 'Internal server error';

    const errorResponse: StandardErrorResponse = {
      success: false,
      error: {
        code: status === HttpStatus.INTERNAL_SERVER_ERROR ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
        message: message,
        detail: exceptionResponse.error || null,
      },
    };

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`[Error] ${request.method} ${request.url}`, exception);
      Sentry.captureException(exception);

      // Write to error file
      this.fileLogger.logError({
        source: 'backend',
        type: exception instanceof Error ? exception.constructor.name : 'unknown',
        message: message,
        stack: exception instanceof Error ? exception.stack : undefined,
        request: {
          method: request.method,
          url: request.url,
          ip: request.ip,
        },
      });
    }

    response.status(status).json(errorResponse);
  }
}
