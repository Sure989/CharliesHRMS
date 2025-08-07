
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Building, TrendingUp, Award, Clock, FileText } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await login(email, password);
    
    if (success) {
      toast({
        title: "Login successful",
        description: "Welcome to Charlie's HRMS!",
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Charlie's HRMS</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Login to Charlie's HRMS</h1>
            <p className="text-gray-600">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Username / Email ID</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">Forgot Password?</a>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <a href="#" className="hover:text-gray-700">Terms & Conditions</a>
              <a href="#" className="hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700">How to Support</a>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Copyright 2025 Charlie's HRMS</p>
          </div>
        </div>
      </div>

      {/* Right Panel - HR Features Showcase */}
      <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-8 py-12">
        <div className="max-w-lg text-white">
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Users className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Employee Management</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Building className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Organization</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Performance</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Award className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Leadership</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Clock className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Time Tracking</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <FileText className="w-8 h-8 text-blue-300 mb-2" />
              <span className="text-xs text-center">Reports</span>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              <span className="text-blue-300">HUMAN</span><br />
              <span className="text-white">RESOURCES</span>
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Charlie's HRMS has been one of the best HR solutions we came across and is very affordable. The solution covers all important aspects of human resources and is recommended for companies of all sizes.
            </p>
            <div className="text-right">
              <p className="text-sm text-gray-400">Sure Arnold</p>
              <p className="text-xs text-gray-500">Hachete Design</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
