
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your.email@example.com"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="w-full"
              />
            </div>
          </div>
          
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            Login
          </Button>
          
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
