import { useParams, useLocation } from "wouter";
import { useGetPreApproval, getGetPreApprovalQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormStore } from "@/lib/store";
import { CheckCircle2, XCircle, AlertCircle, IndianRupee, Download, Home } from "lucide-react";
import { Link } from "wouter";

function formatINR(n: number | undefined | null) {
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function calcEMI(principal: number, ratePerYear: number, months: number): number {
  const r = ratePerYear / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

const VERDICT_CONFIG = {
  likely_approved: {
    icon: <CheckCircle2 className="w-10 h-10 text-green-600" />,
    label: "Likely Approved",
    bg: "bg-green-50 border-green-200",
    text: "text-green-800",
    badge: "bg-green-100 text-green-700 border-green-300",
    color: "#16a34a",
  },
  review_required: {
    icon: <AlertCircle className="w-10 h-10 text-yellow-600" />,
    label: "Review Required",
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-800",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
    color: "#ca8a04",
  },
  likely_rejected: {
    icon: <XCircle className="w-10 h-10 text-red-600" />,
    label: "Further Review Needed",
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    badge: "bg-red-100 text-red-700 border-red-300",
    color: "#dc2626",
  },
};

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: "Personal Loan",
  home: "Home Loan",
  business: "Business Loan",
};

export default function Summary() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const store = useFormStore();

  const { data: summary, isLoading, error } = useGetPreApproval(id, {
    query: { enabled: !!id, queryKey: getGetPreApprovalQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Could not load summary</h2>
          <p className="text-muted-foreground text-sm">The application summary could not be retrieved.</p>
          <Link href="/"><Button variant="outline"><Home className="w-4 h-4 mr-2" />Return Home</Button></Link>
        </div>
      </div>
    );
  }

  const verdict = VERDICT_CONFIG[summary.verdict] || VERDICT_CONFIG.review_required;
  const emi = summary.requestedAmount && summary.indicativeRate && summary.tenure
    ? calcEMI(summary.requestedAmount, summary.indicativeRate, summary.tenure)
    : null;

  // Gauge render
  const score = summary.eligibilityScore;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 65 ? "#16a34a" : score >= 40 ? "#ca8a04" : "#dc2626";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">LendSwift</span>
          </div>
          <Link href="/"><Button variant="outline" size="sm"><Home className="w-3 h-3 mr-2" />Home</Button></Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Pre-Approval Summary</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {summary.applicantName ? `Application for ${summary.applicantName}` : "Loan Application Assessment"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Reference: {id?.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Verdict Banner */}
        <div className={`p-5 rounded-2xl border-2 ${verdict.bg} text-center mb-6`} data-testid="verdict-banner">
          <div className="flex justify-center mb-3">{verdict.icon}</div>
          <div className={`text-lg font-bold ${verdict.text}`}>{verdict.label}</div>
          <p className={`text-sm mt-1 ${verdict.text} opacity-80`}>
            {summary.verdict === "likely_approved"
              ? "Your application meets our preliminary eligibility criteria."
              : summary.verdict === "review_required"
              ? "Your application requires additional verification by our team."
              : "Your profile needs improvement before approval is possible."}
          </p>
        </div>

        {/* Score Gauge */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Eligibility Score</h2>
          <div className="flex justify-center">
            <svg width="140" height="100" viewBox="0 0 140 90">
              <circle cx="70" cy="70" r="54" fill="none" stroke="hsl(var(--border))" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={circumference / 2} strokeLinecap="round" transform="rotate(-180 70 70)" />
              <circle cx="70" cy="70" r="54" fill="none" stroke={scoreColor} strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={circumference / 2 + (circumference / 2) * (1 - score / 100)}
                strokeLinecap="round" transform="rotate(-180 70 70)"
                style={{ transition: "stroke-dashoffset 1s ease" }}
              />
              <text x="70" y="62" textAnchor="middle" fontSize="26" fontWeight="bold" fill={scoreColor}>{score}</text>
              <text x="70" y="78" textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">out of 100</text>
            </svg>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 px-4">
            <span>0 — Ineligible</span>
            <span>100 — Excellent</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Indicative Rate</div>
            <div className="text-2xl font-bold text-primary" data-testid="indicative-rate">{summary.indicativeRate}%</div>
            <div className="text-xs text-muted-foreground">per annum</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Max Eligible Amount</div>
            <div className="text-xl font-bold text-foreground" data-testid="max-amount">{formatINR(summary.maxAmount)}</div>
            <div className="text-xs text-muted-foreground">indicative offer</div>
          </div>
        </div>

        {/* Loan Details */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">{LOAN_TYPE_LABELS[summary.loanType] || summary.loanType} Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Requested Amount</span><span className="font-medium">{formatINR(summary.requestedAmount)}</span></div>
            {summary.tenure && <div className="flex justify-between"><span className="text-muted-foreground">Tenure</span><span className="font-medium">{summary.tenure} months</span></div>}
            {emi && <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground font-medium">Estimated EMI</span><span className="font-bold text-primary">{formatINR(emi)}/month</span></div>}
          </div>
        </div>

        {/* Reasons */}
        {summary.reasons && summary.reasons.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold mb-3">Assessment Basis</h3>
            <ul className="space-y-2">
              {summary.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${summary.verdict === "likely_approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-muted/50 border border-border rounded-xl p-4 mb-6 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Important Disclaimer</p>
          <p>This pre-approval summary is indicative only and does not constitute a loan offer. Final approval is subject to verification of documents, credit bureau assessment, and LendSwift's credit policy at the time of disbursement. Interest rates are subject to change.</p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full" variant="outline" data-testid="btn-download-summary">
            <Download className="w-4 h-4 mr-2" />Download Summary (PDF)
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              store.resetForm();
              setLocation("/apply");
            }}
            data-testid="btn-new-application"
          >
            Start a New Application
          </Button>
          <Link href="/">
            <Button variant="ghost" className="w-full" data-testid="btn-home">
              <Home className="w-4 h-4 mr-2" />Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
