import React, { useState } from 'react';
import { User, Mail, Lock, Shield, Save, CheckCircle, AlertCircle, Eye, EyeOff, Camera, Trash2 } from 'lucide-react';
import { UserAccount } from '../types';

interface ProfileProps {
  user: UserAccount;
  onUpdateUser: (updatedUser: UserAccount) => void;
}

export default function Profile({ user, onUpdateUser }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.username || user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user.avatar || null);
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrorMsg("Selected image file is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (password && password !== confirmPassword) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        id: user.id,
        name,
        email,
        avatar
      };
      if (password) {
        payload.password = password;
      }

      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile settings.');
      }

      onUpdateUser(data.user);
      setSuccessMsg("Your profile settings have been updated successfully!");
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const userRoleDisplay = user.role === 'admin' 
    ? 'Administrative Director' 
    : 'Staff Member';

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6" id="profile-settings-page">
      {/* Page Header */}
      <div className="border-b border-gray-150 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-display">Account Profile Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal credentials, contact name, and system password settings below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column Stack */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card / Info Summary */}
          <div className="bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs space-y-6">
          <div className="text-center">
            <div className="relative inline-block group">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-slate-100 bg-indigo-600 text-white flex items-center justify-center font-bold text-3xl shadow-md mx-auto uppercase relative">
                {avatar ? (
                  <img src={avatar} alt="Profile Avatar" className="h-full w-full object-cover" />
                ) : (
                  user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'US'
                )}
                
                {/* Hover overlay for quick selection */}
                <button
                  type="button"
                  onClick={() => document.getElementById('avatar-input')?.click()}
                  className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer text-[10px] font-bold"
                >
                  <Camera className="h-5 w-5 mb-1" />
                  Update
                </button>
              </div>
              
              <span className="absolute bottom-0 right-0 rounded-full bg-emerald-500 p-1.5 text-white border-2 border-white shadow-xs">
                <Shield className="h-3 w-3" />
              </span>
            </div>

             <input
              type="file"
              id="avatar-input"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            
            {avatar && (
              <div className="mt-3.5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-rose-100 text-xs font-semibold text-rose-600 hover:bg-rose-50 bg-white transition-colors cursor-pointer shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Photo
                </button>
              </div>
            )}
            
            <h3 className="text-base font-bold text-gray-900 mt-4">{user.name}</h3>
            <p className="text-xs font-semibold font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-2.5 py-1 mt-2 inline-block">
              {userRoleDisplay}
            </p>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">User Account ID:</span>
              <span className="font-mono font-semibold text-gray-950">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Current Role Privilege:</span>
              <span className="font-semibold text-gray-950 uppercase text-[10px] tracking-wider">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-medium">Primary Email:</span>
              <span className="font-semibold text-gray-950">{user.email}</span>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-bold text-slate-700 block">Security Guideline</span>
            <span>Always use secure passwords. To update your password, use the form. Leave the password fields blank to keep your current password.</span>
          </div>
        </div>
      </div>

      {/* Update Form Card */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h3 className="text-sm font-bold text-gray-900">Modify Account Credentials</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
            {successMsg && (
              <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-800 border border-emerald-100 animate-in fade-in duration-200">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-bold">Success!</span> {successMsg}
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-start gap-3 rounded-lg bg-rose-50 p-4 text-xs text-rose-800 border border-rose-100 animate-in fade-in duration-200">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-lg bg-indigo-50/60 p-4 text-xs text-indigo-800 border border-indigo-100 animate-in fade-in duration-200">
              <Shield className="h-5 w-5 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-bold">Credential Security Protection:</span> Login credentials (username and password) can only be managed and issued by the system Administrator for security compliance. Only the display <strong>Full Name</strong> is modifiable in this panel.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/20"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    disabled={true}
                    placeholder="Username"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm bg-slate-100 text-gray-400 cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-gray-100 my-4" />

            <div className="space-y-2 opacity-65">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Update Password (Disabled)</h4>
              <p className="text-[11px] text-gray-400">Section passwords are managed by administrators and cannot be altered here.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-65">
              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value=""
                    placeholder="Locked"
                    disabled={true}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm bg-slate-100 text-gray-400 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value=""
                    placeholder="Locked"
                    disabled={true}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm bg-slate-100 text-gray-400 cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="border-t border-gray-100 pt-5 flex justify-end">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Profile Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
