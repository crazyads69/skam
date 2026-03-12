import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const scamCases = sqliteTable(
  "ScamCase",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: text("createdAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updatedAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    bankIdentifier: text("bankIdentifier").notNull(),
    bankName: text("bankName").notNull(),
    bankCode: text("bankCode").notNull(),
    amount: real("amount"),
    scammerName: text("scammerName"),
    originalDescription: text("originalDescription").notNull(),
    refinedDescription: text("refinedDescription"),
    status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED"] })
      .notNull()
      .default("PENDING"),
    approvedAt: text("approvedAt"),
    approvedBy: text("approvedBy"),
    rejectionReason: text("rejectionReason"),
    submitterFingerprint: text("submitterFingerprint"),
    submitterIpHash: text("submitterIpHash"),
    viewCount: integer("viewCount").notNull().default(0),
    profileId: text("profileId").references(() => scammerProfiles.id),
  },
  (table) => ({
    bankIdCodeIdx: index("ScamCase_bankIdentifier_bankCode_idx").on(
      table.bankIdentifier,
      table.bankCode,
    ),
    statusIdx: index("ScamCase_status_idx").on(table.status),
    statusCreatedAtIdx: index("ScamCase_status_createdAt_idx").on(
      table.status,
      table.createdAt,
    ),
    createdAtIdx: index("ScamCase_createdAt_idx").on(table.createdAt),
    profileIdIdx: index("ScamCase_profileId_idx").on(table.profileId),
    fingerprintIdx: index("ScamCase_submitterFingerprint_idx").on(
      table.submitterFingerprint,
    ),
    ipHashIdx: index("ScamCase_submitterIpHash_idx").on(table.submitterIpHash),
  }),
);

export const scammerProfiles = sqliteTable(
  "ScammerProfile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    bankIdentifier: text("bankIdentifier").notNull(),
    bankCode: text("bankCode").notNull(),
    scammerName: text("scammerName"),
    totalCases: integer("totalCases").notNull().default(0),
    totalAmount: real("totalAmount").notNull().default(0),
    firstReportedAt: text("firstReportedAt").notNull(),
    lastReportedAt: text("lastReportedAt").notNull(),
  },
  (table) => ({
    bankIdCodeUniq: uniqueIndex(
      "ScammerProfile_bankIdentifier_bankCode_key",
    ).on(table.bankIdentifier, table.bankCode),
  }),
);

export const evidenceFiles = sqliteTable(
  "EvidenceFile",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: text("createdAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updatedAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    caseId: text("caseId")
      .notNull()
      .references(() => scamCases.id, { onDelete: "cascade" }),
    fileType: text("fileType").notNull(),
    fileKey: text("fileKey").notNull(),
    fileName: text("fileName"),
    fileSize: integer("fileSize"),
    fileHash: text("fileHash"),
    isApproved: integer("isApproved", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => ({
    caseIdIdx: index("EvidenceFile_caseId_idx").on(table.caseId),
    fileHashIdx: index("EvidenceFile_fileHash_idx").on(table.fileHash),
  }),
);

export const socialLinks = sqliteTable(
  "SocialLink",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    createdAt: text("createdAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedAt: text("updatedAt")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    platform: text("platform", {
      enum: ["FACEBOOK", "ZALO", "TELEGRAM", "X", "TIKTOK", "INSTAGRAM"],
    }).notNull(),
    url: text("url").notNull(),
    username: text("username"),
    caseId: text("caseId").references(() => scamCases.id, {
      onDelete: "cascade",
    }),
    profileId: text("profileId").references(() => scammerProfiles.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    caseIdIdx: index("SocialLink_caseId_idx").on(table.caseId),
    profileIdIdx: index("SocialLink_profileId_idx").on(table.profileId),
  }),
);

export const systemStats = sqliteTable("SystemStats", {
  id: text("id").primaryKey().default("singleton"),
  totalCases: integer("totalCases").notNull().default(0),
  totalApprovedCases: integer("totalApprovedCases").notNull().default(0),
  totalPendingCases: integer("totalPendingCases").notNull().default(0),
  totalScammerProfiles: integer("totalScammerProfiles").notNull().default(0),
  totalScamAmount: real("totalScamAmount").notNull().default(0),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Relations
export const scamCasesRelations = relations(scamCases, ({ one, many }) => ({
  profile: one(scammerProfiles, {
    fields: [scamCases.profileId],
    references: [scammerProfiles.id],
  }),
  evidenceFiles: many(evidenceFiles),
  socialLinks: many(socialLinks),
}));

export const scammerProfilesRelations = relations(
  scammerProfiles,
  ({ many }) => ({
    cases: many(scamCases),
    socialLinks: many(socialLinks),
  }),
);

export const evidenceFilesRelations = relations(evidenceFiles, ({ one }) => ({
  case: one(scamCases, {
    fields: [evidenceFiles.caseId],
    references: [scamCases.id],
  }),
}));

export const socialLinksRelations = relations(socialLinks, ({ one }) => ({
  case: one(scamCases, {
    fields: [socialLinks.caseId],
    references: [scamCases.id],
  }),
  profile: one(scammerProfiles, {
    fields: [socialLinks.profileId],
    references: [scammerProfiles.id],
  }),
}));

// Inferred types
export type ScamCaseRow = typeof scamCases.$inferSelect;
export type NewScamCase = typeof scamCases.$inferInsert;
export type EvidenceFileRow = typeof evidenceFiles.$inferSelect;
export type SocialLinkRow = typeof socialLinks.$inferSelect;
export type ScammerProfileRow = typeof scammerProfiles.$inferSelect;
export type SystemStatsRow = typeof systemStats.$inferSelect;
