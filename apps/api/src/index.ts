import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { HttpError } from "./common/error";
import { healthModule } from "./modules/health";
import { casesModule } from "./modules/cases";
import { adminModule } from "./modules/admin";
import { authModule } from "./modules/auth";
import { analyticsModule } from "./modules/analytics";
import { banksModule } from "./modules/banks";
import { profilesModule } from "./modules/profiles";
import { storageModule } from "./modules/storage";

const port = Number(process.env.PORT ?? 4000);

const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const app = new Elysia({ prefix: "/api/v1" })
  .use(
    cors({
      origin: corsOrigins,
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Turnstile-Token",
        "X-Requested-With",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .onError(({ code, error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return { success: false, error: error.message };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { success: false, error: error.message || "Yêu cầu không hợp lệ" };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, error: "Không tìm thấy" };
    }
    if (code === "PARSE") {
      set.status = 400;
      return { success: false, error: "Dữ liệu gửi lên không hợp lệ" };
    }
    console.error("Unhandled error:", error);
    set.status = 500;
    return { success: false, error: "Có lỗi xảy ra, vui lòng thử lại sau" };
  })
  .use(healthModule)
  .use(casesModule)
  .use(adminModule)
  .use(authModule)
  .use(analyticsModule)
  .use(banksModule)
  .use(profilesModule)
  .use(storageModule);

app.listen(port);

console.log(`🚀 SKAM API running at http://localhost:${port}/api/v1`);

export type App = typeof app;
