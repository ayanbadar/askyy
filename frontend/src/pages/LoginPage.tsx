import {
  type ComponentType,
  type FormEvent,
  type ReactNode,
  useId,
  useState,
} from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { LoadingState } from "@/components/LoadingState";
import { Separator } from "@/components/ui/separator";
import { isGoogleSignInEnabled } from "@/config/google";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function IconField({
  icon: Icon,
  children,
  className,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      {children}
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <MessageSquare className="size-5" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Askyy</span>
    </div>
  );
}

export function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const usernameId = useId();
  const passwordId = useId();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <LoadingState label="Checking session…" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section
        className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:p-14"
        aria-hidden
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(204,120,92,0.22),transparent_50%)]" />

        <BrandMark className="relative" />

        <div className="relative max-w-lg space-y-5">
          <h1 className="font-serif text-4xl leading-[1.15] text-sidebar-foreground">
            Your workspace for smarter conversations.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-sidebar-foreground/80">
            Sign in to access your dashboard, manage chats, and connect with
            your team in one place.
          </p>
        </div>

        <p className="relative text-sm text-sidebar-foreground/60">
          &copy; {new Date().getFullYear()} Askyy. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-10 sm:px-10">
        <div className="mb-8 w-full max-w-[420px] lg:hidden">
          <BrandMark />
        </div>

        <Card className="w-full max-w-[420px] border-border bg-card py-6 shadow-lg ring-1 ring-border/50">
          <CardHeader className="border-b border-border/60 pb-6">
            <CardTitle className="font-serif text-2xl font-normal text-card-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              {isGoogleSignInEnabled
                ? "Sign in with Google or your username and password."
                : "Sign in with your username and password."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="space-y-5"
              noValidate
            >
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isGoogleSignInEnabled && (
                <div className="flex w-full flex-col items-center gap-5">
                  <GoogleSignInButton
                    disabled={isSubmitting}
                    onSuccess={async (idToken) => {
                      setError(null);
                      setIsSubmitting(true);
                      try {
                        await loginWithGoogle(idToken);
                        navigate(from, { replace: true });
                      } catch (err) {
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Google sign-in failed",
                        );
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    onError={() =>
                      setError("Google sign-in was cancelled or failed.")
                    }
                  />
                  <div className="flex w-full items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={usernameId}>Username</Label>
                <IconField icon={User}>
                  <Input
                    id={usernameId}
                    type="text"
                    name="username"
                    autoComplete="username"
                    required
                    autoFocus
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Enter your username"
                    className="h-11 bg-background pl-9"
                  />
                </IconField>
              </div>

              <div className="space-y-2">
                <Label htmlFor={passwordId}>Password</Label>
                <IconField icon={Lock}>
                  <Input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="h-11 bg-background pr-10 pl-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1 -translate-y-1/2"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </IconField>
              </div>

              <Button
                type="submit"
                className="h-11 w-full text-base"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="text-primary-foreground" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
