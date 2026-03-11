import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { applyAppRuntime } from "./bootstrap";

function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  const required: string[] = [
    "NEXTAUTH_SECRET",
    "CORS_ORIGIN",
    "ADMIN_WHITELIST",
    "TURNSTILE_SECRET_KEY",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "GITHUB_CALLBACK_URL",
    "TRUST_PROXY_HEADERS",
    "HASH_SALT",
  ];
  const missing: string[] = required.filter(
    (key) => !String(process.env[key] ?? "").trim(),
  );
  const hasDatabaseUrl: boolean = Boolean(
    String(process.env.DATABASE_URL ?? "").trim(),
  );
  const hasTurso: boolean =
    Boolean(String(process.env.TURSO_DATABASE_URL ?? "").trim()) &&
    Boolean(String(process.env.TURSO_AUTH_TOKEN ?? "").trim());
  if (!hasDatabaseUrl && !hasTurso) {
    missing.push("DATABASE_URL or TURSO_DATABASE_URL+TURSO_AUTH_TOKEN");
  }
  if ((process.env.TURNSTILE_ALLOW_BYPASS ?? "false") === "true") {
    missing.push("TURNSTILE_ALLOW_BYPASS must be false in production");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required production env: ${missing.join(", ")}`);
  }
}

async function bootstrap(): Promise<void> {
  assertProductionEnv();
  const app = await NestFactory.create(AppModule);
  applyAppRuntime(app);
  app.enableShutdownHooks();
  const DEFAULT_PORT = 4000;
  const port: number = Number(process.env.PORT ?? String(DEFAULT_PORT));
  await app.listen(Number.isNaN(port) ? DEFAULT_PORT : port);
}

void bootstrap();
