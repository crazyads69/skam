import { Controller, Get } from '@nestjs/common'

interface HealthResponse {
  status: 'ok'
  service: string
  timestamp: string
}

@Controller('health')
export class HealthController {
  @Get()
  public getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: '@skam/api',
      timestamp: new Date().toISOString()
    }
  }
}
