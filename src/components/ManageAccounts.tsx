import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, Copy, Check, Trash2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types';

interface ManageAccountsProps {
  user: UserAccount;
}

export default function ManageAccounts({ user }: ManageAccountsProps) {
  const [sectionAccounts, setSectionAccounts] = useState<{ username: string; password: string; sectionName: string; createdAt: string }[]>([]);
  const [generatingAccount, setGeneratingAccount] = useState(false);
  const [targetUsername, setTargetUsername] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSectionAccounts = async () => {
    try {
      const res = await fetch('/api/auth/section-accounts');
      if (res.ok) {
        const data = await res.json();
        setSectionAccounts(data);
      }
    } catch (e) {
      console.error("Error fetching section accounts", e);
    }
  };

  useEffect(() => {
    if (user.role === 'admin') {
      fetchSectionAccounts();
    }
  }, [user.role]);

  const handleGenerateSectionAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    setGeneratingAccount(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/auth/section-accounts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUsername.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSectionAccounts(prev => [...prev, data]);
        setTargetUsername('');
        setSuccessMsg(`Account for "${data.sectionName}" generated successfully!`);
      } else {
        setErrorMsg(data.error || "Failed to generate section account.");
      }
    } catch (e) {
      console.error("Error generating section account", e);
      setErrorMsg("Error generating section account.");
    } finally {
      setGeneratingAccount(false);
    }
  };

  const handleDeleteSectionAccount = async (username: string) => {
    if (!confirm(`Are you sure you want to delete the user account for "${username}"? They will lose access immediately.`)) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/auth/section-accounts/${username}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSectionAccounts(prev => prev.filter(sa => sa.username !== username));
        setSuccessMsg(`Successfully deleted account for "${username}".`);
      } else {
        setErrorMsg("Failed to delete section account.");
      }
    } catch (e) {
      console.error("Error deleting section account", e);
      setErrorMsg("Error deleting section account.");
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="manage-accounts-page">
      {/* Page Header */}
      <div className="border-b border-gray-150 pb-5">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 font-display">Manage Office Accounts</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate, review, and configure individual access accounts for different office sections.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-xs text-emerald-800 border border-emerald-100 animate-in fade-in duration-200 max-w-4xl">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <span className="font-bold">Success!</span> {successMsg}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg bg-rose-50 p-4 text-xs text-rose-800 border border-rose-100 animate-in fade-in duration-200 max-w-4xl">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {errorMsg}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl">
        {/* Generator Form Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Key className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">User Account Code Generator</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            To protect the confidentiality of files, admins provide accounts for each office section. Enter a section username (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-bold font-mono text-[11px]">mao-fisheries</code>) and the system will generate its login credentials.
          </p>

          <form onSubmit={handleGenerateSectionAccount} className="space-y-4 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Section Username
              </label>
              <input
                type="text"
                required
                value={targetUsername}
                onChange={(e) => setTargetUsername(e.target.value)}
                placeholder="e.g. mao-fisheries"
                className="w-full rounded-lg border border-gray-200 py-2.5 px-3.5 text-xs focus:border-indigo-500 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/20 font-mono text-gray-800 shadow-3xs"
              />
            </div>

            <button
              type="submit"
              disabled={generatingAccount || !targetUsername.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
            >
              {generatingAccount ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              Generate Section Account
            </button>
          </form>

          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
              <span>Confidentiality Guideline</span>
            </div>
            <span>Office sections only have access to documents they create or upload, keeping private data secured. Admin directs high-level registries.</span>
          </div>
        </div>

        {/* Existing Accounts List Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">Office Section Accounts ({sectionAccounts.length})</h3>
          </div>

          {sectionAccounts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-400 space-y-2">
              <Key className="h-8 w-8 text-slate-300 mx-auto" />
              <p>No section accounts generated yet. Use the generator on the left.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {sectionAccounts.map((sa, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs animate-in fade-in slide-in-from-top-1 duration-150 space-y-3 relative flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">{sa.sectionName}</span>
                      <span className="text-[10px] text-gray-400">Created: {new Date(sa.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSectionAccount(sa.username)}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-100 space-y-2 font-mono text-[11px] text-gray-600 shadow-3xs">
                    <div className="flex justify-between items-center gap-1">
                      <span className="truncate">User: <strong className="text-slate-900 font-bold">{sa.username}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(sa.username, `${sa.username}-user`)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1 shrink-0 p-1 rounded hover:bg-slate-50"
                      >
                        {copiedKey === `${sa.username}-user` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500 animate-scale" />
                            <span className="text-[9px] text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-100 pt-2 gap-1">
                      <span className="truncate">Pass: <strong className="text-slate-900 font-bold">{sa.password}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(sa.password, `${sa.username}-pass`)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1 shrink-0 p-1 rounded hover:bg-slate-50"
                      >
                        {copiedKey === `${sa.username}-pass` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500 animate-scale" />
                            <span className="text-[9px] text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
