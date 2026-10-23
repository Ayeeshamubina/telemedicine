import React from 'react';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const TermsOfService = () => {
  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0f172a' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '32px' }}>
          Please review these Terms of Service carefully before utilizing the MEDIBRIDGE platform.
        </p>

        {/* Emergency Medical Disclaimer (Section 50) */}
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', color: '#92400e', margin: '0 0 6px', fontWeight: 700 }}>
              Emergency Medical Disclaimer
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#78350f', margin: 0, lineHeight: 1.5 }}>
              MEDIBRIDGE IS NOT INTENDED FOR MEDICAL EMERGENCIES. If you are experiencing a life-threatening health event, severe chest pain, shortness of breath, uncontrolled bleeding, or acute psychological crisis, please immediately dial your local emergency services (e.g. 102/108/911) or proceed to the nearest emergency hospital.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: '#334155', lineHeight: 1.7 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              1. Platform Nature & Medical Relationship
            </h3>
            <p>
              MEDIBRIDGE serves as a real-time technology bridge connecting licensed healthcare practitioners, certified medical interpreters, and patients. Clinical decisions, diagnoses, and medical prescriptions are formulated exclusively by registered, qualified physicians.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              2. Multilingual Interpretation & Translation
            </h3>
            <p>
              While MEDIBRIDGE facilitates live interpretation and translation to bridge language barriers, medical communication involves nuanced context. Automated machine translation, when configured, is provided solely as an assistive tool and does not replace human professional judgement.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              3. Doctor Credentialing & Verification
            </h3>
            <p>
              Doctors registering on MEDIBRIDGE represent that they hold valid medical licenses in their respective jurisdictions. Practitioners are responsible for adhering to applicable national telemedicine practice guidelines and ethical codes.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              4. Patient Appointment Commitments
            </h3>
            <p>
              Patients agree to provide accurate medical information and arrive punctually for scheduled in-clinic visits and virtual video consultation sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
