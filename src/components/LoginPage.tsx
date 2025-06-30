
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation - in a real app, you'd validate credentials
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-laine-grey flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-primary mb-2">Laine Homes</h1>
            <div className="w-12 h-1 bg-accent mx-auto rounded"></div>
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
            >
              Login
            </Button>
          </form>
          
          <div className="text-center">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary underline">
              Forgot password?
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
