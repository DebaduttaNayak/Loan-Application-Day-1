import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFormStore } from "@/lib/store";
import { useUploadDocument, useUpdateApplication } from "@workspace/api-client-react";
import { ArrowLeft, ArrowRight, Upload, FileText, Image as ImageIcon, X, CheckCircle2 } from "lucide-react";

interface DocRequirement {
  key: string;
  label: string;
  required: boolean;
  hint: string;
}

function getRequiredDocs(loanType: string | null, employmentType: string): DocRequirement[] {
  const base: DocRequirement[] = [
    { key: "pan_copy", label: "PAN Card Copy", required: true, hint: "Clear scan/photo of PAN card" },
    { key: "aadhaar_copy", label: "Aadhaar Card Copy", required: true, hint: "Both sides of Aadhaar" },
    { key: "passport_photo", label: "Passport-size Photo", required: true, hint: "Recent colour photograph" },
  ];

  const incomeDoc = (employmentType === "salaried" || employmentType === "government")
    ? [{ key: "salary_slips", label: "Salary Slips (Last 3 months)", required: true, hint: "PDF or clear scan" }]
    : [{ key: "itr_docs", label: "ITR Documents (Last 2-3 years)", required: true, hint: "Acknowledgement + computation" }];

  const bankStatement: DocRequirement[] = [
    { key: "bank_statement", label: "Bank Statement (6 months)", required: true, hint: "From primary salary/business account" },
  ];

  const loanSpecific: DocRequirement[] = loanType === "home"
    ? [
        { key: "property_docs", label: "Property Documents", required: true, hint: "Title deed / agreement" },
        { key: "sale_agreement", label: "Sale Agreement / NOC", required: true, hint: "From builder/seller" },
        { key: "valuation_report", label: "Property Valuation Report", required: false, hint: "From registered valuer" },
      ]
    : loanType === "business"
    ? [
        { key: "business_registration", label: "Business Registration Certificate", required: true, hint: "GST registration / trade license" },
        { key: "gst_certificate", label: "GST Certificate", required: false, hint: "If GST registered" },
        { key: "audited_balance_sheet", label: "Audited Balance Sheet", required: true, hint: "Last 2 years, CA certified" },
      ]
    : [];

  return [...base, ...incomeDoc, ...bankStatement, ...loanSpecific];
}

interface UploadedFile {
  docType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  preview: string | null;
}

export function Step6() {
  const store = useFormStore();
  const uploadDoc = useUploadDocument();
  const updateApp = useUpdateApplication();
  const [uploaded, setUploaded] = useState<Record<string, UploadedFile>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requiredDocs = getRequiredDocs(store.loanType, store.employmentType);
  const requiredCount = requiredDocs.filter(d => d.required).length;
  const uploadedRequiredCount = requiredDocs.filter(d => d.required && uploaded[d.key]).length;

  async function handleFileUpload(docKey: string, docLabel: string, file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB");
      return;
    }

    setUploading(prev => ({ ...prev, [docKey]: true }));

    // Generate preview for images
    let preview: string | null = null;
    if (file.type.startsWith("image/")) {
      preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    if (store.applicationId) {
      uploadDoc.mutate(
        {
          applicationId: store.applicationId,
          data: {
            docType: docKey,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || null,
            base64Preview: null,
          },
        },
        {
          onSuccess: () => {
            setUploaded(prev => ({
              ...prev,
              [docKey]: { docType: docKey, fileName: file.name, fileSize: file.size, mimeType: file.type, preview },
            }));
            setUploading(prev => ({ ...prev, [docKey]: false }));
          },
          onError: () => setUploading(prev => ({ ...prev, [docKey]: false })),
        }
      );
    } else {
      setUploaded(prev => ({
        ...prev,
        [docKey]: { docType: docKey, fileName: file.name, fileSize: file.size, mimeType: file.type, preview },
      }));
      setUploading(prev => ({ ...prev, [docKey]: false }));
    }
  }

  function removeFile(docKey: string) {
    setUploaded(prev => { const n = { ...prev }; delete n[docKey]; return n; });
  }

  function formatSize(bytes: number) {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  async function handleNext() {
    const missingRequired = requiredDocs.filter(d => d.required && !uploaded[d.key]).map(d => d.label);
    if (missingRequired.length > 0) {
      if (!confirm(`Missing required documents:\n• ${missingRequired.join("\n• ")}\n\nContinue anyway?`)) return;
    }
    store.setField("documents", Object.fromEntries(Object.entries(uploaded).map(([k, v]) => [k, v.fileName])));
    if (store.applicationId) {
      updateApp.mutate(
        { id: store.applicationId, data: { currentStep: 7 } },
        { onSuccess: () => store.nextStep() }
      );
    } else {
      store.nextStep();
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Document Upload</h2>
        <p className="mt-1 text-sm text-muted-foreground">Upload required documents. Max 5MB per file (PDF, JPG, PNG).</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
        <div className="text-sm font-medium">{uploadedRequiredCount}/{requiredCount} required documents uploaded</div>
        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${requiredCount > 0 ? (uploadedRequiredCount / requiredCount) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {requiredDocs.map((doc) => {
          const file = uploaded[doc.key];
          const isUploading = uploading[doc.key];

          return (
            <div key={doc.key} className="border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{doc.label}</span>
                    {doc.required ? (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                    {file && <Badge variant="outline" className="text-xs text-green-600 border-green-300"><CheckCircle2 className="w-3 h-3 mr-1" />Uploaded</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{doc.hint}</p>
                </div>

                {!file ? (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      ref={el => { fileInputRefs.current[doc.key] = el; }}
                      data-testid={`file-input-${doc.key}`}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(doc.key, doc.label, f);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      data-testid={`btn-upload-${doc.key}`}
                      onClick={() => fileInputRefs.current[doc.key]?.click()}
                    >
                      {isUploading ? (
                        <><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />Uploading...</>
                      ) : (
                        <><Upload className="w-3 h-3 mr-2" />Upload</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(doc.key)} data-testid={`btn-remove-${doc.key}`}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* File preview */}
              {file && (
                <div className="px-4 pb-4 flex items-center gap-3 border-t border-border pt-3 bg-muted/20">
                  {file.preview ? (
                    <img src={file.preview} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-border" />
                  ) : (
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.fileSize)}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => store.prevStep()} data-testid="btn-prev-step"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        <Button type="button" className="flex-1" onClick={handleNext} data-testid="btn-next-step" disabled={updateApp.isPending}>
          {updateApp.isPending ? "Saving..." : "Continue"}<ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
