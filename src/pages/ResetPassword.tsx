import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import laineHomesLogo from "@/assets/laine-homes-logo.svg";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

type Mode = "request" | "set-new" | "done";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Detect recovery token in URL hash (Supabase appends #type=recovery&access_token=...)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("set-new");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  const handleSetNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMode("done");
    setTimeout(() => navigate("/"), 3000);
  };

  return (
    <div className="min-h-screen bg-laine-grey flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo block */}
        <div className="flex justify-center mb-8">
          <div className="bg-primary rounded-2xl px-8 py-6 shadow-lg">
            <img src={laineHomesLogo} alt="Laine Homes" className="h-14 mx-auto" />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          {/* ── Request reset ── */}
          {mode === "request" && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">Reset your password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {sent ? (
                <div className="flex items-start gap-3 bg-accent/40 border border-accent text-accent-foreground rounded-lg px-4 py-3 text-sm">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox.
                  </span>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 mb-5 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </form>
                </>
              )}
            </>
          )}

          {/* ── Set new password ── */}
          {mode === "set-new" && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 mb-5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSetNew} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    required
                    autoComplete="new-password"
                    className={error && error.includes("character") ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    required
                    autoComplete="new-password"
                    className={error && error.includes("match") ? "border-destructive" : ""}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* ── Done ── */}
          {mode === "done" && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-accent-foreground mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Password updated!</h2>
              <p className="text-sm text-muted-foreground">You'll be redirected to sign in shortly.</p>
            </div>
          )}

          {/* Back link */}
          {mode !== "done" && (
            <p className="text-center text-xs text-muted-foreground mt-6">
              <Link to="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
