import { Router } from "express";
import { createDocument, listDocuments } from "../store.js";
import { UploadDocumentParams, UploadDocumentBody, ListDocumentsParams } from "@workspace/api-zod";

const router = Router({ mergeParams: true });

// POST /api/documents/:applicationId
router.post("/:applicationId", async (req, res) => {
  const { applicationId } = UploadDocumentParams.parse(req.params);
  const parsed = UploadDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { docType, fileName, fileSize, mimeType } = parsed.data;
  const doc = createDocument({ applicationId, docType, fileName, fileSize, mimeType });
  return res.status(201).json(doc);
});

// GET /api/documents/:applicationId
router.get("/:applicationId", async (req, res) => {
  const { applicationId } = ListDocumentsParams.parse(req.params);
  return res.json(listDocuments(applicationId));
});

export default router;
