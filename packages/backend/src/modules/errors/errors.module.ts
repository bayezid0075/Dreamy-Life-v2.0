import { Module, Global } from '@nestjs/common';
import { ErrorsController } from './errors.controller';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Global()
@Module({
  controllers: [ErrorsController],
  providers: [FileLoggerService],
  exports: [FileLoggerService],
})
export class ErrorsModule {}
