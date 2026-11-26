import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, FolderKanban, ListChecks, BarChart3, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotFoundProps {
  /** Big code shown on top. Defaults to 404. */
  code?: string;
  title?: string;
  message?: string;
  /** Hide the "quick links" row (used for inline "not found" states). */
  hideLinks?: boolean;
}

const QUICK_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const NotFound = ({
  code = "404",
  title = "Page not found",
  message = "The page you are looking for doesn't exist, was moved, or you may have mistyped the address.",
  hideLinks = false,
}: NotFoundProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="h-8 w-8" />
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight text-primary">{code}</h1>
        <p className="mt-3 text-xl font-semibold">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        {code === "404" && (
          <p className="mt-3 inline-block max-w-full truncate rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
            {location.pathname}
          </p>
        )}

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

        {!hideLinks && (
          <div className="mt-8 border-t border-border pt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Or jump to
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
