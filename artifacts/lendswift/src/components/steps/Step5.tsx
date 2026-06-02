import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormStore } from "@/lib/store";
import { useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_SCORES = [
  { id: "excellent", label: "Excellent", range: "750+", color: "text-green-600" },
  { id: "good", label: "Good", range: "650-749", color: "text-blue-600" },
  { id: "fair", label: "Fair", range: "550-649", color: "text-yellow-600" },
  { id: "poor", label: "Poor", range: "<550", color: "text-red-600" },
];

const schema = z.object({
  monthlyExpenses: z.coerce.number().min(0, "Enter monthly expenses"),
  existingEmis: z.coerce.number().min(0),
  creditScore: z.string().min(1, "Select your credit score range"),
  bankName: z.string().min(2, "Bank name is required"),
  accountType: z.string().min(1, "Select account type"),
  yearsWithBank: z.coerce.number().min(0),
});

type FormData = z.infer<typeof schema>;

function formatINR(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export function Step5() {
  const store = useFormStore();
  const updateApp = useUpdateApplication();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      monthlyExpenses: store.monthlyExpenses || 20000,
      existingEmis: store.existingEmis || 0,
      creditScore: store.creditScore,
      bankName: store.bankName,
      accountType: store.accountType,
      yearsWithBank: store.yearsWithBank || 0,
    },
  });

  const monthlyExpenses = form.watch("monthlyExpenses");
  const existingEmis = form.watch("existingEmis");
  const monthlySalary = store.monthlySalary || store.monthlyProfit || 0;
  const disposableIncome = monthlySalary - (monthlyExpenses || 0) - (existingEmis || 0);

  async function onSubmit(data: FormData) {
    store.setFields({
      monthlyExpenses: data.monthlyExpenses,
      existingEmis: data.existingEmis,
      creditScore: data.creditScore,
      bankName: data.bankName,
      accountType: data.accountType,
      yearsWithBank: data.yearsWithBank,
    });
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 6, formData: { creditScore: data.creditScore, monthlyExpenses: data.monthlyExpenses, existingEmis: data.existingEmis } } },
        { onSuccess: () => store.nextStep() }
      );
    } else {
      store.nextStep();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Financial Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your financial profile helps us compute your loan capacity accurately.</p>
        </div>

        {/* Monthly Expenses Slider */}
        <FormField control={form.control} name="monthlyExpenses" render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Total Monthly Expenses</FormLabel>
              <span className="font-semibold text-primary">{formatINR(field.value)}</span>
            </div>
            <FormControl>
              <Slider min={0} max={200000} step={1000} value={[field.value]} onValueChange={([v]) => field.onChange(v)} data-testid="slider-expenses" />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground"><span>₹0</span><span>₹2L</span></div>
            <p className="text-xs text-muted-foreground">Include rent, utilities, groceries, transportation, etc.</p>
            <FormMessage />
          </FormItem>
        )} />

        {/* Existing EMIs */}
        <FormField control={form.control} name="existingEmis" render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center">
              <FormLabel>Existing Loan EMIs (total monthly)</FormLabel>
              <span className="font-semibold text-primary">{formatINR(field.value)}</span>
            </div>
            <FormControl>
              <Slider min={0} max={100000} step={500} value={[field.value]} onValueChange={([v]) => field.onChange(v)} data-testid="slider-emis" />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground"><span>₹0</span><span>₹1L</span></div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Disposable income indicator */}
        {monthlySalary > 0 && (
          <div className={cn("p-3 rounded-xl border text-sm", disposableIncome >= 15000 ? "bg-green-50 border-green-200 text-green-800" : disposableIncome >= 5000 ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-red-50 border-red-200 text-red-800")}>
            <span className="font-medium">Estimated Disposable Income: </span>
            {formatINR(Math.max(0, disposableIncome))}/month
            {disposableIncome < 5000 && <p className="text-xs mt-0.5">Low disposable income may affect your loan eligibility.</p>}
          </div>
        )}

        {/* Credit Score */}
        <FormField control={form.control} name="creditScore" render={({ field }) => (
          <FormItem>
            <FormLabel>Credit Score Range (CIBIL / Experian)</FormLabel>
            <FormControl>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CREDIT_SCORES.map((cs) => (
                  <button key={cs.id} type="button" data-testid={`credit-score-${cs.id}`}
                    onClick={() => field.onChange(cs.id)}
                    className={cn("p-3 rounded-xl border-2 text-center transition-all",
                      field.value === cs.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className={cn("text-sm font-bold", cs.color)}>{cs.label}</div>
                    <div className="text-xs text-muted-foreground">{cs.range}</div>
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Bank Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField control={form.control} name="bankName" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Primary Bank Name</FormLabel>
              <FormControl><Input {...field} data-testid="input-bank-name" placeholder="HDFC Bank, SBI, ICICI..." /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="accountType" render={({ field }) => (
            <FormItem>
              <FormLabel>Account Type</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger data-testid="select-account-type"><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="yearsWithBank" render={({ field }) => (
          <FormItem>
            <FormLabel>Years with this Bank</FormLabel>
            <FormControl><Input type="number" min={0} max={50} {...field} data-testid="input-years-bank" placeholder="3" className="max-w-[120px]" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => store.prevStep()} data-testid="btn-prev-step"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          <Button type="submit" className="flex-1" data-testid="btn-next-step" disabled={updateApp.isPending}>
            {updateApp.isPending ? "Saving..." : "Continue"}<ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
