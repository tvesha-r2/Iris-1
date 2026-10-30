import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { API_BASE } from '../lib/api';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      
      navigate('/login');
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
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-400 to-purple-500"></div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#121214] tracking-tight mb-2">Create an account</h2>
            <p className="text-sm text-[#4A4950]">Join us to start optimizing your thumbnails.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#121214] block" htmlFor="name">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#E6E4DE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white text-[#121214]"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  placeholder="Create a password"
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

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#121214] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#25252A] transition-colors mt-2 shadow-md shadow-black/10"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#4A4950]">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
