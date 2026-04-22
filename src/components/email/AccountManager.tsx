"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Building2, ShieldCheck, Loader2 } from "lucide-react";
import { addEmailAccount, getEmailAccounts, deleteEmailAccount } from "@/app/ref-cert-email/account-actions";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";

interface EmailAccount {
  id: string;
  emailAddress: string;
  orgName: string;
}

export default function AccountManager() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white lilita-font tracking-wider">Email Accounts</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your connected email addresses and app passwords securely.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-fuchsia-500/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          Add Account
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-fuchsia-500" size={40} />
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
            <Mail size={32} className="text-zinc-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No accounts connected</h3>
          <p className="text-zinc-500 mb-6">Connect an email account with an app password to start sending bulk emails.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-fuchsia-500 font-bold hover:underline"
          >
            Add your first account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-card p-6 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                  <Mail size={24} />
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold truncate">{acc.emailAddress}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2 mt-1">
                <Building2 size={14} />
                {acc.orgName}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                <ShieldCheck size={14} />
                Encrypted & Secure
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Connect New Account"
      >
        <form onSubmit={handleAddAccount} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                placeholder="e.g. club@gmail.com"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Organization Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                placeholder="e.g. Finite Loop Club"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">App Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
                placeholder="•••• •••• •••• ••••"
                value={formData.appPassword}
                onChange={(e) => setFormData({ ...formData, appPassword: e.target.value })}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1 px-2">
              Generate this in your Google Account settings. This password is encrypted before being stored.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Connect Account
          </button>
        </form>
      </Modal>
    </div>
  );
}
