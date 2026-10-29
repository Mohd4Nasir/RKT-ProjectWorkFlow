import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Construction, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  title: string;
  message?: string;
}

/** Placeholder for pages that are still under development. */
const ComingSoon = ({
  title,
  message = "This feature is under development and will be available soon.",
}: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-orange-100 text-orange-600">
          <Construction className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-orange-700">
          Work in progress
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Go Back
          </Button>
          <Button asChild>
            <Link to="/dashboard">
              <Home className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
