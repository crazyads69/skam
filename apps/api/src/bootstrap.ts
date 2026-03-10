import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import helmet from "helmet";

export function applyAppRuntime(app: INestApplication): void {
  const isProduction: boolean = process.env.NODE_ENV === "production";
  const corsOriginRaw: string | undefined = process.env.CORS_ORIGIN;
  if (isProduction && !corsOriginRaw?.trim()) {
    throw new Error("CORS_ORIGIN is required in production");
  }
  app.use(helmet());
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
