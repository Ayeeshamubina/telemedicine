import React from 'react';
import { Link } from 'react-router-dom';

export const Logo = ({ size = 'normal', linkTo = '/' }) => {
  const isLarge = size === 'large';

  const content = (
    <div style={{ display: 'flex', alignItems: 'center', gap: isLarge ? '14px' : '10px' }}>
      {/* Original Medical + Bridge SVG Logo */}
      <div
        style={{
          width: isLarge ? '48px' : '38px',
          height: isLarge ? '48px' : '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #0284c7 0%, #0f766e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
          flexShrink: 0
        }}
      >
        <svg
          width={isLarge ? '28' : '22'}
          height={isLarge ? '28' : '22'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Medical Cross Symbol */}
          <path d="M12 5v14" />
          <path d="M5 12h14" />
          {/* Bridge / Arch Connection Motif */}
          <path d="M3 19c3-4 6-6 9-6s6 2 9 6" strokeOpacity="0.85" strokeWidth="1.8" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontSize: isLarge ? '1.5rem' : '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#0f172a',
            lineHeight: 1.15
          }}
        >
          MEDIBRIDGE
        </span>
        <span
          style={{
            fontSize: isLarge ? '0.78rem' : '0.68rem',
            fontWeight: 500,
            color: '#0369a1',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
            marginTop: '2px'
          }}
        >
          Healthcare Without Language Barriers
        </span>
      </div>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {content}
      </Link>
    );
  }

  return content;
};
