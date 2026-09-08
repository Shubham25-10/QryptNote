import { MagneticElement } from "../components/MagneticElement";
import { PageTransition } from "../components/PageTransition";
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, EyeOff, Loader2, ShieldCheck, ArrowRight, Info, Check, AlertCircle, FileText, FileArchive, FileCode, FileVideo, FileAudio, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { TypewriterText } from '../components/TypewriterText';
import { decryptMessage, hashPassword } from '../lib/crypto';

const getFileIcon = (fileType: string, fileName: string) => {
  const type = fileType.toLowerCase();
  const name = fileName.toLowerCase();
  
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  
  if (type === 'application/pdf') return FileText;
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('compressed') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar.gz') || name.endsWith('.7z')) return FileArchive;
  
  if (type.includes('json') || type.includes('javascript') || type.includes('html') || type.includes('xml') || type.includes('code') || name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.json')) return FileCode;
  
  if (type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.csv')) return FileText;
  
  return FileIcon;
};

export default function ViewPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [message, setMessage] = useState('');
  const [fileData, setFileData] = useState<{name: string, type: string, data: string} | null>(null);
  
  // Anti-Screenshot / Ephemeral State
  const [revealed, setRevealed] = useState(false);
  const [holding, setHolding] = useState(false);
  const [readAt, setReadAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, [id]);

  useEffect(() => {
    let timer: any;
    if (revealed && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && message) {
      setMessage('');
      setFileData(null);
      setError('Time limit expired. The message has been removed from your screen.');
    }
    return () => clearTimeout(timer);
  }, [revealed, timeLeft, message]);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${id}/metadata`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Message not found');
      setMetadata(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching message');
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDecrypting(true);
    setError('');
    
    try {
      // If the link has a hash fragment, it's the decryption key
      const secretKey = window.location.hash.substring(1);
      if (!secretKey) throw new Error('Decryption key missing from URL');

      const pwdHash = password ? await hashPassword(password) : undefined;
      
      const revealRes = await fetch(`/api/reveal-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, passwordHash: pwdHash })
      });
      const revealData = await revealRes.json();
      
      if (!revealRes.ok) throw new Error(revealData.error || 'Failed to reveal message');

      let finalEncrypted = revealData.encryptedMessage;
      
      if (revealData.chunkCount > 0) {
        const chunkRes = await fetch(`/api/messages/${id}/chunks`);
        const chunkData = await chunkRes.json();
        if (!chunkRes.ok) throw new Error('Failed to fetch message chunks');
        
        // Sort and concatenate
        const chunks = chunkData.chunks.sort((a: any, b: any) => {
          const idxA = parseInt(a.id.split('_')[1]);
          const idxB = parseInt(b.id.split('_')[1]);
          return idxA - idxB;
        });
        finalEncrypted = chunks.map((c: any) => c.data).join('');
      }

      // Decrypt
      const decrypted = await decryptMessage(finalEncrypted, secretKey, revealData.iv, revealData.salt, password);
      
      let textToSet = decrypted;
      let fileToSet = null;
      try {
        const parsed = JSON.parse(decrypted);
        if (parsed && parsed.type === 'v2') {
          textToSet = parsed.text || '';
          if (parsed.file) fileToSet = parsed.file;
        }
      } catch (e) {
        // Raw text fallback
      }
      
      setMessage(textToSet);
      setFileData(fileToSet);
      setReadAt(Date.now());
      setRevealed(true);
      // Remove hash to prevent saving it accidentally
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err: any) {
      setError(err.message || 'Decryption failed');
    } finally {
      setDecrypting(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;
    setIsDownloading(true);
    try {
      const a = document.createElement('a');
      a.href = fileData.data;
      a.download = fileData.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const pageHelmet = (
    <Helmet>
      <title>Secure Message - QryptNote</title>
      <meta name="description" content="View a secure, self-destructing message." />
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-violet animate-spin" />
      </div>
    );
  }

  if (error && !message) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          {pageHelmet}
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <EyeOff className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-4">
            Message Unavailable
          </h1>
          <p className="text-text-muted mb-8">{error}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-panel border border-hairline rounded-xl hover:bg-white/5 transition-colors text-text-primary font-medium">
            Return Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </PageTransition>
    );
  }

  // Interstitial screen
  if (!revealed) {
    return (
      <PageTransition>
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          {pageHelmet}
          <div className="w-24 h-24 bg-violet/10 border border-violet/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <ShieldCheck className="w-12 h-12 text-violet relative z-10" />
          </div>
          <h1 className="text-3xl font-display font-bold text-text-primary mb-4">Secure Message Received</h1>
          <p className="text-text-muted mb-8 text-lg font-sans">
            You have received an encrypted message. Clicking reveal will fetch and decrypt the message, then permanently burn it from the server.
          </p>

          <form onSubmit={handleReveal} className="space-y-6 max-w-md mx-auto">
            {metadata?.hasPassword && (
              <div className="text-left">
                <label className="block text-sm font-sans font-medium text-text-muted mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password Required
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-ink border border-hairline rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-violet"
                  required
                />
              </div>
            )}
            <MagneticElement strength={15}>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                disabled={decrypting || (metadata?.hasPassword && !password)}
                className="w-full bg-amber hover:bg-amber/90 text-ink font-sans font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(124,92,255,0.2)] disabled:opacity-50"
              >
                {decrypting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reveal Secret"}
              </motion.button>
            </MagneticElement>
          </form>
        </div>
      </PageTransition>
    );
  }

  // Decrypted View
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24">
        {pageHelmet}
        
        <div className="mb-6 p-4 bg-violet/10 border border-violet/20 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-violet flex-shrink-0 mt-0.5" />
          <p className="text-sm text-violet/90 font-sans leading-relaxed">
            This message is now permanently destroyed on the server. <br/>
            Hold the button below to read the message. It will erase from your screen in <b>{timeLeft}s</b>.
          </p>
        </div>

        <div className="bg-panel border border-hairline rounded-3xl shadow-2xl relative overflow-hidden group select-none">
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

          <div className="p-6 md:p-10 relative z-10 text-center">
            <button
              onMouseDown={() => setHolding(true)}
              onMouseUp={() => setHolding(false)}
              onMouseLeave={() => setHolding(false)}
              onTouchStart={() => setHolding(true)}
              onTouchEnd={() => setHolding(false)}
              className="px-6 py-3 bg-violet text-white font-medium rounded-full mb-6 cursor-pointer select-none touch-none active:scale-95 transition-transform"
            >
              Hold to Read
            </button>
            
            <div className={`prose prose-invert max-w-none transition-all duration-200 ${holding ? 'blur-none opacity-100' : 'blur-md opacity-20'}`}>
              {message && (
                <p className="text-lg md:text-xl text-text-primary whitespace-pre-wrap leading-relaxed font-sans text-left">
                  <TypewriterText text={message} />
                </p>
              )}
              {fileData && (
                <div className="mt-4 p-4 bg-ink border border-hairline rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-violet/10 rounded-lg flex items-center justify-center border border-violet/20">
                      {(() => {
                        const IconComponent = getFileIcon(fileData.type, fileData.name);
                        return <IconComponent className="w-5 h-5 text-violet" />;
                      })()}
                    </div>
                    <div>
                      <p className="font-sans font-medium text-text-primary text-sm truncate max-w-[200px] sm:max-w-[300px]">
                        {fileData.name}
                      </p>
                      <p className="font-sans text-xs text-text-muted">Secure File Attachment</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading || downloadSuccess}
                    className="flex items-center gap-2 px-4 py-2 bg-violet hover:bg-violet/90 text-white rounded-lg font-sans text-sm transition-colors shadow-[0_0_10px_rgba(124,92,255,0.2)] disabled:opacity-70 justify-center"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : (downloadSuccess ? <Check className="w-4 h-4" /> : "Download")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
