import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from './app.module'

describe('API E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api/v1')
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /api/v1/health', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('POST /api/v1/cases then GET /api/v1/analytics/summary', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .send({
        bankIdentifier: '1122334455',
        bankName: 'Nguyen Van C',
        bankCode: 'VCB',
        originalDescription: 'Toi bi lua dao thong qua hinh thuc mua ve xem phim online va da chuyen khoan truoc khi nhan ma ve.'
      })
    expect(createResponse.status).toBe(201)
    expect(createResponse.body.success).toBe(true)
    const summaryResponse = await request(app.getHttpServer()).get('/api/v1/analytics/summary')
    expect(summaryResponse.status).toBe(200)
    expect(summaryResponse.body.success).toBe(true)
    expect(summaryResponse.body.data.totalCases).toBeGreaterThan(0)
  })
})
