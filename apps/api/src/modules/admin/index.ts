import { Elysia } from "elysia";
import { adminAuth } from "../../plugins/admin-auth";
import { adminService } from "./service";
import { banksService } from "../banks/service";
import { ApproveCaseBody, RejectCaseBody, RefineCaseBody, AdminCasesQuery } from "./model";

export const adminModule = new Elysia({ prefix: "/admin" })
  .use(adminAuth)
  .get("/cases", async ({ query }) => {
    return adminService.listCases(query.status, query.page ?? 1, Math.min(100, query.pageSize ?? 20));
  }, { query: AdminCasesQuery })
  .get("/cases/pending", async () => adminService.listCases("PENDING", 1, 50))
  .get("/cases/:id", async ({ params }) => {
    const data = await adminService.getCaseById(params.id);
    return { success: true, data };
  })
  .patch("/cases/:id/approve", async ({ params, body, admin }) => {
    const data = await adminService.approveCase(params.id, admin.username, body);
    return { success: true, data };
  }, { body: ApproveCaseBody })
  .patch("/cases/:id/reject", async ({ params, body, admin }) => {
    const data = await adminService.rejectCase(params.id, admin.username, body);
    return { success: true, data };
  }, { body: RejectCaseBody })
  .patch("/cases/:id/refine", async ({ params, body }) => {
    const data = await adminService.refineCase(params.id, body);
    return { success: true, data };
  }, { body: RefineCaseBody })
  .delete("/cases/:id", async ({ params }) => {
    await adminService.deleteCase(params.id);
    return { success: true, data: { deleted: true } };
  })
  .post("/banks/refresh", async () => {
    await banksService.refreshBanks();
    return { success: true, data: { refreshed: true } };
  })
  .get("/analytics", async () => {
    const data = await adminService.getAdminAnalytics();
    return { success: true, data };
  });
