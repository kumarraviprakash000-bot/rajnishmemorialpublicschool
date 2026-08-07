import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAuth, homeForRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SCHOOL_NAME } from "@/lib/format";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Rajnish Memorial Public School — School Management Portal" },
      {
        name: "description",
        content:
          "Official portal of Rajnish Memorial Public School for fees, attendance, notices, homework and results.",
      },
      { property: "og:title", content: "Rajnish Memorial Public School — School Portal" },
      {
        property: "og:description",
        content: "Fees, attendance, notices, homework and results in one place for parents and staff.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: homeForRole(role), replace: true });
  }, [loading, session, role, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="brand-gradient mb-6 flex size-16 items-center justify-center rounded-2xl text-lg font-bold text-primary-foreground">
        RM
      </span>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{SCHOOL_NAME}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        School management portal for administrators, teachers and parents — fees, attendance,
        notices, homework and results.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link to="/auth">Sign in to continue</Link>
      </Button>
    </div>
  );
}
