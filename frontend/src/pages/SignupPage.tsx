import {
  type ComponentType,
  type FormEvent,
  type ReactNode,
  useId,
  useState,
} from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  CircleAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
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
import { LoadingState } from "@/components/LoadingState";
import { resendSignupOtp, signup } from "@/api/auth";
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

type SignupStep = "register" | "verify";

export function SignupPage() {
  const { completeSignup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  const usernameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const otpId = useId();

  const [step, setStep] = useState<SignupStep>("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signup({ username, email, password });
      setEmail(response.email);
      setStep("verify");
      setInfo("We sent a 6-digit code to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      await completeSignup({ email, otp });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setIsResending(true);

    try {
      await resendSignupOtp(email);
      setInfo("A new verification code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code");
    } finally {
      setIsResending(false);
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
            Start your Askyy workspace today.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-sidebar-foreground/80">
            Create an account, verify your email, and jump straight into smarter
            conversations with your team.
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
              {step === "register"
                ? "Create your account"
                : "Verify your email"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === "register"
                ? "Fill in your details to get started."
                : `Enter the 6-digit code we sent to ${email}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {step === "register" ? (
              <form
                onSubmit={(event) => void handleRegister(event)}
                className="space-y-5"
                noValidate
              >
                {error && (
                  <Alert variant="destructive">
                    <CircleAlert />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
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
                      placeholder="Choose a username"
                      className="h-11 bg-background pl-9"
                    />
                  </IconField>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={emailId}>Email</Label>
                  <IconField icon={Mail}>
                    <Input
                      id={emailId}
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
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
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
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

                <div className="space-y-2">
                  <Label htmlFor={confirmPasswordId}>Confirm password</Label>
                  <IconField icon={Lock}>
                    <Input
                      id={confirmPasswordId}
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Repeat your password"
                      className="h-11 bg-background pl-9"
                    />
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
                      Creating account…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={(event) => void handleVerify(event)}
                className="space-y-5"
                noValidate
              >
                {error && (
                  <Alert variant="destructive">
                    <CircleAlert />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {info && (
                  <Alert>
                    <ShieldCheck />
                    <AlertDescription>{info}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor={otpId}>Verification code</Label>
                  <IconField icon={ShieldCheck}>
                    <Input
                      id={otpId}
                      type="text"
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={otp}
                      onChange={(event) =>
                        setOtp(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="000000"
                      className="h-11 bg-background pl-9 tracking-[0.3em]"
                    />
                  </IconField>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full text-base"
                  size="lg"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="text-primary-foreground" />
                      Verifying…
                    </>
                  ) : (
                    "Verify and sign in"
                  )}
                </Button>

                <div className="flex flex-col gap-3 text-center text-sm">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0"
                    disabled={isResending}
                    onClick={() => void handleResend()}
                  >
                    {isResending ? "Sending…" : "Resend code"}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-muted-foreground"
                    onClick={() => {
                      setStep("register");
                      setOtp("");
                      setError(null);
                      setInfo(null);
                    }}
                  >
                    Back to signup
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
