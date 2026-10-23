import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ message = 'Loading...', size = 'default' }) => {
  const isLarge = size === 'large';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isLarge ? '64px 24px' : '32px 16px',
        gap: '12px'
      }}
    >
      <Loader2
        size={isLarge ? 36 : 24}
        color="#0284c7"
        className="animate-spin"
        style={{ animation: 'spin 1s linear infinite' }}
      />
      {message && (
        <span style={{ color: '#475569', fontSize: '0.92rem', fontWeight: 500 }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
