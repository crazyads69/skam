import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import helmet from "helmet";
import { json } from "express";

export function applyAppRuntime(app: INestApplication): void {
  const isProduction: boolean = process.env.NODE_ENV === "production";
  const corsOriginRaw: string | undefined = process.env.CORS_ORIGIN;
  if (isProduction && !corsOriginRaw?.trim()) {
    throw new Error("CORS_ORIGIN is required in production");
  }
  // Enable Express trust proxy when behind Vercel/Cloudflare
  if ((process.env.TRUST_PROXY_HEADERS ?? "false") === "true") {
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.getInstance().set("trust proxy", 1);
  }
  const HSTS_MAX_AGE_SECONDS = 31_536_000; // 1 year
  const JSON_BODY_LIMIT = "1mb";
  app.use(
    helmet({
      contentSecurityPolicy: false, // API does not serve HTML
      hsts: isProduction
        ? { maxAge: HSTS_MAX_AGE_SECONDS, includeSubDomains: true }
        : false,
    }),
  );
  app.use(json({ limit: JSON_BODY_LIMIT }));
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  const corsOrigins: string[] = (corsOriginRaw ?? "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });
}
