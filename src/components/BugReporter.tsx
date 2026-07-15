import { useTranslation } from 'react-i18next';
import { withTimeout } from "../lib/utils";
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bug, X, Send, AlertTriangle, Info, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { nanoid } from 'nanoid';

// Setup global logging immediately
const MAX_LOGS = 50;
const debugLogs: any[] = [];
let webglInfo: any = { supported: false };

if (typeof window !== 'undefined') {
  // Setup WebGL detection
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2') as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (gl) {
      webglInfo.supported = true;
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        webglInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // ignore
  }

  const pushLog = (type: string, args: any[]) => {
    try {
      const parsedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return { message: arg.message, stack: arg.stack };
        } else if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      });
      debugLogs.push({ type, timestamp: Date.now(), args: parsedArgs });
      if (debugLogs.length > MAX_LOGS) {
        debugLogs.shift();
      }
    } catch(e) {}
  };

  const originalConsoleError = console.error;
  console.error = function (...args) {
    pushLog('error', args);
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = function (...args) {
    pushLog('warn', args);
    originalConsoleWarn.apply(console, args);
  };

  const originalConsoleLog = console.log;
  console.log = function (...args) {
    pushLog('log', args);
    originalConsoleLog.apply(console, args);
  };

  const originalConsoleInfo = console.info;
  console.info = function (...args) {
    pushLog('info', args);
    originalConsoleInfo.apply(console, args);
  };

  const originalConsoleDebug = console.debug;
  console.debug = function (...args) {
    pushLog('debug', args);
    originalConsoleDebug.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    pushLog('uncaught_error', [event.error || event.message]);
  });

  window.addEventListener('unhandledrejection', (event) => {
    pushLog('unhandled_rejection', [event.reason]);
  });
}

export default function BugReporter() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const lastClosedRef = useRef<number>(0);
  const closeDialog = () => {
    lastClosedRef.current = Date.now();
    setIsOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    
    const report = {
      userDescription: description,
      consoleLogs: [...debugLogs],
      webglInfo,
      deviceInfo: {
        userAgent: navigator.userAgent,
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      pageUrl: window.location.href,
      timestamp: Date.now(),
    };

    try {
      await withTimeout(setDoc(doc(db, "bug_reports", nanoid()), report), 15000, "Network request timed out.");
      
      setSubmitted(true);
      setSubmitError(false);
      setTimeout(() => {
        closeDialog();
        setSubmitted(false);
        setDescription('');
      }, 3000);
    } catch (error) {
      console.error('Failed to submit bug report:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div 
        drag
        dragMomentum={false}
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end cursor-move"
        title="Drag to move"
      >
        
        <button
          onClick={() => setIsOpen(true)}
          className="bg-panel border border-hairline hover:bg-ink/50 text-text-muted hover:text-text-primary p-3 rounded-full transition-colors shadow-lg pointer-events-auto"
          title={t("bug.report")}
        >
          <Bug className="w-5 h-5" />
        </button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-12 sm:pt-4 bg-ink/80 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-panel border border-hairline w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-hairline bg-ink">
                <h2 className="text-lg font-display font-bold flex items-center gap-2">
                  <Bug className="w-5 h-5 text-amber" />
                  Report a Bug
                </h2>
                <button onClick={closeDialog} className="text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-teal/20 rounded-full flex items-center justify-center mb-2">
                    <Bug className="w-8 h-8 text-teal" />
                  </div>
                  <h3 className="text-xl font-medium text-text-primary">{t("bug.thanks")}</h3>
                  <p className="text-text-muted font-sans text-sm">{t("bug.desc")}</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="p-4 flex flex-col gap-4 overflow-y-auto">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-text-primary font-sans">
                      What were you doing when this happened?
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("bug.opt")}
                      className="w-full h-24 bg-ink border border-hairline rounded-lg p-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-violet font-sans resize-none"
                    />
                  </div>

                  <div className="border border-hairline rounded-lg overflow-hidden bg-ink">
                    <button
                      type="button"
                      onClick={() => setShowTechnical(!showTechnical)}
                      className="w-full flex items-center justify-between p-3 text-sm font-medium text-text-muted hover:text-text-primary transition-colors bg-panel/50"
                    >
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Technical details
                      </span>
                      {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showTechnical && (
                      <div className="p-3 text-xs font-mono text-text-muted space-y-3 bg-ink max-h-48 overflow-y-auto border-t border-hairline">
                        <div>
                          <span className="font-bold text-text-primary">{t("bug.page")}</span> {window.location.pathname}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary">{t("bug.device")}</span> {navigator.userAgent}
                          <br />{window.innerWidth}x{window.innerHeight} @ {window.devicePixelRatio}x
                        </div>
                        <div>
                          <span className="font-bold text-text-primary">{t("bug.webgl")}</span>{' '}
                          {webglInfo.supported ? `Supported (${webglInfo.renderer || 'Unknown'})` : 'Not Supported'}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary">{t("bug.recent")}</span>
                          <div className="mt-1 space-y-1">
                            {debugLogs.length === 0 ? (
                              <span className="opacity-50">{t("bug.no_logs")}</span>
                            ) : (
                              debugLogs.map((log, i) => (
                                <div key={i} className="bg-panel/50 p-1.5 rounded text-[10px] break-all">
                                  <span className={log.type.includes('error') ? 'text-red-400' : 'text-amber'}>
                                    [{log.type}]
                                  </span>{' '}
                                  {JSON.stringify(log.args).slice(0, 150)}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col items-end gap-2">
                    {submitError && (
                      <div className="text-red-400 text-xs font-medium bg-red-400/10 px-3 py-1.5 rounded border border-red-400/20">
                        Failed to send report. Please try again.
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-violet hover:bg-violet/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
