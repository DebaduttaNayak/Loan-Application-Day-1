import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFormStore } from "@/lib/store";
import { useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const EMPLOYMENT_TYPES = [
  { id: "salaried", label: "Salaried", desc: "Working for a company/organization" },
  { id: "self_employed_professional", label: "Self-Employed Professional", desc: "Doctor, CA, Architect, etc." },
  { id: "self_employed_business", label: "Self-Employed Business", desc: "Own a business or enterprise" },
  { id: "government", label: "Government / PSU", desc: "Central or state government employee" },
];

const schema = z.object({
  employmentType: z.string().min(1, "Select employment type"),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  yearsInJob: z.coerce.number().optional(),
  monthlySalary: z.coerce.number().optional(),
  hrEmail: z.string().optional(),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  yearsInBusiness: z.coerce.number().optional(),
  annualTurnover: z.coerce.number().optional(),
  monthlyProfit: z.coerce.number().optional(),
  department: z.string().optional(),
  grade: z.string().optional(),
  yearsOfService: z.coerce.number().optional(),
  itrFiled: z.boolean().optional(),
  assessmentYear: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.employmentType === "salaried") {
    if (!data.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required" });
    if (!data.designation) ctx.addIssue({ code: "custom", path: ["designation"], message: "Designation is required" });
    if (!data.monthlySalary || data.monthlySalary <= 0) ctx.addIssue({ code: "custom", path: ["monthlySalary"], message: "Monthly salary is required" });
  }
  if (data.employmentType === "self_employed_professional" || data.employmentType === "self_employed_business") {
    if (!data.businessName) ctx.addIssue({ code: "custom", path: ["businessName"], message: "Business name is required" });
    if (!data.monthlyProfit || data.monthlyProfit <= 0) ctx.addIssue({ code: "custom", path: ["monthlyProfit"], message: "Monthly profit is required" });
  }
  if (data.employmentType === "government") {
    if (!data.department) ctx.addIssue({ code: "custom", path: ["department"], message: "Department is required" });
    if (!data.monthlySalary || data.monthlySalary <= 0) ctx.addIssue({ code: "custom", path: ["monthlySalary"], message: "Monthly salary is required" });
  }
});

type FormData = z.infer<typeof schema>;

export function Step3() {
  const store = useFormStore();
  const updateApp = useUpdateApplication();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employmentType: store.employmentType,
      companyName: store.companyName,
      designation: store.designation,
      yearsInJob: store.yearsInJob,
      monthlySalary: store.monthlySalary,
      hrEmail: store.hrEmail,
      businessName: store.businessName,
      businessType: store.businessType,
      yearsInBusiness: store.yearsInBusiness,
      annualTurnover: store.annualTurnover,
      monthlyProfit: store.monthlyProfit,
      department: store.department,
      grade: store.grade,
      yearsOfService: store.yearsOfService,
      itrFiled: store.itrFiled,
      assessmentYear: store.assessmentYear,
    },
  });

  const employmentType = form.watch("employmentType");
  const itrFiled = form.watch("itrFiled");

  async function onSubmit(data: FormData) {
    store.setFields({
      employmentType: data.employmentType,
      companyName: data.companyName || "",
      designation: data.designation || "",
      yearsInJob: data.yearsInJob || 0,
      monthlySalary: data.monthlySalary || 0,
      hrEmail: data.hrEmail || "",
      businessName: data.businessName || "",
      businessType: data.businessType || "",
      yearsInBusiness: data.yearsInBusiness || 0,
      annualTurnover: data.annualTurnover || 0,
      monthlyProfit: data.monthlyProfit || 0,
      department: data.department || "",
      grade: data.grade || "",
      yearsOfService: data.yearsOfService || 0,
      itrFiled: data.itrFiled || false,
      assessmentYear: data.assessmentYear || "",
    });
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 4, formData: { employmentType: data.employmentType, monthlySalary: data.monthlySalary || 0, monthlyProfit: data.monthlyProfit || 0 } } },
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
          <h2 className="text-2xl font-bold">Employment & Income</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your employment details help us determine your loan eligibility.</p>
        </div>

        {/* Employment type selector */}
        <FormField control={form.control} name="employmentType" render={({ field }) => (
          <FormItem>
            <FormLabel>Employment Type</FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EMPLOYMENT_TYPES.map((et) => (
                  <button key={et.id} type="button" data-testid={`emp-type-${et.id}`}
                    onClick={() => field.onChange(et.id)}
                    className={cn("text-left p-3 rounded-xl border-2 transition-all",
                      field.value === et.id ? "border-primary bg-accent" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="font-semibold text-sm">{et.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{et.desc}</div>
                  </button>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Salaried Fields */}
        {employmentType === "salaried" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Company / Employer Name</FormLabel>
                <FormControl><Input {...field} data-testid="input-company-name" placeholder="Infosys Limited" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="designation" render={({ field }) => (
              <FormItem>
                <FormLabel>Designation</FormLabel>
                <FormControl><Input {...field} data-testid="input-designation" placeholder="Software Engineer" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="yearsInJob" render={({ field }) => (
              <FormItem>
                <FormLabel>Years in Current Job</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-years-job" placeholder="2" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="monthlySalary" render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Net Salary (INR)</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-monthly-salary" placeholder="75000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="hrEmail" render={({ field }) => (
              <FormItem>
                <FormLabel>HR Contact Email</FormLabel>
                <FormControl><Input type="email" {...field} data-testid="input-hr-email" placeholder="hr@company.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* Self-Employed Fields */}
        {(employmentType === "self_employed_professional" || employmentType === "self_employed_business") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="businessName" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>{employmentType === "self_employed_professional" ? "Practice / Firm Name" : "Business Name"}</FormLabel>
                <FormControl><Input {...field} data-testid="input-business-name" placeholder="Sharma & Associates" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="businessType" render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Business</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger data-testid="select-business-type"><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="proprietorship">Proprietorship</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="pvt_ltd">Private Limited</SelectItem>
                    <SelectItem value="llp">LLP</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="yearsInBusiness" render={({ field }) => (
              <FormItem>
                <FormLabel>Years in Business</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-years-business" placeholder="5" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="annualTurnover" render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Turnover (INR)</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-annual-turnover" placeholder="5000000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="monthlyProfit" render={({ field }) => (
              <FormItem>
                <FormLabel>Average Monthly Profit (INR)</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-monthly-profit" placeholder="80000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* Government Fields */}
        {employmentType === "government" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Department / Ministry</FormLabel>
                <FormControl><Input {...field} data-testid="input-department" placeholder="Ministry of Finance" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="grade" render={({ field }) => (
              <FormItem>
                <FormLabel>Grade / Level</FormLabel>
                <FormControl><Input {...field} data-testid="input-grade" placeholder="Class A / Level 7" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="yearsOfService" render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Service</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-years-service" placeholder="10" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="monthlySalary" render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly Net Salary (INR)</FormLabel>
                <FormControl><Input type="number" min={0} {...field} data-testid="input-monthly-salary-gov" placeholder="60000" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        )}

        {/* ITR */}
        {employmentType && (
          <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/30">
            <FormField control={form.control} name="itrFiled" render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>Income Tax Return Filed?</FormLabel>
                  <p className="text-xs text-muted-foreground">Have you filed ITR in the last assessment year?</p>
                </div>
                <FormControl><Switch checked={field.value || false} onCheckedChange={field.onChange} data-testid="switch-itr" /></FormControl>
              </FormItem>
            )} />
            {itrFiled && (
              <FormField control={form.control} name="assessmentYear" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Assessment Year</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-assessment-year"><SelectValue placeholder="Select year" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="2024-25">AY 2024-25</SelectItem>
                      <SelectItem value="2023-24">AY 2023-24</SelectItem>
                      <SelectItem value="2022-23">AY 2022-23</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}
          </div>
        )}

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
