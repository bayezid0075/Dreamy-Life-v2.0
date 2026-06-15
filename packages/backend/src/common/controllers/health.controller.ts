import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckResponse } from '../dto/api-response.dto';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy', type: HealthCheckResponse })
  check() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dreamy-life-backend',
    };
  }
}
