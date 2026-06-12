import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dreamy-life-backend',
    };
  }
}
