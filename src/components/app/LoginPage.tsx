'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { loginUser, getInstitute } from '@/lib/firebase-service';
import { useAuthStore } from '@/lib/store';
import { FlaskConical, LogIn, UserPlus, Loader2, Copy, Check } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onShowRegister: () => void;
}

export function LoginPage({ onLoginSuccess, onShowRegister }: LoginPageProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await loginUser(emailOrUsername, password);
      login(user);
      
      // If institute owner, fetch and show their referral code
      if (user.role === 'institute_owner' && user.instituteId) {
        const institute = await getInstitute(user.instituteId);
        if (institute) {
          toast({
            title: 'Welcome back!',
            description: `Logged in as ${user.name}. Your referral code: ${institute.referralCode}`,
            action: (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(institute.referralCode)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Code
              </Button>
            ),
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: `Logged in as ${user.name}`,
          });
        }
      } else {
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${user.name}`,
        });
      }
      
      onLoginSuccess();
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center"
            >
              <FlaskConical className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                ChemClass Pro
              </CardTitle>
              <CardDescription>
                Multi-Subject Progress Tracker for CBSE Class 12
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email or Username</Label>
                <Input
                  id="login-email"
                  type="text"
                  placeholder="Enter email or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Login
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Don't have an account?</p>
              <Button
                variant="outline"
                onClick={onShowRegister}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
