import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { UsersApi } from "@/api/UsersApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconAlertCircle, IconLogin } from "@tabler/icons-react";
import { Spinner } from "@/components/ui/spinner";
import artcraftIcon from "@/assets/artcraft-icon.svg";

export function LoginPage() {
  usePageTitle("Login");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { checkSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const api = new UsersApi();
      const response = await api.Login({ usernameOrEmail, password });
      if (response.success) {
        const isModerator = await checkSession(false);
        if (!isModerator) {
          setError("You do not have admin privileges to access.");
          return;
        }
        navigate(redirectTo, { replace: true });
      } else {
        setError(response.errorMessage || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
              <img
                src={artcraftIcon}
                alt="Artcraft Logo"
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight font-outfit">
              Admin Login
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400">
              Login to your ArtCraft admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-4">
              {error && (
                <Alert variant="destructive">
                  <IconAlertCircle className="size-4" />
                  <AlertDescription>
                    {error.charAt(0).toUpperCase() + error.slice(1)}
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Email or username"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  placeholder="••••••"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Logging in...
                  </>
                ) : (
                  <>
                    <IconLogin className="size-4" />
                    Login
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
