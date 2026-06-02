import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormStore } from "@/lib/store";
import { useGetApplication, getGetApplicationQueryKey } from "@workspace/api-client-react";
import { IndianRupee, ArrowLeft, Search, FileText } from "lucide-react";

const schema = z.object({
  applicationId: z.string().min(8, "Application ID must be at least 8 characters").max(50),
});
type FormData = z.infer<typeof schema>;

export default function Resume() {
  const [, setLocation] = useLocation();
  const store = useFormStore();
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { data: app, isLoading } = useGetApplication(lookupId || "", {
    query: { enabled: !!lookupId, queryKey: getGetApplicationQueryKey(lookupId || "") },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { applicationId: store.applicationId || "" },
  });

  function onSubmit(data: FormData) {
    setNotFound(false);
    setLookupId(data.applicationId.trim());
  }

  // Resume from localStorage if available
  function handleResumeFromStorage() {
    if (store.applicationId) {
      setLocation("/apply");
    }
  }

  // When app is found, restore state and navigate
  function handleResume() {
    if (!app) return;
    const fd = (app.formData as Record<string, unknown>) || {};
    store.setFields({
      applicationId: app.id,
      currentStep: app.currentStep || 1,
      loanType: (app.loanType as "personal" | "home" | "business") || null,
      ...(fd as Partial<typeof store>),
    });
    setLocation("/apply");
  }

  const LOAN_TYPE_LABELS: Record<string, string> = {
    personal: "Personal Loan",
    home: "Home Loan",
    business: "Business Loan",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">LendSwift</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Resume Your Application</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your Application ID to continue from where you left off.</p>
        </div>

        {/* Resume from localStorage */}
        {store.applicationId && (
          <div className="mb-6 p-4 bg-accent border border-accent-border rounded-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-accent-foreground">Saved application found</p>
                <p className="text-xs text-muted-foreground mt-0.5">ID: {store.applicationId.slice(0, 8).toUpperCase()}... • Step {store.currentStep} of 8</p>
              </div>
              <Button size="sm" onClick={handleResumeFromStorage} data-testid="btn-resume-saved">
                Continue
              </Button>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="applicationId" render={({ field }) => (
              <FormItem>
                <FormLabel>Application ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      {...field}
                      data-testid="input-application-id"
                      className="pl-10 font-mono"
                      placeholder="e.g. a1b2c3d4-e5f6-..."
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" data-testid="btn-lookup-application" disabled={isLoading}>
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Looking up...</>
              ) : (
                "Find Application"
              )}
            </Button>
          </form>
        </Form>

        {/* Results */}
        {lookupId && !isLoading && app && (
          <div className="mt-6 p-4 bg-card border border-border rounded-xl space-y-3" data-testid="application-result">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold">Application Found</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Loan Type</span><span>{LOAN_TYPE_LABELS[app.loanType] || app.loanType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="capitalize">{app.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Progress</span><span>Step {app.currentStep} of 8</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span>{new Date(app.updatedAt).toLocaleDateString("en-IN")}</span></div>
            </div>
            <Button className="w-full" onClick={handleResume} data-testid="btn-resume-application">
              Resume Application
            </Button>
          </div>
        )}

        {lookupId && !isLoading && !app && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center text-sm text-destructive" data-testid="application-not-found">
            Application not found. Please check your Application ID and try again.
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">Starting fresh?</p>
          <Link href="/apply">
            <Button variant="link" className="text-primary" data-testid="link-new-application">Start a New Application</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
