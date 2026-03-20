import TaxCalculator from "@/components/sections/TaxCalculator";

export default function TaxCalculatorPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <TaxCalculator />
        </div>
      </div>
    </div>
  );
}
