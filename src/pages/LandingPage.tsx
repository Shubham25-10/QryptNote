import { PageTransition } from "../components/PageTransition";
import { TiltCard } from '../components/TiltCard';
import { MagneticElement } from '../components/MagneticElement';
import React, { Suspense, useRef } from 'react';
import { WebGLBoundary } from '../components/WebGLBoundary';
import { ScrollJourneyLine } from '../components/ScrollJourneyLine';

import { Link } from "react-router";
import { Shield, Lock, Send, ScanLine } from "lucide-react";
import { motion } from "motion/react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

const CipherCanvas = React.lazy(() => import("../components/CipherCanvas"));

export default function LandingPage() {
  const { t } = useTranslation();
  const howItWorksRef = useRef<HTMLElement>(null);

  return (
    <PageTransition className="flex flex-col items-center">
      <Helmet>
        <title>{t("landing.helmet_title")}</title>
        <meta name="description" content={t("landing.helmet_desc")} />
        <meta property="og:title" content={t("landing.helmet_title")} />
        <meta property="og:description" content={t("landing.helmet_desc")} />
      </Helmet>
      {/* Hero Section */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* 3D Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <Suspense fallback={<div className="w-full h-full bg-ink" />}>
            <WebGLBoundary><CipherCanvas isHero scrollCamera className="w-full h-full" /></WebGLBoundary>
          </Suspense>
        </div>

        {/* Subtle dark gradient overlay behind text */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-ink/20 via-ink/60 to-ink pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.15)_0,transparent_50%)] pointer-events-none z-0" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(94,234,212,0.1)_0,transparent_50%)] pointer-events-none z-0 mix-blend-screen" />


        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef233c]"></span>
              </span>
              <span className="text-xs font-semibold text-red-100/95 tracking-wide font-display">
                {t("landing.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[36px] sm:text-[48px] md:text-[64px] leading-tight font-display font-bold tracking-tight mb-6 px-2 text-white text-3d-layered"
              dangerouslySetInnerHTML={{ __html: t("landing.headline") }}
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-text-muted max-w-2xl mb-12 font-sans px-4"
            >
              {t("landing.subheadline")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full px-4 sm:px-0 sm:w-auto"
            >
              <MagneticElement strength={25}>
                <Link
                  to="/create"
                  className="w-full sm:w-auto shiny-cta group inline-flex items-center justify-center text-white px-8 py-4 text-lg font-sans font-medium shadow-[0_0_25px_rgba(239,35,60,0.25)] hover:shadow-[0_0_35px_rgba(239,35,60,0.45)]"
                >
                  <span className="relative z-10 flex items-center gap-2 text-white font-medium">
                    {t("landing.create_button")}
                    <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </MagneticElement>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={howItWorksRef} className="w-full border-t border-hairline bg-panel/30 py-32 relative z-10">
        <ScrollJourneyLine containerRef={howItWorksRef} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6 relative z-10"
        >
          <div className="text-center mb-20">
            <h2 className="text-[32px] md:text-[40px] font-display font-bold mb-4 text-text-primary">
              {t("landing.how_it_works")}
            </h2>
            <p className="text-text-muted font-sans text-lg">
              {t("landing.how_it_works_sub")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 perspective-container">
            <TiltCard className="p-8 rounded-xl bg-panel border border-hairline transition-colors hover:border-violet/30 h-full w-full">
              <div className="w-12 h-12 bg-violet/10 rounded-lg flex items-center justify-center mb-6 border border-violet/20 icon-depth-container">
    <Lock className="w-6 h-6 text-violet icon-depth-base" />
    <Lock className="w-6 h-6 text-violet icon-depth-shadow" />
  </div>
              <h3 className="text-xl font-sans font-medium mb-3 text-text-primary">
                {t("landing.step1_title")}
              </h3>
              <p className="text-text-muted font-sans leading-relaxed">
                {t("landing.step1_desc")}
              </p>
            </TiltCard>

            <TiltCard className="p-8 rounded-xl bg-panel border border-hairline transition-colors hover:border-violet/30 h-full w-full">
              <div className="w-12 h-12 bg-violet/10 rounded-lg flex items-center justify-center mb-6 border border-violet/20 icon-depth-container">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet icon-depth-base"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet icon-depth-shadow"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </div>
              <h3 className="text-xl font-sans font-medium mb-3 text-text-primary">
                {t("landing.step2_title")}
              </h3>
              <p className="text-text-muted font-sans leading-relaxed">
                {t("landing.step2_desc")}
              </p>
            </TiltCard>

            <TiltCard className="p-8 rounded-xl bg-panel border border-hairline transition-colors hover:border-violet/30 h-full w-full">
              <div className="w-12 h-12 bg-violet/10 rounded-lg flex items-center justify-center mb-6 border border-violet/20 icon-depth-container">
    <ScanLine className="w-6 h-6 text-violet icon-depth-base" />
    <ScanLine className="w-6 h-6 text-violet icon-depth-shadow" />
  </div>
              <h3 className="text-xl font-sans font-medium mb-3 text-text-primary">
                {t("landing.step3_title")}
              </h3>
              <p className="text-text-muted font-sans leading-relaxed">
                {t("landing.step3_desc")}
              </p>
            </TiltCard>
          </div>
        </motion.div>
      </section>

      {/* 1GB Free Any File Type Feature Section */}
      <section className="w-full bg-ink/70 border-t border-hairline py-24 relative z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal/10 rounded-full blur-3xl pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto px-6 relative z-10"
        >
          <div className="bg-panel/70 border border-violet/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet/15 border border-violet/30 text-xs font-semibold text-violet mb-6">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                  1GB Free For Everyone • Zero Cost
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4 tracking-tight">
                  Share Any File or Folder <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet via-fuchsia-400 to-teal">
                    Up to 1GB Completely Free.
                  </span>
                </h2>
                <p className="text-text-muted font-sans text-base sm:text-lg mb-8 leading-relaxed">
                  No subscription required. Share full-resolution images, HD/4K videos, massive zip archives, entire project folders, and confidential documents with military-grade AES-256 encryption.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="p-3 bg-ink/80 border border-hairline rounded-xl text-center">
                    <p className="text-xl font-display font-bold text-white mb-0.5">1 GB</p>
                    <p className="text-xs text-text-muted font-sans">Free Limit</p>
                  </div>
                  <div className="p-3 bg-ink/80 border border-hairline rounded-xl text-center">
                    <p className="text-xl font-display font-bold text-teal mb-0.5">Any File</p>
                    <p className="text-xs text-text-muted font-sans">Images, Video, Zip</p>
                  </div>
                  <div className="p-3 bg-ink/80 border border-hairline rounded-xl text-center">
                    <p className="text-xl font-display font-bold text-violet mb-0.5">Folders</p>
                    <p className="text-xs text-text-muted font-sans">Auto-packaged ZIP</p>
                  </div>
                  <div className="p-3 bg-ink/80 border border-hairline rounded-xl text-center">
                    <p className="text-xl font-display font-bold text-amber mb-0.5">AES-256</p>
                    <p className="text-xs text-text-muted font-sans">Client Encrypted</p>
                  </div>
                </div>
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-violet hover:bg-violet/90 text-white rounded-xl font-sans font-medium transition-all shadow-[0_0_20px_rgba(124,92,255,0.3)] hover:scale-105 active:scale-95"
                >
                  <span>Share 1GB File Free</span>
                  <Send className="w-4 h-4" />
                </Link>
              </div>

              {/* Supported types showcase */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-ink/80 border border-hairline rounded-2xl hover:border-violet/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-violet/10 text-violet flex items-center justify-center mb-3 border border-violet/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                  <h4 className="font-display font-bold text-text-primary text-base mb-1">Images & Graphics</h4>
                  <p className="text-xs text-text-muted font-sans">PNG, JPG, RAW, WebP, SVG, GIF with full uncompressed resolution.</p>
                </div>
                <div className="p-5 bg-ink/80 border border-hairline rounded-2xl hover:border-violet/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-3 border border-teal/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
                  </div>
                  <h4 className="font-display font-bold text-text-primary text-base mb-1">Videos & Casts</h4>
                  <p className="text-xs text-text-muted font-sans">MP4, MOV, MKV, WebM up to 1GB free with zero compression.</p>
                </div>
                <div className="p-5 bg-ink/80 border border-hairline rounded-2xl hover:border-violet/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 text-amber flex items-center justify-center mb-3 border border-amber/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                  </div>
                  <h4 className="font-display font-bold text-text-primary text-base mb-1">Entire Folders</h4>
                  <p className="text-xs text-text-muted font-sans">Upload entire directories; auto-packaged into encrypted ZIP archives.</p>
                </div>
                <div className="p-5 bg-ink/80 border border-hairline rounded-2xl hover:border-violet/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 border border-blue-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                  </div>
                  <h4 className="font-display font-bold text-text-primary text-base mb-1">ZIP & Any Document</h4>
                  <p className="text-xs text-text-muted font-sans">PDFs, spreadsheets, codebases, binaries, and custom archives.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Use Cases */}
      <section className="w-full bg-ink py-32 relative z-10 border-t border-hairline">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-6"
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-[32px] md:text-[40px] font-display font-bold mb-8 text-text-primary">
                {t("landing.perfect_for")}
              </h2>
              <ul className="space-y-6">
                {[
                  t("landing.use_case_1"),
                  t("landing.use_case_2"),
                  t("landing.use_case_3"),
                  t("landing.use_case_4"),
                  t("landing.use_case_5"),
                ].map((useCase, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-text-primary font-sans text-base sm:text-lg"
                  >
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-teal flex-shrink-0" />
                    {useCase}
                  </li>
                ))}
              </ul>
              <div className="mt-12">
                <Link
                  to="/pricing"
                  className="text-violet hover:text-violet/80 font-sans font-medium inline-flex items-center gap-2 text-lg transition-colors"
                >
                  {t("landing.view_pricing")}{" "}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            <div className="relative flex justify-center">
              <TiltCard className="w-full max-w-sm aspect-square rounded-2xl bg-panel border border-hairline flex flex-col p-8 items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet/10 to-teal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="relative z-10 bg-white p-4 rounded-xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <svg
                    width="180"
                    height="180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0A0B0F"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <rect x="8" y="14" width="1" height="1"></rect>
                    <rect x="8" y="18" width="1" height="1"></rect>
                    <rect x="18" y="8" width="1" height="1"></rect>
                  </svg>
                </div>
              </TiltCard>
            </div>
          </div>
        </motion.div>
      </section>
    </PageTransition>
  );
}
