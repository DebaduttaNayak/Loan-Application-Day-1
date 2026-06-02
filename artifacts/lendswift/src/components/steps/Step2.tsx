import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFormStore } from "@/lib/store";
import { useVerifyPan, useVerifyAadhaar, useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";

function verhoeffCheck(num: string): boolean {
  const d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  const p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  let c = 0;
  const reversed = num.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][parseInt(reversed[i], 10)]];
  }
  return c === 0;
}

const schema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  dob: z.string().min(1, "Date of birth is required").refine((v) => {
    const d = new Date(v);
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 21 && age <= 65;
  }, "Applicant must be between 21 and 65 years old"),
  gender: z.string().min(1, "Select gender"),
  maritalStatus: z.string().min(1, "Select marital status"),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN format: AAAAA9999A"),
  aadhaar: z.string().length(12, "Aadhaar must be 12 digits").regex(/^\d+$/, "Aadhaar must be digits only"),
  mobile: z.string().length(10, "Mobile must be 10 digits").regex(/^\d+$/, "Mobile must be digits only"),
  email: z.string().email("Invalid email address"),
  motherName: z.string().min(2, "Mother's name is required"),
});

type FormData = z.infer<typeof schema>;

export function Step2() {
  const store = useFormStore();
  const verifyPan = useVerifyPan();
  const verifyAadhaar = useVerifyAadhaar();
  const updateApp = useUpdateApplication();

  const [panVerified, setPanVerified] = useState(store.isPanVerified);
  const [aadhaarVerified, setAadhaarVerified] = useState(store.isAadhaarVerified);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [panError, setPanError] = useState("");
  const [aadhaarError, setAadhaarError] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: store.fullName,
      dob: store.dob,
      gender: store.gender,
      maritalStatus: store.maritalStatus,
      pan: store.pan,
      aadhaar: store.aadhaar,
      mobile: store.mobile,
      email: store.email,
      motherName: store.motherName,
    },
  });

  const pan = form.watch("pan");
  const aadhaar = form.watch("aadhaar");

  function handleVerifyPan() {
    const panVal = form.getValues("pan");
    setPanError("");
    verifyPan.mutate(
      { data: { pan: panVal, name: form.getValues("fullName") || null } },
      {
        onSuccess: (res) => {
          if (res.verified) {
            setPanVerified(true);
            store.setField("isPanVerified", true);
          } else {
            setPanError(res.message);
            setPanVerified(false);
          }
        },
      }
    );
  }

  function handleSendOtp() {
    const aadhaarVal = form.getValues("aadhaar");
    setAadhaarError("");
    if (!verhoeffCheck(aadhaarVal) && false) {
      setAadhaarError("Invalid Aadhaar number");
      return;
    }
    verifyAadhaar.mutate(
      { data: { aadhaar: aadhaarVal, otp: null } },
      {
        onSuccess: (res) => {
          if ((res.details as Record<string, unknown>)?.otpSent) {
            setOtpSent(true);
          } else {
            setAadhaarError(res.message);
          }
        },
      }
    );
  }

  function handleVerifyOtp() {
    const aadhaarVal = form.getValues("aadhaar");
    setAadhaarError("");
    verifyAadhaar.mutate(
      { data: { aadhaar: aadhaarVal, otp } },
      {
        onSuccess: (res) => {
          if (res.verified) {
            setAadhaarVerified(true);
            store.setField("isAadhaarVerified", true);
          } else {
            setAadhaarError(res.message);
          }
        },
      }
    );
  }

  async function onSubmit(data: FormData) {
    store.setFields({
      fullName: data.fullName, dob: data.dob, gender: data.gender,
      maritalStatus: data.maritalStatus, pan: data.pan, aadhaar: data.aadhaar,
      mobile: data.mobile, email: data.email, motherName: data.motherName,
      isPanVerified: panVerified, isAadhaarVerified: aadhaarVerified,
    });
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 3, formData: { fullName: data.fullName, dob: data.dob, mobile: data.mobile, email: data.email } } },
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
          <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tell us about yourself. All information is encrypted and secure.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Full Name (as per PAN)</FormLabel>
              <FormControl><Input {...field} data-testid="input-full-name" placeholder="Rajesh Kumar Sharma" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="dob" render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl><Input type="date" {...field} data-testid="input-dob" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger data-testid="select-gender"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="maritalStatus" render={({ field }) => (
            <FormItem>
              <FormLabel>Marital Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger data-testid="select-marital"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="mobile" render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl><Input {...field} data-testid="input-mobile" placeholder="9876543210" maxLength={10} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* PAN Verification */}
        <div className="space-y-2">
          <FormField control={form.control} name="pan" render={({ field }) => (
            <FormItem>
              <FormLabel>PAN Number</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input {...field} data-testid="input-pan" placeholder="ABCDE1234F" maxLength={10}
                    className="uppercase"
                    onChange={(e) => { field.onChange(e.target.value.toUpperCase()); setPanVerified(false); setPanError(""); }}
                  />
                </FormControl>
                <Button type="button" variant="outline" onClick={handleVerifyPan}
                  disabled={!pan || pan.length !== 10 || verifyPan.isPending || panVerified}
                  data-testid="btn-verify-pan"
                >
                  {verifyPan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : panVerified ? "Verified" : "Verify"}
                </Button>
              </div>
              {panVerified && <div className="flex items-center gap-1 text-green-600 text-sm mt-1"><CheckCircle2 className="w-4 h-4" />PAN verified successfully</div>}
              {panError && <div className="flex items-center gap-1 text-destructive text-sm mt-1"><XCircle className="w-4 h-4" />{panError}</div>}
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Aadhaar Verification */}
        <div className="space-y-2">
          <FormField control={form.control} name="aadhaar" render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhaar Number</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input {...field} data-testid="input-aadhaar" placeholder="123456789012" maxLength={12}
                    onChange={(e) => { field.onChange(e.target.value.replace(/\D/g, "")); setAadhaarVerified(false); setAadhaarError(""); setOtpSent(false); }}
                  />
                </FormControl>
                {!otpSent ? (
                  <Button type="button" variant="outline" onClick={handleSendOtp}
                    disabled={!aadhaar || aadhaar.length !== 12 || verifyAadhaar.isPending || aadhaarVerified}
                    data-testid="btn-send-otp"
                  >
                    {verifyAadhaar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={handleSendOtp} disabled={verifyAadhaar.isPending} data-testid="btn-resend-otp">
                    Resend
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )} />
          {otpSent && !aadhaarVerified && (
            <div className="flex gap-2">
              <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit OTP" maxLength={6} data-testid="input-otp" className="max-w-[200px]" />
              <Button type="button" onClick={handleVerifyOtp} disabled={otp.length !== 6 || verifyAadhaar.isPending} data-testid="btn-verify-otp">
                {verifyAadhaar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
              </Button>
            </div>
          )}
          {aadhaarVerified && <div className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle2 className="w-4 h-4" />Aadhaar verified via UIDAI</div>}
          {aadhaarError && <div className="flex items-center gap-1 text-destructive text-sm"><XCircle className="w-4 h-4" />{aadhaarError}</div>}
          {otpSent && !aadhaarVerified && <p className="text-xs text-muted-foreground">Enter any 6-digit OTP (except 000000) for simulation</p>}
        </div>

        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl><Input type="email" {...field} data-testid="input-email" placeholder="rajesh@example.com" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="motherName" render={({ field }) => (
          <FormItem>
            <FormLabel>Mother's Maiden Name</FormLabel>
            <FormControl><Input {...field} data-testid="input-mother-name" placeholder="Sunita Devi" /></FormControl>
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
