import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormStore } from "@/lib/store";
import { useCreateApplication, useUpdateApplication } from "@workspace/api-client-react";
import { ArrowRight, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

const LOAN_TYPES = [
  { id: "personal", label: "Personal Loan", range: "₹50,000 – ₹10,00,000", desc: "Medical, travel, lifestyle" },
  { id: "home", label: "Home Loan", range: "₹5,00,000 – ₹1,00,00,000", desc: "Buy, build or renovate" },
  { id: "business", label: "Business Loan", range: "₹1,00,000 – ₹50,00,000", desc: "Capital & expansion" },
];

const PURPOSES: Record<string, string[]> = {
  personal: ["Medical Emergency", "Travel", "Education", "Home Renovation", "Debt Consolidation", "Wedding", "Consumer Durables", "Other"],
  home: ["Home Purchase", "Home Construction", "Home Renovation", "Plot Purchase", "Balance Transfer", "Other"],
  business: ["Working Capital", "Business Expansion", "Equipment Purchase", "Inventory Financing", "Office Renovation", "Other"],
};

const TENURES = [12, 24, 36, 48, 60];
const RATES: Record<string, number> = { personal: 12.5, home: 8.75, business: 14.5 };

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

function calcEMI(principal: number, ratePerYear: number, months: number): number {
  const r = ratePerYear / 12 / 100;
  if (r === 0) return Math.round(principal / months);
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

const schema = z.object({
  loanType: z.enum(["personal", "home", "business"], { required_error: "Select a loan type" }),
  amount: z.number().min(50000, "Minimum ₹50,000"),
  tenure: z.number().min(12).max(60),
  purpose: z.string().min(1, "Select a purpose"),
});

type FormData = z.infer<typeof schema>;

export function Step1() {
  const store = useFormStore();
  const createApp = useCreateApplication();
  const updateApp = useUpdateApplication();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      loanType: (store.loanType as "personal" | "home" | "business") || undefined,
      amount: store.amount || 500000,
      tenure: store.tenure || 36,
      purpose: store.purpose || "",
    },
  });

  const loanType = form.watch("loanType");
  const amount = form.watch("amount");
  const tenure = form.watch("tenure");

  const amountConfig = {
    personal: { min: 50000, max: 1000000, step: 50000 },
    home: { min: 500000, max: 10000000, step: 100000 },
    business: { min: 100000, max: 5000000, step: 100000 },
  };
  const cfg = loanType ? amountConfig[loanType] : amountConfig.personal;
  const emi = loanType && amount && tenure ? calcEMI(amount, RATES[loanType], tenure) : 0;

  async function onSubmit(data: FormData) {
    store.setFields({
      loanType: data.loanType as "personal" | "home" | "business",
      amount: data.amount,
      tenure: data.tenure,
      purpose: data.purpose,
    });

    if (!store.applicationId) {
      createApp.mutate(
        { data: { loanType: data.loanType, formData: { ...data }, currentStep: 1 } },
        {
          onSuccess: (app) => {
            store.setField("applicationId", app.id);
            store.nextStep();
          },
        }
      );
    } else {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 2, formData: { loanType: data.loanType, amount: data.amount, tenure: data.tenure, purpose: data.purpose } } },
        { onSuccess: () => store.nextStep() }
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Loan Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select your loan type and configure your requirements.</p>
        </div>

        {/* Loan type cards */}
        <FormField
          control={form.control}
          name="loanType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Type</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LOAN_TYPES.map((lt) => (
                    <button
                      key={lt.id}
                      type="button"
                      data-testid={`loan-type-${lt.id}`}
                      onClick={() => {
                        field.onChange(lt.id);
                        const newCfg = amountConfig[lt.id as keyof typeof amountConfig];
                        const curAmt = form.getValues("amount");
                        if (curAmt < newCfg.min) form.setValue("amount", newCfg.min);
                        if (curAmt > newCfg.max) form.setValue("amount", newCfg.max);
                        form.setValue("purpose", "");
                      }}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all",
                        field.value === lt.id
                          ? "border-primary bg-accent"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="font-semibold text-foreground">{lt.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{lt.range}</div>
                      <div className="text-xs text-muted-foreground">{lt.desc}</div>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Loan Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Loan Amount</FormLabel>
                <span className="text-lg font-bold text-primary">{formatINR(field.value)}</span>
              </div>
              <FormControl>
                <Slider
                  data-testid="slider-loan-amount"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={[field.value]}
                  onValueChange={([v]) => field.onChange(v)}
                  className="mt-2"
                />
              </FormControl>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatINR(cfg.min)}</span>
                <span>{formatINR(cfg.max)}</span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tenure */}
        <FormField
          control={form.control}
          name="tenure"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Tenure</FormLabel>
              <FormControl>
                <div className="flex gap-2 flex-wrap">
                  {TENURES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-testid={`tenure-${t}`}
                      onClick={() => field.onChange(t)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        field.value === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      )}
                    >
                      {t} mo
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Purpose */}
        {loanType && (
          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose of Loan</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="select-purpose">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PURPOSES[loanType].map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* EMI Preview */}
        {emi > 0 && (
          <div className="bg-accent rounded-xl p-4 flex items-center justify-between border border-accent-border">
            <div>
              <div className="text-sm font-medium text-accent-foreground">Estimated Monthly EMI</div>
              <div className="text-xs text-muted-foreground mt-0.5">At {loanType ? RATES[loanType] : 0}% p.a. for {tenure} months</div>
            </div>
            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
              <IndianRupee className="w-5 h-5" />
              {emi.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          data-testid="btn-next-step"
          disabled={createApp.isPending || updateApp.isPending}
        >
          {createApp.isPending || updateApp.isPending ? "Saving..." : "Continue"}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </form>
    </Form>
  );
}
