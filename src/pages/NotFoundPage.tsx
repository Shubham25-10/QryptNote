import React from 'react';
import { Link } from 'react-router';
import { Ghost, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="bg-panel border border-hairline rounded-3xl p-12 max-w-lg w-full flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-violet/5 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet/20 via-ink to-ink" />
        <div className="w-20 h-20 bg-ink rounded-full flex items-center justify-center mb-6 relative z-10 border border-hairline">
          <Ghost className="w-10 h-10 text-violet" />
        </div>
        <h1 className="text-4xl font-display font-bold text-text-primary mb-4 relative z-10">{t("not_found.title")}</h1>
        <h2 className="text-xl font-medium text-text-primary mb-2 relative z-10">{t("not_found.subtitle")}</h2>
        <p className="text-text-muted font-sans mb-8 relative z-10">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="flex items-center justify-center gap-2 px-8 py-3 bg-violet hover:bg-violet/90 text-white rounded-md font-sans font-medium transition-all shadow-[0_0_15px_rgba(124,92,255,0.3)] relative z-10 w-full sm:w-auto"
        >
          <Home className="w-5 h-5" />
          
        </Link>
      </div>
    </div>
  );
}
