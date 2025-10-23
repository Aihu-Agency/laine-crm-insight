
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import laineHomesLogo from "@/assets/laine-homes-logo.svg";

const LoginPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      // Update last_login for the user
      await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", userId);
    }

    toast({
      title: "Welcome",
      description: "You are now signed in.",
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-laine-grey flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="mb-6 bg-primary rounded-lg p-6">
            <img 
              src={laineHomesLogo} 
              alt="Laine Homes" 
              className="h-16 mx-auto"
            />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Sign in to Laine CRM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              Contact an admin to get access. No public sign-up.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
