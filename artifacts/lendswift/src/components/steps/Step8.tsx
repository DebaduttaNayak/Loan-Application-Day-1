import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useFormStore } from "@/lib/store";
import { useSubmitApplication, useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[55%]">{String(value)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-2">{children}</div>
    </div>
  );
}

function formatINR(n: number | undefined | null) {
  if (!n) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Crore`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} Lakh`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

const LOAN_TYPE_LABELS: Record<string, string> = {
  personal: "Personal Loan",
  home: "Home Loan",
  business: "Business Loan",
};

const EMP_TYPE_LABELS: Record<string, string> = {
  salaried: "Salaried",
  self_employed_professional: "Self-Employed Professional",
  self_employed_business: "Self-Employed Business",
  government: "Government / PSU",
};

export function Step8() {
  const [, setLocation] = useLocation();
  const store = useFormStore();
  const submitApp = useSubmitApplication();
  const updateApp = useUpdateApplication();

  const [declaredTrue, setDeclaredTrue] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [creditConsent, setCreditConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = declaredTrue && agreedTerms && creditConsent;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!store.applicationId) {
      alert("No application ID found. Please start the application again.");
      return;
    }

    // Final save before submit
    await new Promise<void>((resolve) => {
      updateApp.mutate(
        {
          id: store.applicationId!,
          data: {
            currentStep: 8,
            formData: {
              fullName: store.fullName,
              loanType: store.loanType,
              amount: store.amount,
              tenure: store.tenure,
              creditScore: store.creditScore,
              monthlySalary: store.monthlySalary || store.monthlyProfit,
              monthlyExpenses: store.monthlyExpenses,
              existingEmis: store.existingEmis,
            },
          },
        },
        { onSuccess: () => resolve(), onError: () => resolve() }
      );
    });

    submitApp.mutate(
      { id: store.applicationId! },
      {
        onSuccess: (result) => {
          setSubmitted(true);
          setTimeout(() => {
            setLocation(`/summary/${store.applicationId}`);
          }, 1500);
        },
      }
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground">Redirecting to your pre-approval summary...</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Review & Submit</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please review all information before submitting your application.</p>
      </div>

      {/* Loan Details */}
      <Section title="Loan Details">
        <InfoRow label="Loan Type" value={LOAN_TYPE_LABELS[store.loanType || ""] || store.loanType} />
        <InfoRow label="Loan Amount" value={formatINR(store.amount)} />
        <InfoRow label="Tenure" value={`${store.tenure} months`} />
        <InfoRow label="Purpose" value={store.purpose} />
      </Section>

      {/* Personal Info */}
      <Section title="Personal Information">
        <InfoRow label="Full Name" value={store.fullName} />
        <InfoRow label="Date of Birth" value={store.dob} />
        <InfoRow label="Gender" value={store.gender ? store.gender.charAt(0).toUpperCase() + store.gender.slice(1) : undefined} />
        <InfoRow label="Marital Status" value={store.maritalStatus ? store.maritalStatus.charAt(0).toUpperCase() + store.maritalStatus.slice(1) : undefined} />
        <InfoRow label="PAN" value={store.pan ? `${store.pan.slice(0, 5)}XXXXX` : undefined} />
        <InfoRow label="Mobile" value={store.mobile ? `XXXXXX${store.mobile.slice(-4)}` : undefined} />
        <InfoRow label="Email" value={store.email} />
        <div className="flex justify-between py-1.5 text-sm">
          <span className="text-muted-foreground">PAN Verified</span>
          <Badge variant={store.isPanVerified ? "outline" : "secondary"} className={store.isPanVerified ? "text-green-600 border-green-300" : ""}>{store.isPanVerified ? "Yes" : "Not verified"}</Badge>
        </div>
        <div className="flex justify-between py-1.5 text-sm border-b border-border/50">
          <span className="text-muted-foreground">Aadhaar Verified</span>
          <Badge variant={store.isAadhaarVerified ? "outline" : "secondary"} className={store.isAadhaarVerified ? "text-green-600 border-green-300" : ""}>{store.isAadhaarVerified ? "Yes" : "Not verified"}</Badge>
        </div>
      </Section>

      {/* Employment */}
      <Section title="Employment & Income">
        <InfoRow label="Employment Type" value={EMP_TYPE_LABELS[store.employmentType] || store.employmentType} />
        {store.companyName && <InfoRow label="Employer" value={store.companyName} />}
        {store.businessName && <InfoRow label="Business" value={store.businessName} />}
        {store.department && <InfoRow label="Department" value={store.department} />}
        <InfoRow label="Monthly Income" value={formatINR(store.monthlySalary || store.monthlyProfit)} />
        <InfoRow label="ITR Filed" value={store.itrFiled ? "Yes" : "No"} />
      </Section>

      {/* Address */}
      <Section title="Address">
        <InfoRow label="Current Address" value={store.currentAddress} />
        <InfoRow label="City" value={store.city} />
        <InfoRow label="State" value={store.state} />
        <InfoRow label="Pincode" value={store.pincode} />
        <InfoRow label="Permanent Address" value={store.isPermanentSame ? "Same as current" : store.permanentAddress} />
      </Section>

      {/* Financial */}
      <Section title="Financial Profile">
        <InfoRow label="Monthly Expenses" value={formatINR(store.monthlyExpenses)} />
        <InfoRow label="Existing EMIs" value={formatINR(store.existingEmis)} />
        <InfoRow label="Credit Score" value={store.creditScore ? store.creditScore.charAt(0).toUpperCase() + store.creditScore.slice(1) : undefined} />
        <InfoRow label="Primary Bank" value={store.bankName} />
      </Section>

      {/* Co-applicant */}
      {store.hasCoApplicant && (
        <Section title="Co-applicant">
          <InfoRow label="Name" value={store.coApplicantName} />
          <InfoRow label="Relation" value={store.coApplicantRelation} />
          <InfoRow label="Monthly Income" value={formatINR(store.coApplicantMonthlyIncome)} />
        </Section>
      )}

      {/* E-signature */}
      {store.signature && (
        <Section title="E-Signature">
          <div className="py-2">
            <img src={store.signature} alt="Your signature" className="h-20 object-contain border border-border rounded-lg bg-white p-2" />
            <p className="text-xs text-muted-foreground mt-1">Digitally captured e-signature</p>
          </div>
        </Section>
      )}

      {/* Consent */}
      <div className="space-y-4 p-4 rounded-xl border border-border">
        <h3 className="font-semibold text-sm">Declarations & Consent</h3>

        <div className="flex items-start gap-3">
          <Checkbox id="declared" checked={declaredTrue} onCheckedChange={(c) => setDeclaredTrue(!!c)} data-testid="checkbox-declared" />
          <Label htmlFor="declared" className="text-sm leading-relaxed">
            I declare that all information provided in this application is true, correct, and complete to the best of my knowledge.
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="terms" checked={agreedTerms} onCheckedChange={(c) => setAgreedTerms(!!c)} data-testid="checkbox-terms" />
          <Label htmlFor="terms" className="text-sm leading-relaxed">
            I agree to LendSwift's <span className="text-primary underline cursor-pointer">Terms and Conditions</span> and <span className="text-primary underline cursor-pointer">Privacy Policy</span>.
          </Label>
        </div>

        <Separator />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Optional Consents</p>

        <div className="flex items-start gap-3">
          <Checkbox id="credit" checked={creditConsent} onCheckedChange={(c) => setCreditConsent(!!c)} data-testid="checkbox-credit-consent" />
          <Label htmlFor="credit" className="text-sm leading-relaxed">
            I consent to LendSwift fetching my credit bureau report (CIBIL/Experian) for loan assessment purposes. <span className="font-medium text-foreground">Required for processing.</span>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="marketing" checked={marketingConsent} onCheckedChange={(c) => setMarketingConsent(!!c)} data-testid="checkbox-marketing" />
          <Label htmlFor="marketing" className="text-sm leading-relaxed text-muted-foreground">
            I consent to receiving promotional offers and product updates via SMS/email/WhatsApp. (Optional)
          </Label>
        </div>
      </div>

      {!canSubmit && (
        <p className="text-sm text-muted-foreground text-center">
          Please check the required declarations to submit your application.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => store.prevStep()} data-testid="btn-prev-step"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Button
          type="button"
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={!canSubmit || submitApp.isPending}
          onClick={handleSubmit}
          data-testid="btn-submit-application"
        >
          {submitApp.isPending ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Submitting...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" />Submit Application</>
          )}
        </Button>
      </div>
    </div>
  );
}
