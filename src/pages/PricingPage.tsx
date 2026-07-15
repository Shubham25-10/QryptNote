import { PageTransition } from "../components/PageTransition";
import { TiltCard } from '../components/TiltCard';
import { Link } from "react-router";
import { Check, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

import { useUser } from '../hooks/useUser';
import { useRazorpay } from '../hooks/useRazorpay';
import { useState } from 'react';
import { useCurrency } from '../hooks/useCurrency';


export default function PricingPage() {
  
  const { t } = useTranslation();
  const { userEmail, isPro, loading } = useUser();
  const [email, setEmail] = useState(localStorage.getItem("qryptnote_user_email") || "");
  const isRazorpayLoaded = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  
  
  const { formatPrice, loading: currencyLoading } = useCurrency();
  const proPrice = formatPrice(3);
  const paygoPrice = formatPrice(1);

  const [showPaygoInfo, setShowPaygoInfo] = useState(false);

  const handleUpgrade = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Please enter a valid email to upgrade.");
      return;
    }
    localStorage.setItem('qryptnote_user_email', email);

    if (!isRazorpayLoaded) {
      setErrorMsg("Payment gateway loading, please try again.");
      return;
    }
    
    setErrorMsg("");
    setIsProcessing(true);

    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate subscription");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: "QryptNote",
        description: "QryptNote Pro Subscription",
        handler: function (response: any) {
          alert("Payment successful! Your account will be upgraded to Pro shortly.");
          window.location.reload();
        },
        theme: {
          color: "#7C5CFF"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setErrorMsg("Payment failed: " + response.error.description);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PageTransition>
    <div className="max-w-7xl mx-auto px-6 py-24">
      <Helmet>
        <title>{t("pricing.helmet_title")}</title>
        <meta name="description" content={t("pricing.helmet_desc")} />
        <meta property="og:title" content={t("pricing.helmet_title")} />
        <meta property="og:description" content={t("pricing.helmet_desc")} />
      </Helmet>
      <div className="text-center mb-20">
        <h1 className="text-[36px] sm:text-[48px] md:text-[64px] font-display font-bold mb-4 tracking-tight text-text-primary px-2">
          {t("pricing.headline")}
        </h1>
        <p className="text-lg sm:text-xl text-text-muted font-sans px-4">
          {t("pricing.subheadline")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto perspective-container">
        {/* Free Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-panel/50 border border-hairline rounded-3xl p-6 sm:p-10 flex flex-col transition-colors hover:border-violet/30"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-2 text-text-primary">
              {t("pricing.free")}
            </h2>
            <div className="flex items-baseline gap-1 text-5xl font-display font-bold mb-4 text-text-primary">
              {!currencyLoading ? formatPrice(0).display : t("pricing.price_0")}
              <span className="text-lg text-text-muted font-sans font-normal">
                {t("pricing.forever")}
              </span>
            </div>
            <p className="text-text-muted font-sans">
              {t("pricing.free_desc")}
            </p>
          </div>

          <ul className="space-y-5 mb-10 flex-1">
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.f_exp")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.f_view")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.f_qr")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.f_char")}
            </li>
            <li className="flex items-center gap-3 text-text-muted font-sans opacity-50">
              <X className="w-5 h-5 flex-shrink-0" />
              {t("pricing.f_no_pass")}
            </li>
            <li className="flex items-center gap-3 text-text-muted font-sans opacity-50">
              <X className="w-5 h-5 flex-shrink-0" />
              {t("pricing.f_no_exp")}
            </li>
          </ul>

          <Link
            to="/create"
            className="w-full bg-ink hover:bg-ink/80 text-text-primary font-sans font-medium py-4 rounded-xl flex items-center justify-center transition-colors border border-hairline"
          >
            {t("pricing.start_free")}
          </Link>
        </motion.div>

        {/* Pro Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-panel border border-violet/30 rounded-3xl p-6 sm:p-10 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(124,92,255,0.1)]"
        >
          <div className="absolute top-0 right-0 bg-violet text-white text-xs font-sans font-bold px-4 py-1.5 rounded-bl-xl tracking-wider">
            {t("pricing.popular")}
          </div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet to-teal"></div>

          <div className="mb-8 mt-2">
            <h2 className="text-2xl font-display font-bold mb-2 text-text-primary">
              {t("pricing.pro")}
            </h2>
            <div className="flex flex-col mb-4">
              <div className="flex items-baseline gap-1 text-5xl font-display font-bold text-text-primary">
                {!currencyLoading ? proPrice.display : t("pricing.price_3")}
                <span className="text-lg text-text-muted font-sans font-normal">
                  {t("pricing.month")}
                </span>
              </div>
              {!currencyLoading && proPrice.isEstimate && (
                <p className="text-xs text-text-muted mt-2">
                  {proPrice.estimateText}
                </p>
              )}
            </div>
            <p className="text-text-muted font-sans">{t("pricing.pro_desc")}</p>
          </div>

          <ul className="space-y-5 mb-10 flex-1">
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.p_exp")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.p_view")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.p_pass")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.p_char")}
            </li>
            <li className="flex items-center gap-3 text-text-primary font-sans">
              <Check className="w-5 h-5 text-violet flex-shrink-0" />
              {t("pricing.p_read")}
            </li>
          </ul>

          
          <div className="mb-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-hairline rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-violet"
              disabled={isPro}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={isProcessing || isPro}
            onClick={() =>
              handleUpgrade()
            }
            className="w-full bg-amber hover:bg-amber/90 text-ink font-sans font-medium py-4 rounded-xl flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(124,92,255,0.2)] hover:shadow-[0_0_25px_rgba(124,92,255,0.4)]"
          >
            <span>{isPro ? "You are Pro" : isProcessing ? "Processing..." : t("pricing.upgrade")}</span>
            {!isPro && !isProcessing && !currencyLoading && proPrice.isEstimate && (
              <span className="text-[10px] opacity-70">({proPrice.usdText}/month)</span>
            )}
          </motion.button>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Subscription Error</p>
                <p className="opacity-90">{errorMsg}</p>
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>

      <div className="mt-16 sm:mt-24 text-center max-w-2xl mx-auto border border-hairline rounded-3xl p-8 sm:p-12 bg-panel/30 transition-colors hover:border-violet/20">
        <h3 className="text-2xl font-display font-bold mb-4 text-text-primary">
          {t("pricing.one_time")}
        </h3>
        <p className="text-text-muted mb-2 font-sans text-base sm:text-lg">
          Don't want another subscription? You can also pay {!currencyLoading ? paygoPrice.display : "$1"} per secure message with all Pro features unlocked.
        </p>
        {!currencyLoading && paygoPrice.isEstimate && (
          <p className="text-xs text-text-muted mb-8 text-center max-w-sm mx-auto">
            {paygoPrice.estimateText}
          </p>
        )}
        <button onClick={() => setShowPaygoInfo(!showPaygoInfo)} className={`text-violet font-sans font-medium hover:text-violet/80 transition-colors inline-flex items-center gap-2 ${(!currencyLoading && paygoPrice.isEstimate) ? 'mt-4' : 'mt-6'}`}>
          {t("pricing.learn_paygo")} <span aria-hidden="true">&rarr;</span>
        </button>
        {showPaygoInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-6 text-left bg-panel/50 border border-hairline rounded-xl p-6 shadow-lg"
          >
            <h4 className="font-display font-bold text-text-primary mb-2">How Pay-As-You-Go Works</h4>
            <p className="text-text-muted text-sm mb-4">
              You don't need a subscription to use Pro features. Simply go to the Create Message page, select any Pro feature (like Custom Expiry or Password Protection), and you'll be prompted to pay a one-time fee of $1 per message via Razorpay.
            </p>
            <Link to="/create" className="text-amber font-medium text-sm hover:underline">
              Go to Create Message &rarr;
            </Link>
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
