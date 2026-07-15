import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
      <Helmet>
        <title>{t('privacy_page.title')} | QryptNote</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
          {t('privacy_page.title')}
        </h1>
        <p className="text-text-muted font-sans mb-12">{t('privacy_page.last_updated')}</p>

        <div className="space-y-8 text-text-muted font-sans text-base sm:text-lg leading-relaxed">
          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s1_title')}
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Message Content:</strong> {t('privacy_page.s1_p1').replace(/^Message Content:\s*/, '')}</li>
              <li><strong>Technical Data:</strong> {t('privacy_page.s1_p2').replace(/^Technical Data:\s*/, '')}</li>
              <li><strong>Diagnostic Data:</strong> {t('privacy_page.s1_p3').replace(/^Diagnostic Data:\s*/, '')}</li>
              <li><strong>Payment Information:</strong> {t('privacy_page.s1_p4').replace(/^Payment Information:\s*/, '')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s2_title')}
            </h2>
            <p>{t('privacy_page.s2_p1')}</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>{t('privacy_page.s2_l1')}</li>
              <li>{t('privacy_page.s2_l2')}</li>
              <li>{t('privacy_page.s2_l3')}</li>
              <li>{t('privacy_page.s2_l4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s3_title')}
            </h2>
            <p>{t('privacy_page.s3_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s4_title')}
            </h2>
            <p>{t('privacy_page.s4_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s5_title')}
            </h2>
            <p>{t('privacy_page.s5_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s6_title')}
            </h2>
            <p>{t('privacy_page.s6_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s7_title')}
            </h2>
            <p>{t('privacy_page.s7_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s8_title')}
            </h2>
            <p>{t('privacy_page.s8_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s9_title')}
            </h2>
            <p>{t('privacy_page.s9_p1')}</p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-text-primary mb-4">
              {t('privacy_page.s10_title')}
            </h2>
            <p>{t('privacy_page.s10_p1')}</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
