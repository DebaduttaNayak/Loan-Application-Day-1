import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormStore } from "@/lib/store";
import { useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, PenLine, RefreshCw } from "lucide-react";

const schema = z.object({
  hasCoApplicant: z.boolean(),
  coApplicantName: z.string().optional(),
  coApplicantRelation: z.string().optional(),
  coApplicantPan: z.string().optional(),
  coApplicantMobile: z.string().optional(),
  coApplicantEmploymentType: z.string().optional(),
  coApplicantMonthlyIncome: z.coerce.number().optional(),
}).superRefine((data, ctx) => {
  if (data.hasCoApplicant) {
    if (!data.coApplicantName || data.coApplicantName.length < 2)
      ctx.addIssue({ code: "custom", path: ["coApplicantName"], message: "Co-applicant name is required" });
    if (!data.coApplicantRelation)
      ctx.addIssue({ code: "custom", path: ["coApplicantRelation"], message: "Relation is required" });
    if (!data.coApplicantPan || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.coApplicantPan))
      ctx.addIssue({ code: "custom", path: ["coApplicantPan"], message: "Valid PAN required (AAAAA9999A)" });
    if (!data.coApplicantMobile || data.coApplicantMobile.length !== 10)
      ctx.addIssue({ code: "custom", path: ["coApplicantMobile"], message: "10-digit mobile required" });
  }
});

type FormData = z.infer<typeof schema>;

export function Step7() {
  const store = useFormStore();
  const updateApp = useUpdateApplication();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(store.signature);
  const [hasSignatureContent, setHasSignatureContent] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const shouldShowCoApplicant = store.amount > 500000 || store.loanType === "home";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      hasCoApplicant: store.hasCoApplicant,
      coApplicantName: store.coApplicantName,
      coApplicantRelation: store.coApplicantRelation,
      coApplicantPan: store.coApplicantPan,
      coApplicantMobile: store.coApplicantMobile,
      coApplicantEmploymentType: store.coApplicantEmploymentType,
      coApplicantMonthlyIncome: store.coApplicantMonthlyIncome || undefined,
    },
  });

  const hasCoApplicant = form.watch("hasCoApplicant");

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    if (!canvasRef.current) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e, canvasRef.current);
    lastPos.current = pos;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setHasSignatureContent(true);
  }

  function stopDraw() {
    setIsDrawing(false);
    lastPos.current = null;
  }

  function clearSignature() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignatureContent(false);
    setSavedSignature(null);
    store.setField("signature", null);
  }

  function saveSignature() {
    if (!canvasRef.current || !hasSignatureContent) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    setSavedSignature(dataUrl);
    store.setField("signature", dataUrl);
  }

  async function onSubmit(data: FormData) {
    store.setFields({
      hasCoApplicant: data.hasCoApplicant,
      coApplicantName: data.coApplicantName || "",
      coApplicantRelation: data.coApplicantRelation || "",
      coApplicantPan: data.coApplicantPan || "",
      coApplicantMobile: data.coApplicantMobile || "",
      coApplicantEmploymentType: data.coApplicantEmploymentType || "",
      coApplicantMonthlyIncome: data.coApplicantMonthlyIncome || 0,
    });
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 8 } },
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
          <h2 className="text-2xl font-bold">Co-applicant & Signature</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {shouldShowCoApplicant ? "A co-applicant may strengthen your application for this loan amount." : "Adding a co-applicant is optional for your loan amount."}
          </p>
        </div>

        {/* Co-applicant toggle */}
        <FormField control={form.control} name="hasCoApplicant" render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
            <div>
              <FormLabel>Add a Co-applicant?</FormLabel>
              <p className="text-xs text-muted-foreground">Spouse, parent, or sibling with income</p>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-co-applicant" /></FormControl>
          </FormItem>
        )} />

        {hasCoApplicant && (
          <div className="space-y-4 p-4 rounded-xl border border-primary/30 bg-accent/30">
            <h3 className="text-sm font-semibold text-foreground">Co-applicant Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="coApplicantName" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-co-name" placeholder="Co-applicant full name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coApplicantRelation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-co-relation"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coApplicantPan" render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl><Input {...field} data-testid="input-co-pan" placeholder="ABCDE1234F" maxLength={10} className="uppercase" onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coApplicantMobile" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl><Input {...field} data-testid="input-co-mobile" placeholder="9876543210" maxLength={10} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coApplicantEmploymentType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-co-employment"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self_employed">Self-Employed</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="coApplicantMonthlyIncome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Income (INR)</FormLabel>
                  <FormControl><Input type="number" min={0} {...field} data-testid="input-co-income" placeholder="50000" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        )}

        {/* E-Signature */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">Electronic Signature</h3>
            <p className="text-sm text-muted-foreground">Draw your signature below using mouse or finger</p>
          </div>

          <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={560}
              height={160}
              data-testid="canvas-signature"
              className="w-full cursor-crosshair touch-none"
              style={{ display: savedSignature ? "none" : "block" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {savedSignature && (
              <img src={savedSignature} alt="Saved signature" className="w-full h-40 object-contain p-4" />
            )}
            {!hasSignatureContent && !savedSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-muted-foreground/50 text-sm flex items-center gap-2"><PenLine className="w-4 h-4" />Sign here</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearSignature} data-testid="btn-clear-signature">
              <RefreshCw className="w-3 h-3 mr-2" />Clear
            </Button>
            {hasSignatureContent && !savedSignature && (
              <Button type="button" size="sm" onClick={saveSignature} data-testid="btn-save-signature">
                <PenLine className="w-3 h-3 mr-2" />Save Signature
              </Button>
            )}
            {savedSignature && <span className="text-sm text-green-600 flex items-center gap-1 ml-2">Signature saved</span>}
          </div>
        </div>

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
