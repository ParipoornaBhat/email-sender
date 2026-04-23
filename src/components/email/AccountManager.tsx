"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Building2, ShieldCheck, Loader2, Key, Eye, EyeOff } from "lucide-react";
import { addEmailAccount, getEmailAccounts, deleteEmailAccount } from "@/app/bulk-sender/actions/accounts";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";

interface EmailAccount {
  id: string;
  emailAddress: string;
  orgName: string;
  appPassword?: string;
  hasHistory?: boolean;
}

export default function AccountManager() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [formData, setFormData] = useState({
    emailAddress: "",
    orgName: "Finite Loop Club",
    appPassword: "",
  });

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await getEmailAccounts();
    if (res.success && res.data) {
      setAccounts(res.data as EmailAccount[]);
    } else {
      toast.error(res.error || "Failed to load accounts");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await addEmailAccount(formData);
    if (res.success) {
      toast.success("Account added successfully");
      setIsModalOpen(false);
      setFormData({ emailAddress: "", orgName: "Finite Loop Club", appPassword: "" });
      fetchAccounts();
    } else {
      toast.error(res.error || "Failed to add account");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const account = accounts.find((a) => a.id === id);
    if (account?.hasHistory) {
      toast.error("Cannot delete this account because it has linked campaign history records.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this account?")) return;
    
    const res = await deleteEmailAccount(id);
    if (res.success) {
      toast.success("Account deleted");
      fetchAccounts();
    } else {
      toast.error(res.error || "Failed to delete account");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white lilita-font tracking-tight">Connected Accounts</h2>
          <p className="text-zinc-500 font-medium text-lg">Securely manage your club email credentials.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 !px-8 !py-4 !rounded-2xl"
        >
          <Plus size={22} />
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-flc-orange" size={48} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card p-16 text-center space-y-8 !rounded-[3rem]">
          <div className="mx-auto w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center">
            <Mail size={40} className="text-zinc-600" />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black">No Senders Yet</h3>
            <p className="text-zinc-500 text-lg max-w-md mx-auto leading-relaxed">
              Connect a Gmail account with an App Password to begin your first campaign.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-flc-orange font-black uppercase tracking-widest hover:underline text-sm"
          >
            Connect your first account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-card p-8 group !rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {!acc.hasHistory && (
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="p-2.5 rounded-xl text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-flc-orange/10 text-flc-orange flex items-center justify-center shadow-inner">
                  <Mail size={28} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black truncate text-white">{acc.emailAddress}</h3>
                  <p className="text-zinc-500 font-bold text-sm flex items-center gap-2">
                    <Building2 size={14} className="text-zinc-600" />
                    {acc.orgName}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full w-fit">
                    <ShieldCheck size={14} />
                    Verified & Secure
                  </div>
                </div>

                {acc.appPassword && (
                  <div className="mt-4 bg-zinc-900/50 rounded-xl px-4 py-3 flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-2">
                      <Key size={14} className="text-zinc-600" />
                      <span className="text-zinc-300 font-mono text-sm tracking-wider">
                        {visiblePasswords[acc.id] ? acc.appPassword : "•••• •••• •••• ••••"}
                      </span>
                    </div>
                    <button 
                      onClick={() => togglePasswordVisibility(acc.id)}
                      className="text-zinc-500 hover:text-white transition-colors p-1"
                    >
                      {visiblePasswords[acc.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect Sender"
      >
        <form onSubmit={handleAddAccount} className="space-y-8 p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                <input
                  type="email"
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none transition-all font-bold text-white"
                  placeholder="club@gmail.com"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Display Name</label>
              <div className="relative">
                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                <input
                  type="text"
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none transition-all font-bold text-white"
                  placeholder="Finite Loop Club"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">App Password</label>
              <div className="relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-zinc-900/50 border border-white/5 focus:border-flc-orange/30 focus:ring-4 focus:ring-flc-orange/5 outline-none transition-all font-bold text-white"
                  placeholder="•••• •••• •••• ••••"
                  value={formData.appPassword}
                  onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
                />
              </div>
              <p className="text-[10px] font-bold text-zinc-500 mt-2 px-2 leading-relaxed">
                Use your 16-character App Password from Google settings. It will be AES-256 encrypted.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full !py-5 !rounded-[1.5rem] flex justify-center items-center gap-3 text-lg"
          >
            {submitting ? <Loader2 className="animate-spin" size={22} /> : <Plus size={22} />}
            Connect Securely
          </button>
        </form>
      </Modal>
    </div>
  );
}
