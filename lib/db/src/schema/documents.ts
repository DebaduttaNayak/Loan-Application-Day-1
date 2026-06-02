import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const documentsTable = sqliteTable("documents", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull(),
  docType: text("doc_type").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  createdAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
