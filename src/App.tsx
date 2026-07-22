import { AmbientBackground } from "./components/AmbientBackground";
import { MagneticElement } from "./components/MagneticElement";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useEffect, useRef } from "react";

import { Routes, Route, Link, useLocation } from "react-router";
import { Shield, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { AnimatePresence } from "motion/react";

import LandingPage from "./pages/LandingPage";
import CreatePage from "./pages/CreatePage";
import ViewPage from "./pages/ViewPage";
import PricingPage from "./pages/PricingPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NotFoundPage from "./pages/NotFoundPage";
import BugReporter from "./components/BugReporter";

export default function App() {
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const root = document.documentElement;
    const hour = new Date().getHours();
    
    // Dynamic ambient color shift tied to time of day
    if (hour >= 20 || hour < 6) {
      // Night: cooler/deeper
      root.style.setProperty('--color-ink', '#050000');
      root.style.setProperty('--color-panel', '#0E0202');
    } else {
      // Day: warmer undertone
      root.style.setProperty('--color-ink', '#080101');
      root.style.setProperty('--color-panel', '#120303');
    }

    const handleMouseMove = (e: MouseEvent) => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;
      
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      
      // Update spotlight position
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--mouse-x', `${x}%`);
        spotlightRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
      
      // Update global tilt for 3D typography
      const tiltX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const tiltY = (e.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty('--tilt-x', String(tiltX));
      root.style.setProperty('--tilt-y', String(tiltY));
    };

    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion || !e.gamma || !e.beta) return;
      
      // Mobile tilt for 3D typography
      const tiltX = Math.min(Math.max(e.gamma / 45, -1), 1);
      const tiltY = Math.min(Math.max(e.beta / 45, -1), 1);
      root.style.setProperty('--tilt-x', String(tiltX));
      root.style.setProperty('--tilt-y', String(tiltY));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsMobileMenuOpen(false);
  };

  const domain = "https://qrypt-note.vercel.app"; // Or whatever base URL

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QryptNote",
    operatingSystem: "Web",
    applicationCategory: "UtilitiesApplication",
    description: t("app.subtitle"),
    url: domain,
  };

  return (
    <div className="min-h-screen bg-transparent text-text-primary font-sans selection:bg-violet/30 flex flex-col">
      <Helmet>
        <title>
          {t("app.title")} | {t("app.subtitle")}
        </title>
        <meta name="description" content={t("app.subtitle")} />
        <meta property="og:title" content={t("app.title")} />
        <meta property="og:description" content={t("app.subtitle")} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={domain} />
        <meta property="og:image" content={`${domain}/og-image.jpg`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="qrypt-note.vercel.app" />
        <meta property="twitter:url" content={domain} />
        <meta name="twitter:title" content={t("app.title")} />
        <meta name="twitter:description" content={t("app.subtitle")} />
        <meta name="twitter:image" content={`${domain}/og-image.jpg`} />

        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      
      <AmbientBackground />
      {/* Global Starry Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c0202] via-ink to-ink" />
        <div className="absolute top-0 left-0 w-[1px] h-[1px] bg-transparent stars-1 animate-[animStar_50s_linear_infinite]" />
        <div className="absolute top-0 left-0 w-[2px] h-[2px] bg-transparent stars-2 animate-[animStar_80s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(circle_at_center,black_40%,transparent_80%)]" />
      </div>
      {/* Morphing Blobs */}
      {location.pathname !== '/msg/:id' && !location.pathname.startsWith('/msg/') && (
        <div className="blob-container">
          <div className="morphing-blob"></div>
          <div className="morphing-blob morphing-blob-2"></div>
        </div>
      )}
      {/* Spotlight cursor effect */}
      <div className="spotlight-wrapper fixed inset-0 pointer-events-none z-50">
        <div ref={spotlightRef} className="spotlight-overlay" />
      </div>

      <BugReporter />
      <nav className="border-b border-hairline bg-ink/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <MagneticElement strength={15}><Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 text-white font-display hover:opacity-80 transition-opacity z-50"
          >
            <Shield className="w-5 h-5 text-violet flex-shrink-0" />
            <div className="flex flex-col">
              <span className="tracking-tight text-lg leading-tight truncate">
                {t("app.title")}
              </span>
              <span className="text-[10px] text-text-muted leading-tight hidden sm:block font-sans truncate">
                {t("app.subtitle")}
              </span>
            </div>
          </Link></MagneticElement>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <div className="flex gap-1">
              <button
                onClick={() => changeLanguage("en")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-xs hover:text-white transition-colors ${i18n.language.startsWith("en") ? "text-white" : "text-text-muted"}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage("es")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-xs hover:text-white transition-colors ${i18n.language.startsWith("es") ? "text-white" : "text-text-muted"}`}
              >
                ES
              </button>
              <button
                onClick={() => changeLanguage("fr")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-xs hover:text-white transition-colors ${i18n.language.startsWith("fr") ? "text-white" : "text-text-muted"}`}
              >
                FR
              </button>
            </div>
            <MagneticElement strength={20}><Link
              to="/pricing"
              className="text-text-muted hover:text-text-primary transition-colors min-h-[44px] flex items-center justify-center px-2"
            >
              {t("app.pricing")}
            </Link></MagneticElement>
            <MagneticElement strength={25}><Link
              to="/create"
              className="bg-amber text-ink px-4 py-2 rounded-xl hover:bg-amber/90 transition-colors shadow-[0_0_15px_rgba(124,92,255,0.3)] hover:shadow-[0_0_20px_rgba(124,92,255,0.5)] min-h-[44px] flex items-center justify-center"
            >
              {t("app.create")}
            </Link></MagneticElement>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text-primary z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-ink/95 backdrop-blur-xl border-b border-hairline p-4 flex flex-col gap-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-center gap-4 py-2 border-b border-hairline/50">
              <button
                onClick={() => changeLanguage("en")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium hover:text-white transition-colors ${i18n.language.startsWith("en") ? "text-white bg-white/10 rounded-xl" : "text-text-muted"}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage("es")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium hover:text-white transition-colors ${i18n.language.startsWith("es") ? "text-white bg-white/10 rounded-xl" : "text-text-muted"}`}
              >
                ES
              </button>
              <button
                onClick={() => changeLanguage("fr")}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-medium hover:text-white transition-colors ${i18n.language.startsWith("fr") ? "text-white bg-white/10 rounded-xl" : "text-text-muted"}`}
              >
                FR
              </button>
            </div>
            
            <Link
              to="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-text-primary hover:bg-white/5 p-4 rounded-lg text-center font-medium transition-colors"
            >
              {t("app.pricing")}
            </Link>
            <Link
              to="/create"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-amber text-ink p-4 rounded-lg text-center font-medium shadow-[0_0_15px_rgba(124,92,255,0.3)]"
            >
              {t("app.create")}
            </Link>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/msg/:id" element={<ViewPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="border-t border-hairline bg-panel mt-auto py-8 md:py-12 text-center text-sm text-text-muted relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p>
            © {new Date().getFullYear()} QryptNote. {t("app.footer_slogan")}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/privacy-policy"
              className="hover:text-text-primary transition-colors min-h-[44px] flex items-center px-2"
            >
              {t("app.privacy")}
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-text-primary transition-colors min-h-[44px] flex items-center px-2"
            >
              {t("app.terms")}
            </Link>
          </div>
        </div>
        <div className="mt-8 px-4 w-full flex justify-center">
        </div>
      </footer>
    </div>
  );
}
