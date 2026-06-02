import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const applicationsTable = sqliteTable("applications", {
  id: text("id").primaryKey(),
  loanType: text("loan_type").notNull(),
  currentStep: integer("current_step").notNull().default(1),
  status: text("status").notNull().default("draft"),
  formData: text("form_data"), // stored as JSON string
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
