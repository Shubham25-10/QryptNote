import { MagneticElement } from "../components/MagneticElement";
import { PageTransition } from "../components/PageTransition";
import { withTimeout } from "../lib/utils";
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';
import { Lock, AlertCircle, EyeOff, Loader2, ShieldCheck, ArrowRight, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { decryptMessage, hashPassword } from '../lib/crypto';

export default function ViewPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  
  const [password, setPassword] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [message, setMessage] = useState('');
  const [readAt, setReadAt] = useState<number | null>(null);
    
  
  
  useEffect(() => {
    fetchMetadata();
  }, [id]);

  useEffect(() => {
    const destroyMessage = async () => {
      // Only destroy if the message has been decrypted and is visible
      if (message) {
        setMessage('');
        setError(t('view.destroyed_navigated', 'This message was closed because you navigated away, and can no longer be viewed'));
        if (metadata?.id) {
          try {
            const docRef = doc(db, 'messages', metadata.id);
            await deleteDoc(docRef);
          } catch (e) {
            console.error('Failed to destroy document:', e);
          }
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        destroyMessage();
      }
    };

    const handleWindowBlur = () => {
      destroyMessage();
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [message, metadata, t]);

  const fetchMetadata = async () => {

    try {
      setLoading(true);
      if (!id) throw new Error('Message not found');

      const docRef = doc(db, 'messages', id);
      const docSnap = await withTimeout(getDoc(docRef), 15000, t('errors.network_timeout'));
      
      if (!docSnap.exists()) {
        throw new Error(t('errors.msg_not_found'));
      }
      
      const data = docSnap.data();

      // Check expiry
      if (data.expiryTimestamp && Date.now() > data.expiryTimestamp) {
        throw new Error(t('errors.msg_not_found'));
      }

      // Check view limit
      if (data.viewLimit !== -1 && data.viewCount >= data.viewLimit) {
        throw new Error(t('errors.msg_view_limit'));
      }

      const meta = {
        id: data.id,
        isPasswordProtected: !!data.passwordHash,
        createdAt: data.createdAt,
        viewLimit: data.viewLimit,
        viewCount: data.viewCount,
        passwordHash: data.passwordHash,
        encryptedMessage: data.encryptedMessage
      };

      setMetadata(meta);
      
      // If no password needed, attempt to view directly
      if (!meta.isPasswordProtected) {
        await handleViewMessage(undefined, meta);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [unsealing, setUnsealing] = useState(false);
  const isSubmitting = useRef(false);

  const handleViewMessage = async (e?: React.FormEvent, directMeta?: any) => {
    if (e) e.preventDefault();
    if (isSubmitting.current) return;
    
    const meta = directMeta || metadata;
    if (!meta) return;

    try {
      isSubmitting.current = true;
      setDecrypting(true);
      setError('');
      
      // Check password
      if (meta.isPasswordProtected) {
        if (!password) {
          throw new Error(t('errors.pass_required'));
        }
        if (hashPassword(password) !== meta.passwordHash) {
          throw new Error(t('errors.pass_incorrect'));
        }
      }

      const secretKey = window.location.hash.substring(1);
      if (!secretKey) {
        throw new Error(t('errors.missing_key'));
      }

      const decrypted = decryptMessage(meta.encryptedMessage, secretKey);
      if (!decrypted) { 
        throw new Error(t('errors.decrypt_failed'));
      }

      const docRef = doc(db, 'messages', meta.id);
      
      // Increment view count
      const newViewCount = meta.viewCount + 1;
      await updateDoc(docRef, { viewCount: newViewCount });

      setUnsealing(true);
      setTimeout(() => {
        setMessage(decrypted);
        setReadAt(Date.now());
        setUnsealing(false);
      }, 1500); // 1.5s animation

    } catch (err: any) {
      setError(err.message);
      setDecrypting(false);
      isSubmitting.current = false;
    }
  };

  
  let dynamicTitle = t('view.helmet_title') || 'Secure Message - QryptNote';
  let dynamicDesc = t('view.helmet_desc') || 'You have received a secure, self-destructing message.';
  
  if (error === t('errors.msg_not_found') || error === "Message not found or expired.") {
    dynamicTitle = "Message Expired - QryptNote";
    dynamicDesc = "This message has expired and is no longer available.";
  } else if (error === t('errors.msg_view_limit') || error === "Message has reached its view limit.") {
    dynamicTitle = "Message Destroyed - QryptNote";
    dynamicDesc = "This message has reached its view limit and has been destroyed.";
  } else if (metadata) {
    if (metadata.viewLimit !== -1 && metadata.viewCount >= metadata.viewLimit) {
      dynamicTitle = "Message Destroyed - QryptNote";
      dynamicDesc = "This message has reached its view limit and has been destroyed.";
    }
  }

  const pageHelmet = (
    <Helmet>
      <title>{dynamicTitle}</title>
      <meta name="description" content={dynamicDesc} />
      <meta property="og:title" content={dynamicTitle} />
      <meta property="og:description" content={dynamicDesc} />
      <meta property="twitter:title" content={dynamicTitle} />
      <meta property="twitter:description" content={dynamicDesc} />
    </Helmet>
  );

  if (unsealing) {
    return (
<PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {pageHelmet}
        
        <div className="mb-6 p-4 bg-violet/10 border border-violet/20 rounded-xl flex items-start gap-3 opacity-50">
          <Info className="w-5 h-5 text-violet flex-shrink-0 mt-0.5 animate-pulse" />
          <div className="w-full h-4 bg-violet/20 rounded animate-pulse mt-0.5" />
        </div>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-muted text-sm font-mono font-medium animate-pulse">
            <Lock className="w-5 h-5" />
            DECRYPTING...
          </div>
        </div>
        
        <div className="bg-panel border border-hairline rounded-3xl shadow-2xl relative overflow-hidden h-[300px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-violet animate-pulse" />
          
          <div className="p-8 md:p-12 space-y-4 filter blur-sm">
            <div className="w-full h-6 bg-ink rounded animate-pulse" />
            <div className="w-[90%] h-6 bg-ink rounded animate-pulse" />
            <div className="w-[95%] h-6 bg-ink rounded animate-pulse" />
            <div className="w-[80%] h-6 bg-ink rounded animate-pulse" />
            <div className="w-[85%] h-6 bg-ink rounded animate-pulse" />
          </div>
        </div>
      </div>
      </PageTransition>
    );
  }

  if (loading) {
    return (
<PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {pageHelmet}
        
        {/* Top bar skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-ink animate-pulse" />
            <div className="w-48 h-5 rounded bg-ink animate-pulse" />
          </div>
          <div className="w-32 h-4 rounded bg-ink animate-pulse hidden sm:block" />
        </div>
        
        {/* Main card skeleton */}
        <div className="bg-panel border border-hairline rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-ink animate-pulse" />
          
          <div className="space-y-4">
            <div className="w-full h-6 rounded bg-ink animate-pulse" />
            <div className="w-11/12 h-6 rounded bg-ink animate-pulse" />
            <div className="w-4/5 h-6 rounded bg-ink animate-pulse" />
            <div className="w-full h-6 rounded bg-ink animate-pulse" />
            <div className="w-3/4 h-6 rounded bg-ink animate-pulse" />
            <div className="w-5/6 h-6 rounded bg-ink animate-pulse" />
            <div className="w-2/3 h-6 rounded bg-ink animate-pulse" />
          </div>
          
          <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-48 h-4 rounded bg-ink animate-pulse" />
            <div className="w-24 h-10 rounded bg-ink animate-pulse" />
          </div>
        </div>
      </div>
      </PageTransition>
    );
  }

  if (error && !metadata) {
    return (
<PageTransition>
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
        {pageHelmet}
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          <EyeOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2 text-center text-text-primary">{t('view.err_title', 'Message Unavailable')}</h1>
        <p className="text-text-muted max-w-md text-center mb-8 font-sans">
          {error}
        </p>
        <Link to="/create" className="text-violet hover:text-violet/80 font-sans font-medium inline-flex items-center gap-2 transition-colors">
          {t('create.create_another', 'Create your own message')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      </PageTransition>
    );
  }

  // If password protected and not yet decrypted
  if (metadata?.isPasswordProtected && !message) {
    return (
<PageTransition>
      <div className="max-w-md mx-auto px-6 py-24">
        {pageHelmet}
        <div className="bg-panel border border-hairline rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-violet/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-violet/20 shadow-[0_0_15px_rgba(124,92,255,0.2)]">
            <Lock className="w-8 h-8 text-violet" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2 text-text-primary">{t('view.enter_pass')}</h1>
          <p className="text-text-muted mb-8 text-sm font-sans">
            {t('view.pass_desc')}
          </p>
          
          <form onSubmit={handleViewMessage} className="space-y-4 text-left">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-sm font-sans">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('view.pass_placeholder')}
                className="w-full bg-ink border border-hairline rounded-xl px-4 py-3 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-violet font-sans transition-colors"
                required
              />
            </div>
            
            <MagneticElement strength={15} className="w-full"><motion.button
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={decrypting || !password}
              className="w-full bg-amber hover:bg-amber/90 text-ink font-sans font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(124,92,255,0.2)]"
            >
              {decrypting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('view.decrypting', 'Decrypt Message')}
            </motion.button></MagneticElement>
          </form>
        </div>
      </div>
      </PageTransition>
    );
  }

  if (message) {
    return (
<PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {pageHelmet}
        
        <div className="mb-6 p-4 bg-violet/10 border border-violet/20 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-violet flex-shrink-0 mt-0.5" />
          <p className="text-sm text-violet/90 font-sans leading-relaxed">
            {t('view.security_notice')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-teal text-sm font-mono font-medium">
            <ShieldCheck className="w-5 h-5" />
            DECRYPTED_SUCCESSFULLY
          </div>
          
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-panel border border-hairline rounded-3xl shadow-2xl relative overflow-hidden group select-none"
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            // Check if it's the unblur button, otherwise prevent default to avoid selection
            if (!(e.target as HTMLElement).closest('button')) {
              // Note: preventDefault on touchStart breaks scrolling on some devices,
              // but we are also using CSS user-select: none which is safer.
              // We'll keep user-select: none instead of preventDefault on touch.
            }
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet via-teal to-violet opacity-50 z-10"></div>
          
          {/* Watermark */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.05]">
            <div className="w-[150%] h-[150%] -top-1/4 -left-1/4 absolute rotate-[-30deg] flex flex-wrap content-start items-start">
              {Array.from({ length: 150 }).map((_, i) => (
                <div key={i} className="p-4 text-sm font-mono font-bold whitespace-nowrap text-text-primary">
                  Viewed {readAt ? format(new Date(readAt), 'yyyy-MM-dd HH:mm:ss') : ''}
                </div>
              ))}
            </div>
          </div>
          
          <div className={`p-6 md:p-10 transition-all duration-300 relative z-10 `}>
            <div className="prose prose-invert max-w-none select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
              <p className="text-lg md:text-xl text-text-primary whitespace-pre-wrap leading-relaxed font-sans select-none pointer-events-none">
                {message}
              </p>
            </div>
          </div>

          
          
          <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 p-6 md:px-10 md:pb-10 relative z-10 bg-panel/80">
            <p className="text-xs text-text-muted font-mono tracking-wide">
              {metadata?.viewLimit === 1 ? 'STATUS: DESTROYED_FROM_SERVER' : 'STATUS: FETCHED_SECURELY'}
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Link to="/create" className="inline-flex flex-col items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
            <span className="text-sm font-sans">Powered by QryptNote</span>
            <span className="flex items-center gap-2 font-sans font-medium text-violet">
              {t('create.create_another', 'Create your own secure note')} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </div>
      </PageTransition>
    );
  }

  return null;
}
