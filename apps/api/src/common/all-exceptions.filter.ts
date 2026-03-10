import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common'

interface ErrorEnvelope {
  success: false
  error: string
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  public catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const response = context.getResponse<{
      status(code: number): { json(payload: ErrorEnvelope): void }
    }>()
    const request = context.getRequest<{ method?: string; url?: string }>()
    const status: number =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    const errorMessage: string =
      exception instanceof HttpException
        ? this.resolveHttpMessage(exception)
        : 'Có lỗi xảy ra, vui lòng thử lại sau'
    const reason: string =
      exception instanceof Error ? exception.stack ?? exception.message : String(exception)
    this.logger.error(
      `http_exception status=${status} method=${request.method ?? 'UNKNOWN'} url=${request.url ?? 'UNKNOWN'} reason=${reason}`
    )
    response.status(status).json({
      success: false,
      error: errorMessage
    })
  }

  private resolveHttpMessage(exception: HttpException): string {
    const raw = exception.getResponse()
    if (typeof raw === 'string') return raw
    if (typeof raw === 'object' && raw !== null && 'message' in raw) {
      const message = (raw as { message?: unknown }).message
      if (typeof message === 'string') return message
      if (Array.isArray(message)) {
        const merged: string = message
          .filter((item): item is string => typeof item === 'string')
          .join(', ')
        if (merged) return merged
      }
    }
    return exception.message || 'Yêu cầu không hợp lệ'
  }
}
