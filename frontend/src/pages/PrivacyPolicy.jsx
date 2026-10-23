import React from 'react';
import { Shield, Lock, EyeOff, Server } from 'lucide-react';

export const PrivacyPolicy = () => {
  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '820px' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#0f172a' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '32px' }}>
          Last updated: October 2026. This policy outlines how MEDIBRIDGE collects, processes, and protects your medical information and personal data.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: '#334155', lineHeight: 1.7 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              1. Sensitive Medical Data Protection
            </h3>
            <p>
              MEDIBRIDGE treats all patient information, medical histories, and digital prescriptions as strictly confidential healthcare data. Access to medical records is restricted exclusively to the patient and their consulting physician.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              2. Real-Time Telemedicine & Audio/Video Streams
            </h3>
            <p>
              Video and audio communications during consultations are transmitted directly via peer-to-peer WebRTC connections secured by DTLS and SRTP end-to-end encryption. Live media streams are not recorded or persisted on our servers without explicit patient and physician authorization.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              3. Interpreter Role & Confidentiality
            </h3>
            <p>
              Human medical interpreters who assist consultations receive access strictly to live verbal communication for the duration of the active consultation. Interpreters are bound by professional medical confidentiality agreements and have no access to historical medical records outside active sessions.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
              4. Data Storage & Security Controls
            </h3>
            <p>
              User authentication credentials are encrypted using industry-standard salted hashing algorithms (bcrypt). Access tokens are signed cryptographically via JSON Web Tokens (JWT) and expired automatically to guard against unauthorized access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
