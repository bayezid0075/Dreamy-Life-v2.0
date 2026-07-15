import { Controller, Post, Body, Ip } from '@nestjs/common';
import { FileLoggerService, ErrorEntry } from '../../common/logger/file-logger.service';

@Controller('api/errors')
export class ErrorsController {
  constructor(private readonly fileLogger: FileLoggerService) {}

  @Post()
  reportError(
    @Body() body: {
      source?: string;
      type?: string;
      message?: string;
      stack?: string;
      componentStack?: string;
      url?: string;
    },
    @Ip() ip: string,
  ) {
    this.fileLogger.logError({
      source: (body.source as ErrorEntry['source']) || 'frontend-web',
      type: body.type || 'unknown',
      message: body.message || 'No message',
      stack: body.stack,
      componentStack: body.componentStack,
      url: body.url,
      request: { ip },
    });

    return { success: true };
  }
}
