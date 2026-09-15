import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { Shield, AlertCircle, Copy, QrCode, Trash2, CheckCircle, Ghost, Lock, Clock, Eye, ShieldCheck, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import QRCode from 'qrcode';
import { ErrorBoundary } from '../components/ErrorBoundary';

interface LocalNote {
  id: string;
  destructionToken: string;
  createdAt: number;
}

interface NoteStatus {
  id: string;
  destructionToken: string;
  createdAt: number;
  expiryTimestamp: number;
  viewCount: number;
  viewLimit: number;
  isEncrypted: boolean;
  hasPassword: boolean;
  status: 'active' | 'burned';
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [notes, setNotes] = useState<NoteStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrModal, setQrModal] = useState<{url: string, id: string} | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchLocalNotes = async () => {
      try {
        setLoading(true);
        const storedStr = localStorage.getItem('sent_notes');
        const localNotes: LocalNote[] = storedStr ? JSON.parse(storedStr) : [];
        
        if (localNotes.length === 0) {
          setNotes([]);
          setLoading(false);
          return;
        }

        const noteStatuses: NoteStatus[] = [];
        
        await Promise.all(localNotes.map(async (local) => {
          try {
            const docRef = doc(db, 'messages', local.id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const data = docSnap.data();
              
              let isBurned = false;
              if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
                isBurned = true;
              }
              if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
                isBurned = true;
              }
              
              noteStatuses.push({
                id: local.id,
                destructionToken: local.destructionToken,
                createdAt: local.createdAt || Date.now(),
                expiryTimestamp: data.expiryTimestamp || 0,
                viewCount: data.viewCount || 0,
                viewLimit: data.viewLimit || 1,
                isEncrypted: data.isEncrypted || true,
                hasPassword: data.hasPassword || false,
                status: isBurned ? 'burned' : 'active'
              });
            } else {
              noteStatuses.push({
                id: local.id,
                destructionToken: local.destructionToken,
                createdAt: local.createdAt || Date.now(),
                expiryTimestamp: 0,
                viewCount: 1,
                viewLimit: 1,
                isEncrypted: true,
                hasPassword: false,
                status: 'burned'
              });
            }
          } catch (e) {
            console.error(`Error fetching note ${local.id}`, e);
            // Graceful fallback for missing Firebase config or failed network requests
            noteStatuses.push({
              id: local.id,
              destructionToken: local.destructionToken,
              createdAt: local.createdAt || Date.now(),
              expiryTimestamp: 0,
              viewCount: 0,
              viewLimit: 1,
              isEncrypted: true,
              hasPassword: false,
              status: 'active'
            });
          }
        }));
        
        noteStatuses.sort((a, b) => b.createdAt - a.createdAt);
        setNotes(noteStatuses);
      } catch (err: any) {
        console.error('Failed to read from localStorage:', err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocalNotes();
  }, []);

  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full px-6 text-center text-text-muted">
        Loading dashboard...
      </div>
    );
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/msg/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showQr = async (id: string) => {
    const url = `${window.location.origin}/msg/${id}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#050000', light: '#ffffff' }
      });
      setQrModal({ url: qrDataUrl, id });
    } catch(err) {
      console.error(err);
    }
  };

  const revokeNote = async (id: string, token: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, destructionToken: token })
      });
      if (res.ok) {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'burned' } : n));
      } else {
         setNotes(prev => prev.map(n => n.id === id ? { ...n, status: 'burned' } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getExpirationText = (expiryTimestamp: number, status: string) => {
    if (status === 'burned') return '—';
    if (!expiryTimestamp) return 'Never';
    const diff = expiryTimestamp - Date.now();
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Expires in ${days}d ${hours % 24}h`;
    if (hours > 0) return `Expires in ${hours}h ${minutes % 60}m`;
    return `Expires in ${minutes}m`;
  };

  let content;

  if (loading) {
    content = (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] w-full">
        <div className="w-8 h-8 border-2 border-violet border-t-transparent rounded-full animate-spin" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] w-full px-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4 opacity-80" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Error Loading Dashboard</h2>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  } else if (notes.length === 0) {
    content = (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center max-w-lg mx-auto text-center relative"
        >
          {/* Background subtle glow */}
          <div className="absolute inset-0 bg-violet/10 blur-[120px] rounded-full w-full h-full -z-10" />
          
          <motion.div 
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="relative w-32 h-32 mb-8 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-violet/10 rounded-[2rem] rotate-6 scale-105 border border-violet/20" />
            <div className="absolute inset-0 bg-panel border border-hairline rounded-[2rem] -rotate-3 shadow-2xl" />
            <Ghost className="w-14 h-14 text-violet relative z-10 drop-shadow-[0_0_15px_rgba(239,35,60,0.5)]" />
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4 tracking-tight">
            No Active Secrets
          </h2>
          <p className="text-text-muted mb-10 text-lg leading-relaxed max-w-md mx-auto">
            You haven't created any self-destructing notes yet, or your previous notes have already vanished into the ether.
          </p>
          
          <Link 
            to="/create"
            className="group relative inline-flex items-center gap-3 bg-violet text-white font-medium px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(239,35,60,0.3)] hover:shadow-[0_0_40px_rgba(239,35,60,0.5)]"
          >
            <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            <span>Create a Secret Note</span>
          </Link>
        </motion.div>
      </div>
    );
  } else {
    const totalCreated = notes.length;
    const activeCount = notes.filter(n => n.status === 'active').length;
    const burnedCount = notes.filter(n => n.status === 'burned').length;

    content = (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full animate-in fade-in duration-500">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-2">
              Dashboard
            </h1>
            <p className="text-text-muted">Manage your local self-destructing notes.</p>
          </div>
          <Link 
            to="/create"
            className="bg-violet hover:bg-violet/90 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)] flex items-center gap-2 w-fit"
          >
            Create Secret
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
          <div className="bg-panel border border-hairline rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 text-text-muted mb-4">
              <ShieldCheck className="w-5 h-5 text-violet" />
              <span className="font-medium">Total Secrets Created</span>
            </div>
            <div className="text-4xl font-display font-bold text-text-primary">{totalCreated}</div>
          </div>
          
          <div className="bg-panel border border-hairline rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Eye className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 text-text-muted mb-4">
              <Clock className="w-5 h-5 text-amber" />
              <span className="font-medium">Active (Unread) Secrets</span>
            </div>
            <div className="text-4xl font-display font-bold text-text-primary">{activeCount}</div>
          </div>
          
          <div className="bg-panel border border-hairline rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Ghost className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 text-text-muted mb-4">
              <Ghost className="w-5 h-5 text-text-secondary" />
              <span className="font-medium">Destroyed / Expired</span>
            </div>
            <div className="text-4xl font-display font-bold text-text-primary">{burnedCount}</div>
          </div>
        </div>

        <div className="bg-panel border border-hairline rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-text-muted bg-white/5">
                <tr>
                  <th className="px-6 py-4 font-medium">Note ID</th>
                  <th className="px-6 py-4 font-medium">Created At</th>
                  <th className="px-6 py-4 font-medium">Expiration</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {notes.map((note) => (
                  <tr key={note.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-text-secondary bg-ink px-2 py-1 rounded-md text-xs border border-hairline">
                        {note.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(note.createdAt).toLocaleString(undefined, { 
                        year: 'numeric', month: 'short', day: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {getExpirationText(note.expiryTimestamp, note.status)}
                    </td>
                    <td className="px-6 py-4">
                      {note.status === 'active' ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-green-400/10 text-green-400 w-fit">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md bg-red-400/10 text-red-400 w-fit">
                          <Ghost className="w-3.5 h-3.5" />
                          <span>Burned</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-2 opacity-100 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity">
                      {note.status === 'active' ? (
                        <>
                          <button 
                            onClick={() => copyLink(note.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors"
                            title="Copy Link"
                          >
                            {copiedId === note.id ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => showQr(note.id)}
                            className="p-2 hover:bg-white/10 rounded-lg text-text-secondary hover:text-white transition-colors"
                            title="Show QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => revokeNote(note.id, note.destructionToken)}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 rounded-lg text-red-400/80 hover:text-red-400 transition-colors ml-2 border border-transparent hover:border-red-500/20"
                            title="Revoke / Destroy Now"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Revoke</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-text-muted text-xs italic px-3 py-1.5">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="w-full flex-1 flex flex-col">
        {content}
        
        {/* QR Code Modal */}
        <AnimatePresence>
          {qrModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm"
              onClick={() => setQrModal(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-panel border border-hairline p-8 rounded-3xl max-w-sm w-full shadow-2xl relative"
              >
                <button 
                  onClick={() => setQrModal(null)}
                  className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-text-primary mb-6 text-center">Share Secret</h3>
                <div className="bg-white p-4 rounded-xl flex items-center justify-center mb-6">
                  <img src={qrModal.url} alt="QR Code" className="w-full max-w-[200px]" />
                </div>
                <p className="text-center text-sm text-text-muted mb-4 font-mono">
                  {qrModal.id.substring(0, 12)}...
                </p>
                <button 
                  onClick={() => { copyLink(qrModal.id); setQrModal(null); }}
                  className="w-full py-3 bg-violet/10 text-violet hover:bg-violet/20 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Link
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
