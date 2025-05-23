import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Github, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Auth() {
  const {
    mode,
    signInWithEmail,
    signInWithGoogle,
    signInWithGitHub,
    signUp,
    continueAsGuest,
  } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (mode) {
    // If sample data was just generated and a navigation is needed, handle it here
    return <Navigate to="/" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          return;
        }
        await signUp(email, password);
        // Generate sample data for first-time authenticated user
        localStorage.setItem("sampleDataGenerated", "true");
        // Optionally, trigger navigation or UI update here if needed
      } else {
        await signInWithEmail(email, password);
      } // No reload here, let SPA handle navigation
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Chronotes</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Create an account to get started"
              : "Sign in to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            {isSignUp && (
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              {isSignUp ? "Sign Up" : "Sign In"} with Email
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
                {/* //continue with */}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            {/* <Button //google */}
            {/*   variant="outline" */}
            {/*   onClick={signInWithGoogle} */}
            {/*   disabled={loading} */}
            {/* > */}
            {/*   <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"> */}
            {/*     <path */}
            {/*       d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" */}
            {/*       fill="#4285F4" */}
            {/*     /> */}
            {/*     <path */}
            {/*       d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" */}
            {/*       fill="#34A853" */}
            {/*     /> */}
            {/*     <path */}
            {/*       d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" */}
            {/*       fill="#FBBC05" */}
            {/*     /> */}
            {/*     <path */}
            {/*       d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" */}
            {/*       fill="#EA4335" */}
            {/*     /> */}
            {/*   </svg> */}
            {/*   Google */}
            {/* </Button> */}
            {/**/}
            {/* <Button //github */}
            {/*   variant="outline" */}
            {/*   onClick={signInWithGitHub} */}
            {/*   disabled={loading} */}
            {/* > */}
            {/*   <Github className="mr-2 h-4 w-4" /> */}
            {/*   GitHub */}
            {/* </Button> */}

            <Button
              variant="secondary"
              onClick={async () => {
                await continueAsGuest();
                navigate("/", { replace: true }); // Ensure UI updates after guest login and sample data generation
              }}
              disabled={loading}
            >
              Continue as Guest
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full text-lg"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setConfirmPassword("");
            }}
            disabled={loading}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
