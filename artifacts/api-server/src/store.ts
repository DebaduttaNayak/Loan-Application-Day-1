import { randomUUID } from "crypto";

export interface Application {
  id: string;
  loanType: string;
  status: "draft" | "submitted";
  currentStep: number;
  formData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  applicationId: string;
  docType: string;
  fileName: string;
  fileSize: number;
  mimeType: string | null;
  createdAt: string;
}

const applications = new Map<string, Application>();
const documents = new Map<string, Document>();

function now() {
  return new Date().toISOString();
}

// --- Applications ---

export function createApplication(data: {
  loanType: string;
  formData?: Record<string, unknown>;
  currentStep?: number;
}): Application {
  const app: Application = {
    id: randomUUID(),
    loanType: data.loanType,
    status: "draft",
    currentStep: data.currentStep ?? 1,
    formData: data.formData ?? {},
    createdAt: now(),
    updatedAt: now(),
  };
  applications.set(app.id, app);
  return app;
}

export function getApplication(id: string): Application | undefined {
  return applications.get(id);
}

export function updateApplication(
  id: string,
  updates: { currentStep?: number; formData?: Record<string, unknown>; status?: "draft" | "submitted" }
): Application | undefined {
  const app = applications.get(id);
  if (!app) return undefined;
  if (updates.currentStep != null) app.currentStep = updates.currentStep;
  if (updates.formData != null) app.formData = updates.formData;
  if (updates.status != null) app.status = updates.status;
  app.updatedAt = now();
  applications.set(id, app);
  return app;
}

export function deleteApplication(id: string): boolean {
  if (!applications.has(id)) return false;
  applications.delete(id);
  // cascade delete documents
  for (const [docId, doc] of documents) {
    if (doc.applicationId === id) documents.delete(docId);
  }
  return true;
}

export function listApplications(): Application[] {
  return Array.from(applications.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// --- Documents ---

export function createDocument(data: {
  applicationId: string;
  docType: string;
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
}): Document {
  const doc: Document = {
    id: randomUUID(),
    applicationId: data.applicationId,
    docType: data.docType,
    fileName: data.fileName,
    fileSize: data.fileSize,
    mimeType: data.mimeType ?? null,
    createdAt: now(),
  };
  documents.set(doc.id, doc);
  return doc;
}

export function listDocuments(applicationId: string): Document[] {
  return Array.from(documents.values()).filter(
    (d) => d.applicationId === applicationId
  );
}

export function countDocuments(applicationId: string): number {
  return listDocuments(applicationId).length;
}
