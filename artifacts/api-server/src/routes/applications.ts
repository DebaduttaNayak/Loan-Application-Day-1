import { Router } from "express";
import {
  createApplication,
  getApplication,
  updateApplication,
  listApplications,
} from "../store.js";
import {
  CreateApplicationBody,
  UpdateApplicationParams,
  UpdateApplicationBody,
  SubmitApplicationParams,
  GetPreApprovalParams,
  GetApplicationParams,
} from "@workspace/api-zod";

const router = Router();

// POST /api/applications
router.post("/", async (req, res) => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { loanType, formData, currentStep } = parsed.data;
  const app = createApplication({
    loanType,
    formData: (formData as Record<string, unknown>) ?? {},
    currentStep: currentStep ?? 1,
  });
  return res.status(201).json(app);
});

// GET /api/applications/:id
router.get("/:id", async (req, res) => {
  const { id } = GetApplicationParams.parse(req.params);
  const app = getApplication(id);
  if (!app) return res.status(404).json({ error: "Application not found" });
  return res.json(app);
});

// PATCH /api/applications/:id
router.patch("/:id", async (req, res) => {
  const { id } = UpdateApplicationParams.parse(req.params);
  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const app = updateApplication(id, {
    currentStep: parsed.data.currentStep ?? undefined,
    formData: (parsed.data.formData as Record<string, unknown>) ?? undefined,
  });
  if (!app) return res.status(404).json({ error: "Application not found" });
  return res.json(app);
});

// POST /api/applications/:id/submit
router.post("/:id/submit", async (req, res) => {
  const { id } = SubmitApplicationParams.parse(req.params);
  const app = updateApplication(id, { status: "submitted" });
  if (!app) return res.status(404).json({ error: "Application not found" });
  const referenceNumber = `LS-${Date.now().toString(36).toUpperCase()}`;
  return res.json({
    id: app.id,
    referenceNumber,
    status: "submitted",
    message: `Application submitted successfully. Reference: ${referenceNumber}. We'll contact you within 24 hours.`,
  });
});

// GET /api/applications/:id/pre-approval
router.get("/:id/pre-approval", async (req, res) => {
  const { id } = GetPreApprovalParams.parse(req.params);
  const app = getApplication(id);
  if (!app) return res.status(404).json({ error: "Application not found" });

  const formData = app.formData;
  let score = 50;
  const creditScore = (formData.creditScore as string) ?? "";
  if (creditScore === "excellent") score += 30;
  else if (creditScore === "good") score += 20;
  else if (creditScore === "fair") score += 5;
  else score -= 10;

  const loanAmt = Number(formData.loanAmount ?? formData.amount ?? 0);
  const monthlyIncome = Number(
    formData.monthlyIncome ?? formData.monthlySalary ?? formData.monthlyProfit ?? 0
  );
  if (monthlyIncome > 0) {
    const ratio = loanAmt / (monthlyIncome * 12);
    if (ratio < 3) score += 15;
    else if (ratio < 5) score += 5;
    else score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  let verdict: "likely_approved" | "review_required" | "likely_rejected";
  if (score >= 65) verdict = "likely_approved";
  else if (score >= 40) verdict = "review_required";
  else verdict = "likely_rejected";

  const rateMap: Record<string, number> = { personal: 12.5, home: 8.75, business: 14.5 };
  const indicativeRate = rateMap[app.loanType] ?? 12.5;
  const maxAmount = Math.min(loanAmt, monthlyIncome > 0 ? monthlyIncome * 60 : loanAmt);

  const reasons: string[] =
    score >= 65
      ? ["Good credit profile", "Income-to-loan ratio acceptable"]
      : score >= 40
      ? ["Moderate credit profile — additional verification needed"]
      : ["Credit score below threshold", "Income documentation insufficient"];

  return res.json({
    applicationId: id,
    loanType: app.loanType,
    eligibilityScore: score,
    indicativeRate,
    maxAmount,
    verdict,
    reasons,
    applicantName: (formData.fullName as string | null) ?? null,
    requestedAmount: loanAmt || null,
    tenure: (formData.tenure as number | null) ?? null,
  });
});

export default router;
