import { Router } from "express";
import { listApplications, deleteApplication, countDocuments } from "../store.js";

const router = Router();

function eligibilityScore(formData: Record<string, unknown>): number {
  let score = 50;
  const creditScore = (formData.creditScore as string) ?? "";
  if (creditScore === "excellent") score += 30;
  else if (creditScore === "good") score += 20;
  else if (creditScore === "fair") score += 5;
  else if (creditScore === "poor") score -= 10;

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
  return Math.max(0, Math.min(100, score));
}

// GET /api/admin/applications
router.get("/applications", (_req, res) => {
  const apps = listApplications();

  const results = apps.map((app) => {
    const score = eligibilityScore(app.formData);
    const verdict =
      score >= 65 ? "likely_approved" : score >= 40 ? "review_required" : "likely_rejected";

    return {
      id: app.id,
      loanType: app.loanType,
      status: app.status,
      currentStep: app.currentStep,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      applicantName: (app.formData.fullName as string | null) ?? null,
      loanAmount: Number(app.formData.loanAmount ?? app.formData.amount ?? 0) || null,
      monthlyIncome:
        Number(
          app.formData.monthlyIncome ??
            app.formData.monthlySalary ??
            app.formData.monthlyProfit ??
            0
        ) || null,
      creditScore: (app.formData.creditScore as string | null) ?? null,
      pan: (app.formData.pan as string | null) ?? null,
      eligibilityScore: score,
      verdict,
      documentCount: countDocuments(app.id),
      tenure: (app.formData.tenure as number | null) ?? null,
      employmentType: (app.formData.employmentType as string | null) ?? null,
    };
  });

  const stats = {
    total: results.length,
    submitted: results.filter((a) => a.status === "submitted").length,
    draft: results.filter((a) => a.status === "draft").length,
    avgScore:
      results.length > 0
        ? Math.round(results.reduce((s, a) => s + a.eligibilityScore, 0) / results.length)
        : 0,
    likelyApproved: results.filter((a) => a.verdict === "likely_approved").length,
    reviewRequired: results.filter((a) => a.verdict === "review_required").length,
    likelyRejected: results.filter((a) => a.verdict === "likely_rejected").length,
  };

  return res.json({ stats, applications: results });
});

// DELETE /api/admin/applications/:id
router.delete("/applications/:id", (req, res) => {
  const { id } = req.params;
  const ok = deleteApplication(id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  return res.json({ ok: true });
});

export default router;
