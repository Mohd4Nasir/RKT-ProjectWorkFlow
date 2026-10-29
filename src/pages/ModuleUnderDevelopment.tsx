import { Construction } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';

export default function ModuleUnderDevelopment() {
  return (
    <div className="space-y-6">
      <PageHeader title="Coming soon" subtitle="This module is under development. Thank you for your patience." />

      <section className="card-elevated flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">We’re working on it</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          This module is under development. Thank you for your patience.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </section>
    </div>
  );
}
