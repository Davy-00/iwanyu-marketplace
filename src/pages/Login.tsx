import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StorefrontPage from "@/components/StorefrontPage";
import { useAuth } from "@/context/auth";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const state = location.state as { from?: { pathname?: string } } | null;
  const nextPath = state?.from?.pathname || "/account";

  useEffect(() => {
    if (user) navigate(nextPath, { replace: true });
  }, [user, navigate, nextPath]);

  return (
    <StorefrontPage>
      <div className="container py-10">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Sign in to manage your account and sell products.</p>

              {supabase ? (
                <Button
                  className="w-full rounded-full bg-iwanyu-primary text-white hover:bg-iwanyu-primary/90"
                  onClick={async () => {
                    setError(null);

                    const { error: e } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}/login` },
                    });

                    if (e) setError(e.message);
                  }}
                >
                  Continue with Google
                </Button>
              ) : (
                <div className="rounded-lg border border-iwanyu-border bg-white p-4 text-sm text-gray-700">
                  <div className="font-semibold">Supabase auth is not configured</div>
                  <div className="mt-1 text-gray-600">
                    Set <span className="font-mono">VITE_SUPABASE_URL</span> and <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>.
                  </div>
                </div>
              )}

              {error ? <div className="text-sm text-red-600">{error}</div> : null}

              <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/")}
              >
                Continue shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </StorefrontPage>
  );
}
