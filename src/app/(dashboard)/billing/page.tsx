import { Receipt } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Invoices and payment tracking</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-2xl bg-primary/10 mb-4">
          <Receipt className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Coming in Phase 7</h2>
        <p className="text-muted-foreground max-w-md">
          Invoice generation, payment tracking, and financial analytics.
        </p>
      </div>
    </div>
  );
}
