import React, { useState } from 'react';
import { Sprout, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [adminCode, setAdminCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { email, password, name, role, adminCode: role === 'admin' ? adminCode.trim() : undefined };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store in session
      localStorage.setItem('mao_authenticated_user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setEmail('admin@mao.gov.ph');
      setPassword('admin123');
    } else {
      setEmail('user@mao.gov.ph');
      setPassword('user123');
    }
    setIsLogin(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" id="auth-screen">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Banner Section */}
        <div className="bg-slate-900 px-6 py-8 text-center text-white relative">
          <div className="absolute top-0 right-0 left-0 bottom-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
          <div className="inline-flex rounded-2xl bg-indigo-600 p-3 mb-3 text-white shadow-md">
            <Sprout className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Municipal Agri Office</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold font-mono">
            Repository Management System
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-150 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                isLogin 
                  ? 'border-indigo-600 text-indigo-600 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                !isLogin 
                  ? 'border-indigo-600 text-indigo-600 font-bold' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-50 p-3.5 text-xs text-rose-800 border border-rose-100 animate-in fade-in duration-200">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Error:</span> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Account Type / Privilege
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value as 'admin' | 'user');
                      if (e.target.value === 'user') setAdminCode('');
                    }}
                    className="w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50 font-sans"
                  >
                    <option value="user">Staff Member (User)</option>
                    <option value="admin">Administrative Director (Admin)</option>
                  </select>
                </div>

                {role === 'admin' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      Admin Creation Code
                    </label>
                    <input
                      type="text"
                      required
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      placeholder="e.g. ADM-123456"
                      className="w-full rounded-lg border border-amber-200 py-2 px-3 text-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-hidden bg-amber-50/30 font-mono text-amber-900"
                    />
                    <p className="text-[10px] text-amber-600 mt-1">
                      Ask an existing administrator to generate an Authorization Code for you.
                    </p>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Email or Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@mao.gov.ph or mao-fisheries"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? (
                'Sign Into Account'
              ) : (
                'Register New Account'
              )}
            </button>
          </form>

          {/* Quick-test credentials banner */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Test Accounts
            </span>
            <div className="flex gap-2.5 justify-center mt-2.5">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-lg px-2.5 py-1.5 hover:bg-indigo-100 transition-all cursor-pointer"
              >
                Director (Admin)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('user')}
                className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 rounded-lg px-2.5 py-1.5 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                Staff (User)
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              Passwords are: admin123 / user123
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
