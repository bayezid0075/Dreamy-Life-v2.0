import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/nestjs';

export interface StandardErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    detail?: any;
  };
}

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
];

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
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
    }

    response.status(status).json(errorResponse);
  }
}
