import React from 'react';
import { Inbox, UserCheck, CalendarX, FileText, Globe2 } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No items found',
  description = '',
  actionText = '',
  onAction = null
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px dashed #cbd5e1',
        borderRadius: '16px',
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '560px',
        margin: '24px auto'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#f1f5f9',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <Icon size={28} />
      </div>

      <h3 style={{ fontSize: '1.2rem', color: '#0f172a', marginBottom: '8px', fontWeight: 600 }}>
        {title}
      </h3>

      {description && (
        <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: actionText ? '20px' : '0', maxWidth: '400px' }}>
          {description}
        </p>
      )}

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
