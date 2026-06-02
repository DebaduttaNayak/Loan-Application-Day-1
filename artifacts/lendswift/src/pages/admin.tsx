import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Trash2,
  Eye,
  IndianRupee,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface ApplicationRow {
  id: string;
  loanType: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  applicantName: string | null;
  loanAmount: number | null;
  monthlyIncome: number | null;
  creditScore: string | null;
  pan: string | null;
  eligibilityScore: number;
  verdict: "likely_approved" | "review_required" | "likely_rejected";
  documentCount: number;
  tenure: number | null;
  employmentType: string | null;
}

interface AdminData {
  stats: {
    total: number;
    submitted: number;
    draft: number;
    avgScore: number;
    likelyApproved: number;
    reviewRequired: number;
    likelyRejected: number;
  };
  applications: ApplicationRow[];
}

function formatINR(n: number | null | undefined) {
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const VERDICT_CONFIG = {
  likely_approved: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: "Approved",
    cls: "bg-green-100 text-green-700 border-green-200",
  },
  review_required: {
    icon: <AlertCircle className="w-4 h-4" />,
    label: "Review",
    cls: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  likely_rejected: {
    icon: <XCircle className="w-4 h-4" />,
    label: "Rejected",
    cls: "bg-red-100 text-red-700 border-red-200",
  },
};

const LOAN_TYPE_LABEL: Record<string, string> = {
  personal: "Personal",
  home: "Home",
  business: "Business",
};

const CREDIT_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 65 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-gray-700">{score}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "submitted" | "draft">("all");
  const [verdictFilter, setVerdictFilter] = useState<"all" | "likely_approved" | "review_required" | "likely_rejected">("all");

  const { data, isLoading, refetch, isFetching } = useQuery<AdminData>({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/admin/applications`);
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${import.meta.env.BASE_URL}api/admin/applications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      setDeletingId(null);
    },
  });

  const apps = data?.applications ?? [];
  const stats = data?.stats;

  const filtered = apps.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (verdictFilter !== "all" && a.verdict !== verdictFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">LendSwift Admin</h1>
              <p className="text-xs text-gray-400">Loan Officer Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs">
                ← Back to App
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Applications"
              value={stats?.total ?? 0}
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              color="bg-indigo-50"
            />
            <StatCard
              label="Submitted"
              value={stats?.submitted ?? 0}
              sub={`${stats?.draft ?? 0} in draft`}
              icon={<FileText className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <StatCard
              label="Avg Eligibility"
              value={`${stats?.avgScore ?? 0}/100`}
              sub={`${stats?.likelyApproved ?? 0} likely approved`}
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              color="bg-green-50"
            />
            <StatCard
              label="Needs Review"
              value={stats?.reviewRequired ?? 0}
              sub={`${stats?.likelyRejected ?? 0} likely rejected`}
              icon={<Clock className="w-5 h-5 text-yellow-600" />}
              color="bg-yellow-50"
            />
          </div>
        )}

        {/* Verdict breakdown bar */}
        {!isLoading && stats && stats.total > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Portfolio breakdown
            </p>
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
              {stats.likelyApproved > 0 && (
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(stats.likelyApproved / stats.total) * 100}%` }}
                  title={`Approved: ${stats.likelyApproved}`}
                />
              )}
              {stats.reviewRequired > 0 && (
                <div
                  className="bg-yellow-400 transition-all"
                  style={{ width: `${(stats.reviewRequired / stats.total) * 100}%` }}
                  title={`Review: ${stats.reviewRequired}`}
                />
              )}
              {stats.likelyRejected > 0 && (
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${(stats.likelyRejected / stats.total) * 100}%` }}
                  title={`Rejected: ${stats.likelyRejected}`}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2.5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Approved ({stats.likelyApproved})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                Review ({stats.reviewRequired})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Rejected ({stats.likelyRejected})
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500 font-medium">Status:</span>
          {(["all", "submitted", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <span className="text-xs text-gray-400 mx-1">|</span>
          <span className="text-xs text-gray-500 font-medium">Verdict:</span>
          {(["all", "likely_approved", "review_required", "likely_rejected"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVerdictFilter(v)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                verdictFilter === v
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {v === "all"
                ? "All"
                : v === "likely_approved"
                ? "Approved"
                : v === "review_required"
                ? "Review"
                : "Rejected"}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No applications found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-500 pl-6">Applicant</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Loan</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Amount</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Credit</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Score</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Verdict</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Docs</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Applied</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => {
                  const vc = VERDICT_CONFIG[app.verdict];
                  return (
                    <TableRow key={app.id} className="hover:bg-gray-50/60 transition-colors">
                      <TableCell className="pl-6">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {app.applicantName ?? (
                              <span className="text-gray-400 italic font-normal">Unnamed</span>
                            )}
                          </p>
                          {app.pan && (
                            <p className="text-xs text-gray-400 font-mono">{app.pan}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {LOAN_TYPE_LABEL[app.loanType] ?? app.loanType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-800 flex items-center gap-0.5">
                          <IndianRupee className="w-3 h-3 text-gray-400" />
                          {app.loanAmount ? formatINR(app.loanAmount).replace("₹", "") : "—"}
                        </span>
                        {app.tenure && (
                          <span className="text-xs text-gray-400">{app.tenure}mo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.creditScore ? (
                          <span className="text-xs text-gray-700">
                            {CREDIT_LABEL[app.creditScore] ?? app.creditScore}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ScoreBar score={app.eligibilityScore} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${vc.cls}`}
                        >
                          {vc.icon}
                          {vc.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            app.status === "submitted"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {app.status === "submitted" ? "Submitted" : `Draft · Step ${app.currentStep}/8`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{app.documentCount}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(app.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/summary/${app.id}`}>
                            <Button variant="ghost" size="icon" className="w-7 h-7" title="View pre-approval">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            </Button>
                          </Link>
                          {deletingId === app.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => deleteMutation.mutate(app.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs px-2"
                                onClick={() => setDeletingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              title="Delete"
                              onClick={() => setDeletingId(app.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
