import { TiltCard } from '../components/TiltCard';
import { MagneticElement } from '../components/MagneticElement';
import { withTimeout } from "../lib/utils";
import React, { Suspense } from 'react';
import { WebGLBoundary } from '../components/WebGLBoundary';
import { PageTransition } from "../components/PageTransition";
import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Lock,
  Download,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useUser } from "../hooks/useUser";
import { db } from "../firebase";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { encryptMessage, hashPassword } from "../lib/crypto";
import { useRazorpay } from '../hooks/useRazorpay';
import { useCurrency } from '../hooks/useCurrency';
import { Link } from 'react-router';

const CipherCanvas = React.lazy(() => import("../components/CipherCanvas"));

export default function CreatePage() {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [createdMessageId, setCreatedMessageId] = useState<string | null>(null);
  const [messageStatus, setMessageStatus] = useState<{
    status: "active" | "destroyed";
    viewCount: number;
  }>({ status: "active", viewCount: 0 });

  const [expiry, setExpiry] = useState(24); // 24 hours

  const [viewLimit, setViewLimit] = useState(1); // 1 view
  const [password, setPassword] = useState("");
  const { isPro, loading } = useUser();

  const [showPayPrompt, setShowPayPrompt] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isRazorpayLoaded = useRazorpay();
  const { formatPrice, loading: currencyLoading } = useCurrency();
  const paygoPrice = formatPrice(1);
  const proPrice = formatPrice(3);

  const maxChars = isPro ? 5000 : 500;

  useEffect(() => {
    if (!createdMessageId || messageStatus.status === "destroyed") return;

    const interval = setInterval(async () => {
      try {
        const docRef = doc(db, "messages", createdMessageId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setMessageStatus((prev) => ({ ...prev, status: "destroyed" }));
          clearInterval(interval);
        } else {
          const data = docSnap.data();
          if (data.viewCount !== messageStatus.viewCount) {
            setMessageStatus((prev) => ({
              ...prev,
              viewCount: data.viewCount,
            }));
          }
        }
      } catch (err) {
        // ignore network errors during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [createdMessageId, messageStatus.status, messageStatus.viewCount]);

  const isSubmitting = useRef(false);

  const submitMessage = async (razorpayOrderId?: string, razorpayPaymentId?: string) => {
    isSubmitting.current = true;
    setIsLoading(true);
    setError("");

    try {
      const id = nanoid(8);
      const { encryptedMessage, secretKey } = encryptMessage(message);

      const expiryTimestamp = expiry 
        ? Date.now() + (expiry * 60 * 60 * 1000)
        : null;

      const messageDoc: any = {
        id,
        encryptedMessage,
        expiryTimestamp,
        viewLimit: viewLimit || 1,
        viewCount: 0,
        passwordHash: password ? hashPassword(password) : null,
        createdAt: Date.now()
      };

      if (razorpayOrderId && razorpayPaymentId) {
        messageDoc.paidFeatureUnlock = true;
        messageDoc.razorpayOrderId = razorpayOrderId;
        messageDoc.razorpayPaymentId = razorpayPaymentId;
      }

      const userEmail = localStorage.getItem("qryptnote_user_email") || "";
      const res = await fetch('/api/create-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...messageDoc, 
          userId: userEmail,
          paidFeatureUnlock: !!(razorpayOrderId && razorpayPaymentId),
          razorpayOrderId,
          razorpayPaymentId
        })
      });
      if (!res.ok) {
        const text = await res.text();
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { error: text || res.statusText };
        }
        throw new Error(errorData.error || t('errors.network_timeout'));
      }

      // Generate URL and QR
      const viewUrl = `${window.location.origin}/msg/${id}#${secretKey}`;
      const qrCode = await QRCode.toDataURL(viewUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      setQrDataUrl(qrCode);
      setResultUrl(viewUrl);
      setCreatedMessageId(id);
      setMessageStatus({ status: "active", viewCount: 0 });
    } catch (err: any) {
      setError(err.message || "Failed to create message");
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handlePayPerMessage = async () => {
    if (!isRazorpayLoaded) {
      setError("Payment gateway loading, please try again.");
      return;
    }
    setIsProcessingPayment(true);
    try {
      const orderRes = await fetch('/api/create-order', { method: 'POST' });
      if (!orderRes.ok) throw new Error("Failed to create order");
      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        order_id: orderData.id || orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QryptNote",
        description: "Pay-As-You-Go Message",
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setShowPayPrompt(false);
              await submitMessage(response.razorpay_order_id, response.razorpay_payment_id);
            } else {
              setError("Payment verification failed");
            }
          } catch (err: any) {
             setError("Error verifying payment");
          }
        },
        theme: { color: "#7C5CFF" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setError("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting.current) return;
    if (message.length > maxChars) {
      setError(t('errors.msg_too_long', { max: maxChars }));
      return;
    }

    const isUsingProFeature = (expiry !== 24 && expiry !== 1) || viewLimit === -1 || password.trim() !== "";
    if (isUsingProFeature && !isPro) {
      setShowPayPrompt(true);
      return;
    }

    await submitMessage();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(resultUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [debouncedIntensity, setDebouncedIntensity] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedIntensity(Math.min(1, message.length / 100));
    }, 300);
    return () => clearTimeout(handler);
  }, [message]);

  if (resultUrl) {
    return (
      <PageTransition className="flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-24 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-panel border border-hairline rounded-3xl p-8 text-center shadow-depth-3 relative overflow-hidden"
        >
          {messageStatus.status === "destroyed" && (
            <div className="absolute top-0 left-0 w-full p-2 bg-red-500/20 text-red-400 text-sm font-mono flex items-center justify-center gap-2 border-b border-red-500/20">
              <Trash2 className="w-4 h-4" />
              MESSAGE_DESTROYED
            </div>
          )}
          {messageStatus.status === "active" && messageStatus.viewCount > 0 && (
            <div className="absolute top-0 left-0 w-full p-2 bg-teal/20 text-teal text-sm font-mono flex items-center justify-center gap-2 border-b border-teal/20">
              <Eye className="w-4 h-4" />
              VIEWED {messageStatus.viewCount} TIME
              {messageStatus.viewCount !== 1 ? "S" : ""}
            </div>
          )}

          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border mt-8 ${messageStatus.status === "destroyed" ? "bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-teal/10 border-teal/20 shadow-[0_0_15px_rgba(94,234,212,0.2)]"}`}
          >
            {messageStatus.status === "destroyed" ? (
              <Trash2 className={`w-8 h-8 text-red-500`} />
            ) : (
              <ShieldCheck className={`w-8 h-8 text-teal`} />
            )}
          </div>
          <h1 className="text-[32px] font-display font-bold mb-2 text-text-primary">
            {messageStatus.status === "destroyed"
              ? t("create.msg_destroyed")
              : t("create.msg_saved")}
          </h1>
          <p className="text-text-muted mb-8 font-sans">
            {messageStatus.status === "destroyed"
              ? t("create.dest_desc")
              : `${t("create.ready_desc")}${viewLimit === 1 ? t("create.self_dest_1") : ""}`}
          </p>

          {messageStatus.status === "active" && (
            <>
              <motion.div 
                initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-white p-4 rounded-2xl inline-block mb-8 shadow-depth-3 relative hologram-qr"
              >
                <div className="absolute inset-0 bg-violet/5 pointer-events-none rounded-2xl animate-pulse"></div>
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-48 h-48 relative z-10 hologram-qr-image"
                />
              </motion.div>

              <div className="flex flex-col gap-4 max-w-sm mx-auto w-full">
                <div className="flex bg-ink border border-hairline rounded-lg overflow-hidden">
                  <input
                    type="text"
                    readOnly
                    value={resultUrl}
                    className="flex-1 bg-transparent text-text-muted font-mono text-xs px-3 focus:outline-none"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-3 bg-panel hover:bg-panel/80 text-text-primary transition-colors text-sm font-medium border-l border-hairline whitespace-nowrap"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-teal" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied ? t("create.copied") : t("create.copy")}
                  </motion.button>
                </div>
                <motion.a
                  whileTap={{ scale: 0.96 }}
                  href={qrDataUrl}
                  download={`secret-qr-${new Date().getTime()}.png`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-violet hover:bg-violet/90 text-white rounded-xl font-sans font-medium transition-colors shadow-[0_0_15px_rgba(124,92,255,0.3)] w-full"
                >
                  <Download className="w-5 h-5" />
                  {t("create.dl_qr")}
                </motion.a>
              </div>

              <div className="mt-8 text-sm text-text-muted font-sans flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet" />
                {t("create.wait_recip")}
              </div>
            </>
          )}

          <div className="mt-8 pt-8 border-t border-hairline">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setResultUrl("");
                setMessage("");
                setPassword("");
                setCreatedMessageId(null);
              }}
              className="text-text-muted hover:text-text-primary transition-colors font-sans"
            >
              {t("create.create_another")}
            </motion.button>
          </div>
        </motion.div>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto w-full px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-start">
      <Helmet>
        <title>{t("create.helmet_title")}</title>
        <meta name="description" content={t("create.helmet_desc")} />
        <meta property="og:title" content={t("create.helmet_title")} />
        <meta property="og:description" content={t("create.helmet_desc")} />
      </Helmet>
      <div className="sticky top-24 hidden md:flex justify-center items-center h-[500px]">
        <Suspense
          fallback={
            <div className="w-full h-full max-w-md bg-ink rounded-2xl animate-pulse" />
          }
        >
          <WebGLBoundary><CipherCanvas
            intensity={debouncedIntensity}
            isCracked={isLoading}
            className="w-full h-full max-w-md pointer-events-auto"
          /></WebGLBoundary>
        </Suspense>
      </div>

      <div>
        <div className="mb-8">
          <h1 className="text-[40px] font-display font-bold mb-2 text-text-primary tracking-tight">
            {t("create.headline")}
          </h1>
          <p className="text-text-muted font-sans text-lg">
            {t("create.subheadline")}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
              error.includes("Too many requests")
                ? "bg-amber/10 border-amber/20 text-amber"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="font-sans">
              {error.includes("Too many requests")
                ? t("create.limit_err")
                : error}
            </p>
          </motion.div>
        )}

        <div className="md:hidden h-64 w-full mb-8 flex justify-center">
          <Suspense
            fallback={
              <div className="w-full h-full bg-ink rounded-2xl animate-pulse" />
            }
          >
            <WebGLBoundary><CipherCanvas
              intensity={debouncedIntensity}
              isCracked={isLoading}
              className="w-full h-full pointer-events-auto"
            /></WebGLBoundary>
          </Suspense>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-2">
            <label className="flex justify-between items-end">
              <span className="font-sans font-medium text-text-primary">
                {t("create.your_msg")}
              </span>
              <span
                className={`text-xs font-mono tracking-wide transition-colors ${
                  message.length > maxChars * 0.95
                    ? "text-red-400"
                    : message.length > maxChars * 0.8
                    ? "text-amber"
                    : "text-text-muted"
                }`}
              >
                {message.length} / {maxChars}
              </span>
            </label>
            <textarea
              autoFocus
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="w-full bg-panel border border-hairline rounded-xl p-4 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-violet focus:border-violet min-h-[200px] resize-y font-sans transition-colors"
              placeholder={t("create.type_here")}
              required
              maxLength={maxChars}
            />
          </div>

          <div className="bg-panel border border-hairline rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold flex items-center gap-2 text-text-primary">
                <Lock className="w-5 h-5 text-violet" />
                {t("create.sec_settings")}
              </h2>
              
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-sans font-medium text-text-muted block">
                  {t("create.timer")}
                </label>
                <select
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                  
                  className="w-full bg-ink border border-hairline rounded-lg px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-1 focus:ring-violet disabled:opacity-50 appearance-none font-sans"
                >
                  <option value={1}>{t("create.h1")}</option>
                  <option value={24}>{t("create.h24")}</option>
                  <option value={168} >
                    {t("create.d7")} {!isPro ? t("create.pro_label") : ""}
                  </option>
                  <option value={720} >
                    {t("create.d30")} {!isPro ? t("create.pro_label") : ""}
                  </option>
                  <option value={0} >
                    {t("create.never")} {!isPro ? t("create.pro_label") : ""}
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-sans font-medium text-text-muted block">
                  {t("create.view_limit")}
                </label>
                <select
                  value={viewLimit}
                  onChange={(e) => setViewLimit(Number(e.target.value))}
                  
                  className="w-full bg-ink border border-hairline rounded-lg px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-1 focus:ring-violet disabled:opacity-50 appearance-none font-sans"
                >
                  <option value={1}>{t("create.one_time")}</option>
                  <option value={-1} >
                    {t("create.unlimited")}{" "}
                    {!isPro ? t("create.pro_label") : ""}
                  </option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-sans font-medium text-text-muted flex items-center justify-between">
                  <span>
                    {t("create.pass_protect")}{" "}
                    {!isPro && (
                      <span className="text-amber text-xs ml-2 border border-amber/30 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  
                  placeholder={
                    isPro ? t("create.opt_pass") : t("create.upg_pass")
                  }
                  className="w-full bg-ink border border-hairline rounded-lg px-4 py-3 text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-violet disabled:opacity-50 font-sans"
                />
              </div>
            </div>
          </div>

          {showPayPrompt && !isPro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber/10 border border-amber/30 rounded-xl p-5 text-left mb-6"
            >
              <h4 className="font-display font-bold text-amber mb-2">Pro Feature Selected</h4>
              <p className="text-sm text-text-primary mb-4 font-sans">
                You have selected one or more Pro features. Unlock them for this message for a one-time fee of {!currencyLoading ? paygoPrice.display : "$1"}, or subscribe for unlimited access.
              </p>
              {(!currencyLoading && paygoPrice.isEstimate) && (
                <p className="text-xs text-amber mb-4">
                  * {paygoPrice.estimateText}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handlePayPerMessage}
                  className="flex-1 bg-amber text-ink font-medium py-3 rounded-lg shadow-sm hover:bg-amber/90 transition-colors disabled:opacity-50 flex flex-col items-center justify-center"
                >
                  <span>{isProcessingPayment ? "Processing..." : `Pay ${!currencyLoading ? paygoPrice.display : "$1"} for this message`}</span>
                  {!currencyLoading && paygoPrice.isEstimate && (
                    <span className="text-[10px] opacity-70">({paygoPrice.usdText})</span>
                  )}
                </button>
                <Link
                  to="/pricing"
                  className="flex-1 bg-panel border border-amber/30 text-amber font-medium py-3 rounded-lg text-center hover:bg-amber/10 transition-colors flex flex-col items-center justify-center"
                >
                  <span>Subscribe to Pro ({!currencyLoading ? proPrice.display : "$3"}/month)</span>
                  {!currencyLoading && proPrice.isEstimate && (
                    <span className="text-[10px] opacity-70">({proPrice.usdText}/month)</span>
                  )}
                </Link>
              </div>
            </motion.div>
          )}

          <MagneticElement strength={15} className="w-full"><motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={isLoading || isProcessingPayment || !message.trim() || message.length > maxChars || showPayPrompt}
            className={`w-full ${showPayPrompt ? 'hidden' : 'flex'} bg-amber hover:bg-amber/90 text-ink font-sans font-medium text-lg py-4 rounded-xl items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(124,92,255,0.2)] hover:shadow-[0_0_25px_rgba(124,92,255,0.4)] ${message.length > 0 ? 'fixed md:static bottom-6 left-6 right-6 w-[calc(100%-3rem)] md:w-full z-50' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isSubmitting.current ? "Generating QR..." : "Encrypting..."}
              </>
            ) : (
              t("create.gen_qr")
            )}
          </motion.button></MagneticElement>
        </form>
      </div>
    </div>
    </PageTransition>
  );
}
