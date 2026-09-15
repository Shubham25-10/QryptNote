import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { motion } from 'motion/react';
import { useUser } from '../hooks/useUser';
import { Link, useNavigate } from 'react-router';
import { Shield, CreditCard, Calendar, CheckCircle, History, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: number;
}

interface Note {
  id: string;
  createdAt: number;
  expiryTimestamp: number;
  viewCount: number;
  viewLimit: number;
  isEncrypted: boolean;
  hasPassword: boolean;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { userEmail, isPro, loading: userLoading } = useUser();
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const fetchData = async () => {
      try {
        const paymentsPromise = fetch(`/api/users/${encodeURIComponent(userEmail)}/payments`);
        const notesQuery = query(
          collection(db, 'messages'),
          where('createdBy', '==', userEmail),
          orderBy('createdAt', 'desc')
        );
        const notesPromise = getDocs(notesQuery);

        const [paymentsRes, notesSnap] = await Promise.all([
          paymentsPromise,
          notesPromise
        ]);
        
        if (!paymentsRes.ok) throw new Error("Failed to fetch dashboard payments data");
        
        const paymentsData = await paymentsRes.json();
        const notesData = notesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Note[];
        
        setPayments(paymentsData.payments || []);
        setNotes(notesData || []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userEmail]);

  const handleAccessDashboard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !/^\S+@\S+\.\S+$/.test(emailInput)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    localStorage.setItem('qryptnote_user_email', emailInput);
    window.dispatchEvent(new Event('qryptnote-user-updated'));
  };

  let content;

  if (userLoading) {
    content = (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] animate-in fade-in duration-300">
        <div className="w-8 h-8 border-2 border-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  } else if (!userEmail) {
    content = (
      <div className="max-w-md mx-auto px-6 py-24 min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-panel border border-hairline rounded-3xl p-8 w-full shadow-xl">
          <div className="w-16 h-16 bg-violet/10 text-violet rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary text-center mb-2">Access Dashboard</h2>
          <p className="text-sm text-text-muted text-center mb-8">
            Enter the email address you used for purchases to view your transaction history.
          </p>
          
          <form onSubmit={handleAccessDashboard} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="Enter your email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-ink border border-hairline rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-violet transition-colors"
              />
            </div>
            
            {error && (
              <div className="text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-violet hover:bg-violet/90 text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)]"
            >
              View Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-2">
            Account Dashboard
          </h1>
          <p className="text-text-muted">Manage your QryptNote account and view transaction history.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar / Profile Summary */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-panel border border-hairline rounded-2xl p-6"
            >
              <div className="w-12 h-12 bg-violet/10 text-violet rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-medium text-text-primary truncate" title={userEmail}>
                {userEmail}
              </h2>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-text-muted">Current Plan</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-md ${isPro ? 'bg-amber/10 text-amber' : 'bg-white/5 text-text-secondary'}`}>
                  {isPro ? 'Pro Subscription' : 'Free / Pay-As-You-Go'}
                </span>
              </div>
              
              {!isPro && (
                <div className="mt-6 pt-6 border-t border-hairline">
                  <Link
                    to="/pricing"
                    className="block w-full py-2.5 px-4 bg-amber/10 hover:bg-amber/20 border border-amber/20 text-amber text-sm font-medium rounded-xl text-center transition-colors"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Main Content / Payment History */}
        <div className="lg:col-span-2">
          {/* Notes History */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-panel border border-hairline rounded-2xl overflow-hidden mb-8"
          >
            <div className="px-6 py-5 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet" />
                <h3 className="text-lg font-medium text-text-primary">Created Notes</h3>
              </div>
            </div>
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-violet border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-text-primary font-medium mb-1">No notes found</h4>
                <p className="text-sm text-text-muted max-w-sm mx-auto">
                  You haven't created any secure notes yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-text-muted bg-white/5">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Link</th>
                      <th className="px-6 py-4 font-medium">Views</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {notes.map((note) => (
                      <tr key={note.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-text-secondary">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-50" />
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          <Link to={`/msg/${note.id}`} className="text-violet hover:underline truncate inline-block max-w-[200px]">
                            {window.location.origin}/msg/{note.id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-text-primary font-medium">
                          {note.viewCount} / {note.viewLimit}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md w-fit ${note.viewCount >= note.viewLimit || (note.expiryTimestamp && Date.now() > note.expiryTimestamp) ? "bg-red-400/10 text-red-400" : "bg-green-400/10 text-green-400"}`}>
                            <span className="capitalize">{note.viewCount >= note.viewLimit ? "Destroyed" : (note.expiryTimestamp && Date.now() > note.expiryTimestamp) ? "Expired" : "Active"}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-panel border border-hairline rounded-2xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet" />
                <h3 className="text-lg font-medium text-text-primary">Payment History</h3>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-violet border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{error}</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="text-text-primary font-medium mb-1">No transactions found</h4>
                <p className="text-sm text-text-muted max-w-sm mx-auto">
                  You haven't made any payments yet. Subscribe to Pro or use Pay-As-You-Go to see your history here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-text-muted bg-white/5">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Description</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-text-secondary">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 opacity-50" />
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-text-primary">
                          {payment.type === 'subscription' ? 'Pro Subscription' : 'Pay-As-You-Go Note'}
                          <div className="text-[10px] text-text-muted font-mono mt-1">ID: {payment.id}</div>
                        </td>
                        <td className="px-6 py-4 text-text-primary font-medium">
                          ${payment.amount} {payment.currency}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium bg-green-400/10 px-2 py-1 rounded-md w-fit">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="capitalize">{payment.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      {content}
    </div>
  );
}
