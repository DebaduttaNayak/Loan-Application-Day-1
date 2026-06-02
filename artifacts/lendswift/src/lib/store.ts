import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FormState {
  applicationId: string | null;
  currentStep: number;

  // Step 1
  loanType: "personal" | "home" | "business" | null;
  amount: number;
  tenure: number;
  purpose: string;

  // Step 2
  fullName: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  pan: string;
  isPanVerified: boolean;
  aadhaar: string;
  isAadhaarVerified: boolean;
  mobile: string;
  email: string;
  motherName: string;

  // Step 3
  employmentType: string;
  companyName: string;
  designation: string;
  yearsInJob: number;
  monthlySalary: number;
  hrEmail: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: number;
  annualTurnover: number;
  monthlyProfit: number;
  department: string;
  grade: string;
  yearsOfService: number;
  itrFiled: boolean;
  assessmentYear: string;

  // Step 4
  currentAddress: string;
  city: string;
  state: string;
  pincode: string;
  yearsAtAddress: number;
  isPermanentSame: boolean;
  permanentAddress: string;
  permanentCity: string;
  permanentState: string;
  permanentPincode: string;

  // Step 5
  monthlyExpenses: number;
  existingEmis: number;
  creditScore: string;
  bankName: string;
  accountType: string;
  yearsWithBank: number;

  // Step 6 (Documents)
  documents: Record<string, string>;

  // Step 7 (Co-applicant)
  hasCoApplicant: boolean;
  coApplicantName: string;
  coApplicantRelation: string;
  coApplicantPan: string;
  coApplicantMobile: string;
  coApplicantEmploymentType: string;
  coApplicantMonthlyIncome: number;
  signature: string | null;

  // Step 8 (Review)
  declaredTrue: boolean;
  agreedTerms: boolean;
  creditConsent: boolean;
  marketingConsent: boolean;

  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setFields: (fields: Partial<Omit<FormState, 'setField' | 'setFields' | 'nextStep' | 'prevStep' | 'resetForm'>>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
}

const initialState = {
  applicationId: null,
  currentStep: 1,
  loanType: null,
  amount: 500000,
  tenure: 36,
  purpose: '',
  fullName: '',
  dob: '',
  gender: '',
  maritalStatus: '',
  pan: '',
  isPanVerified: false,
  aadhaar: '',
  isAadhaarVerified: false,
  mobile: '',
  email: '',
  motherName: '',
  employmentType: '',
  companyName: '',
  designation: '',
  yearsInJob: 0,
  monthlySalary: 0,
  hrEmail: '',
  businessName: '',
  businessType: '',
  yearsInBusiness: 0,
  annualTurnover: 0,
  monthlyProfit: 0,
  department: '',
  grade: '',
  yearsOfService: 0,
  itrFiled: false,
  assessmentYear: '',
  currentAddress: '',
  city: '',
  state: '',
  pincode: '',
  yearsAtAddress: 0,
  isPermanentSame: true,
  permanentAddress: '',
  permanentCity: '',
  permanentState: '',
  permanentPincode: '',
  monthlyExpenses: 0,
  existingEmis: 0,
  creditScore: '',
  bankName: '',
  accountType: '',
  yearsWithBank: 0,
  documents: {},
  hasCoApplicant: false,
  coApplicantName: '',
  coApplicantRelation: '',
  coApplicantPan: '',
  coApplicantMobile: '',
  coApplicantEmploymentType: '',
  coApplicantMonthlyIncome: 0,
  signature: null,
  declaredTrue: false,
  agreedTerms: false,
  creditConsent: false,
  marketingConsent: false,
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...initialState,
      setField: (key, value) => set((state) => ({ ...state, [key]: value })),
      setFields: (fields) => set((state) => ({ ...state, ...fields })),
      nextStep: () => set((state) => ({ currentStep: Math.min(8, state.currentStep + 1) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      resetForm: () => set((state) => ({ ...initialState, setField: state.setField, setFields: state.setFields, nextStep: state.nextStep, prevStep: state.prevStep, resetForm: state.resetForm })),
    }),
    { name: 'lendswift-application' }
  )
);
