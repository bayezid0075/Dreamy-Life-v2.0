import { Module } from '@nestjs/common';
import { MediaService } from './application/services/media.service';

@Module({
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
