import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');
      
      login(data.access_token);
      navigate('/analyze');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-4 selection:bg-purple-100 selection:text-purple-900 font-sans">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2.5 text-[#121214] no-underline focus:outline-none group">
          <img src="/iris-logo.png" alt="Iris Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold tracking-tight">Iris</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[#E6E4DE] p-8 relative overflow-hidden">
          {/* Subtle gradient effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-orange-400 to-red-500"></div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#121214] tracking-tight mb-2">Welcome back</h2>
            <p className="text-sm text-[#4A4950]">Enter your details to access your account.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#121214] block" htmlFor="email">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#E6E4DE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white text-[#121214]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#121214] block" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-2.5 border border-[#E6E4DE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white text-[#121214]"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                <span className="text-[#4A4950]">Remember me</span>
              </label>
              <a href="#" className="text-purple-600 font-medium hover:text-purple-700 hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#121214] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#25252A] transition-colors mt-2 shadow-md shadow-black/10"
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#4A4950]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
