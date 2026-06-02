import { useEffect } from "react";
import { useLocation } from "wouter";
import { useFormStore } from "@/lib/store";
import { STEPS } from "@/lib/constants";
import { Check } from "lucide-react";
import { Step1 } from "@/components/steps/Step1";
import { Step2 } from "@/components/steps/Step2";
import { Step3 } from "@/components/steps/Step3";
import { Step4 } from "@/components/steps/Step4";
import { Step5 } from "@/components/steps/Step5";
import { Step6 } from "@/components/steps/Step6";
import { Step7 } from "@/components/steps/Step7";
import { Step8 } from "@/components/steps/Step8";

export default function Apply() {
  const currentStep = useFormStore((state) => state.currentStep);
  const applicationId = useFormStore((state) => state.applicationId);

  // Render current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      case 5: return <Step5 />;
      case 6: return <Step6 />;
      case 7: return <Step7 />;
      case 8: return <Step8 />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            LendSwift
          </div>
          {applicationId && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Auto-saving...
            </div>
          )}
        </div>
        
        {/* Stepper */}
        <div className="container mx-auto px-4 py-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px]">
            {STEPS.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center relative flex-1">
                  {index !== 0 && (
                    <div className={`absolute top-4 left-0 w-full h-0.5 -ml-[50%] -z-10 transition-colors ${
                      isCompleted || isCurrent ? "bg-primary" : "bg-gray-200"
                    }`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted ? "bg-primary text-white" : 
                    isCurrent ? "bg-primary text-white ring-4 ring-primary/20" : 
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    isCurrent ? "text-primary" : 
                    isCompleted ? "text-gray-900" : 
                    "text-gray-400"
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-6 md:p-8">
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
