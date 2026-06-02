import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, IndianRupee, ShieldCheck, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">LendSwift</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/resume" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
              Resume Application
            </Link>
            <Link href="/apply">
              <Button>Apply Now</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-blue-50/50 -z-10" />
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
            The private bank experience, <br className="hidden md:block" />
            <span className="text-primary">without the branch visit.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized loan offers in 10 minutes. RBI regulated, transparent terms, and a seamless digital process designed for modern professionals.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full">
                Start Your Application
              </Button>
            </Link>
            <Link href="/resume">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white">
                Resume Application
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              RBI Regulated Entity
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              10-Minute Approval
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Bank-Grade Security
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tailored solutions for your needs</h2>
            <p className="mt-4 text-gray-600">Choose the loan type that fits your goals.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow duration-300 border-none shadow-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <IndianRupee className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Personal Loan</h3>
                <p className="text-gray-600 mb-6 text-sm">₹50,000 to ₹10 Lakhs. Perfect for medical emergencies, travel, or major purchases.</p>
                <Link href="/apply">
                  <Button variant="outline" className="w-full">Apply for Personal Loan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-none shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Home Loan</h3>
                <p className="text-gray-600 mb-6 text-sm">₹5 Lakhs to ₹1 Crore. Competitive rates for your dream home or renovation.</p>
                <Link href="/apply">
                  <Button variant="outline" className="w-full">Apply for Home Loan</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-none shadow-sm">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Business Loan</h3>
                <p className="text-gray-600 mb-6 text-sm">₹1 Lakh to ₹50 Lakhs. Unsecured capital to expand your growing enterprise.</p>
                <Link href="/apply">
                  <Button variant="outline" className="w-full">Apply for Business Loan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} LendSwift Financial Services. All rights reserved.</p>
          <p className="mt-2">LendSwift is a registered NBFC with the Reserve Bank of India.</p>
        </div>
      </footer>
    </div>
  );
}
