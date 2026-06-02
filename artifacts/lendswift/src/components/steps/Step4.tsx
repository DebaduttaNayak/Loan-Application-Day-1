import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useFormStore } from "@/lib/store";
import { useAutocompleteAddress, getAutocompleteAddressQueryKey, useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

const schema = z.object({
  currentAddress: z.string().min(5, "Please enter a valid address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits").regex(/^\d+$/, "Numbers only"),
  yearsAtAddress: z.coerce.number().min(0),
  isPermanentSame: z.boolean(),
  permanentAddress: z.string().optional(),
  permanentCity: z.string().optional(),
  permanentState: z.string().optional(),
  permanentPincode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.isPermanentSame) {
    if (!data.permanentAddress || data.permanentAddress.length < 5) ctx.addIssue({ code: "custom", path: ["permanentAddress"], message: "Permanent address is required" });
    if (!data.permanentCity || data.permanentCity.length < 2) ctx.addIssue({ code: "custom", path: ["permanentCity"], message: "City is required" });
    if (!data.permanentState || data.permanentState.length < 2) ctx.addIssue({ code: "custom", path: ["permanentState"], message: "State is required" });
    if (!data.permanentPincode || data.permanentPincode.length !== 6) ctx.addIssue({ code: "custom", path: ["permanentPincode"], message: "6-digit pincode required" });
  }
});

type FormData = z.infer<typeof schema>;

export function Step4() {
  const store = useFormStore();
  const updateApp = useUpdateApplication();
  const [addressQuery, setAddressQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: suggestions } = useAutocompleteAddress(
    { query: debouncedQuery },
    { query: { enabled: debouncedQuery.length >= 2, queryKey: getAutocompleteAddressQueryKey({ query: debouncedQuery }) } }
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentAddress: store.currentAddress,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      yearsAtAddress: store.yearsAtAddress,
      isPermanentSame: store.isPermanentSame,
      permanentAddress: store.permanentAddress,
      permanentCity: store.permanentCity,
      permanentState: store.permanentState,
      permanentPincode: store.permanentPincode,
    },
  });

  const isPermanentSame = form.watch("isPermanentSame");

  function handleAddressInput(value: string) {
    setAddressQuery(value);
    form.setValue("currentAddress", value);
    if (debouncedRef.current) clearTimeout(debouncedRef.current);
    debouncedRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      setShowSuggestions(true);
    }, 300);
  }

  function selectSuggestion(s: { label: string; city: string; state: string; pincode: string }) {
    form.setValue("currentAddress", s.label);
    form.setValue("city", s.city);
    form.setValue("state", s.state);
    form.setValue("pincode", s.pincode);
    setAddressQuery(s.label);
    setShowSuggestions(false);
  }

  async function onSubmit(data: FormData) {
    store.setFields({
      currentAddress: data.currentAddress, city: data.city, state: data.state,
      pincode: data.pincode, yearsAtAddress: data.yearsAtAddress,
      isPermanentSame: data.isPermanentSame,
      permanentAddress: data.permanentAddress || "",
      permanentCity: data.permanentCity || "",
      permanentState: data.permanentState || "",
      permanentPincode: data.permanentPincode || "",
    });
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 5, formData: { city: data.city, state: data.state } } },
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
          <h2 className="text-2xl font-bold">Address Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your residential address as per government records.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current Address</h3>

          {/* Address with autocomplete */}
          <FormField control={form.control} name="currentAddress" render={({ field }) => (
            <FormItem>
              <FormLabel>Flat / House No., Street, Locality</FormLabel>
              <div className="relative">
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      {...field}
                      data-testid="input-address"
                      className="pl-10"
                      placeholder="Start typing your address..."
                      value={addressQuery || field.value}
                      onChange={(e) => handleAddressInput(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => debouncedQuery.length >= 2 && setShowSuggestions(true)}
                      autoComplete="off"
                    />
                  </div>
                </FormControl>
                {showSuggestions && suggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 bg-card border border-border rounded-lg shadow-lg mt-1 overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" data-testid={`address-suggestion-${i}`}
                        onClick={() => selectSuggestion(s)}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm border-b border-border last:border-0 flex items-start gap-2"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input {...field} data-testid="input-city" placeholder="Mumbai" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="state" render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl><Input {...field} data-testid="input-state" placeholder="Maharashtra" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pincode" render={({ field }) => (
              <FormItem>
                <FormLabel>Pincode</FormLabel>
                <FormControl><Input {...field} data-testid="input-pincode" placeholder="400001" maxLength={6} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="yearsAtAddress" render={({ field }) => (
            <FormItem>
              <FormLabel>Years at Current Address</FormLabel>
              <FormControl><Input type="number" min={0} max={99} {...field} data-testid="input-years-address" placeholder="3" className="max-w-[120px]" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Permanent address toggle */}
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-4">
          <FormField control={form.control} name="isPermanentSame" render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <div>
                <FormLabel>Permanent address same as current?</FormLabel>
                <p className="text-xs text-muted-foreground">Toggle off to enter a different permanent address</p>
              </div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-permanent-same" /></FormControl>
            </FormItem>
          )} />

          {!isPermanentSame && (
            <div className="space-y-4 pt-2 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Permanent Address</h3>
              <FormField control={form.control} name="permanentAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Flat / House No., Street, Locality</FormLabel>
                  <FormControl><Input {...field} data-testid="input-permanent-address" placeholder="Permanent address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <FormField control={form.control} name="permanentCity" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} data-testid="input-permanent-city" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="permanentState" render={({ field }) => (
                  <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} data-testid="input-permanent-state" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="permanentPincode" render={({ field }) => (
                  <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input {...field} data-testid="input-permanent-pincode" maxLength={6} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </div>
          )}
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
