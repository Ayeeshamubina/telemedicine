import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Video, Languages, ShieldCheck, HeartHandshake } from 'lucide-react';

export const About = () => {
  const { t } = useTranslation();

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '16px', color: '#0f172a' }}>
            {t('about.title')}
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {t('about.desc')}
          </p>
        </div>

        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', textAlign: 'center', color: '#0f172a' }}>
            {t('about.howItWorks')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1 */}
            <div className="card" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '20px', padding: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Search size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#0f172a' }}>
                  {t('about.step1Title')}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  {t('about.step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '20px', padding: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Calendar size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#0f172a' }}>
                  {t('about.step2Title')}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  {t('about.step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '20px', padding: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Video size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#0f172a' }}>
                  {t('about.step3Title')}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  {t('about.step3Desc')}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="card" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '20px', padding: '24px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: '#ccfbf1',
                  color: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Languages size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', color: '#0f172a' }}>
                  {t('about.step4Title')}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
                  {t('about.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Commitment to Patient Care */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <HeartHandshake size={48} color="#0284c7" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#0f172a' }}>
              Our Care Standard
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
              We believe quality healthcare should never be compromised by linguistic distance. MEDIBRIDGE unites real verified medical professionals and certified interpreters on one streamlined, secure platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
