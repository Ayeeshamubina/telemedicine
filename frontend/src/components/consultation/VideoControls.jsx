import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Languages, Volume2, Sparkles } from 'lucide-react';

export const VideoControls = ({
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  onRequestInterpreter,
  showInterpreterBtn = true,
  isSpeechRecognitionActive = false,
  onToggleSpeechRecognition,
  audioBlocked = false,
  onUnblockAudio
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '12px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '24px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
        flexWrap: 'wrap'
      }}
    >
      {/* Unblock Audio Button if blocked by mobile browser */}
      {audioBlocked && onUnblockAudio && (
        <button
          onClick={onUnblockAudio}
          style={{
            height: '46px',
            padding: '0 16px',
            borderRadius: '9999px',
            border: 'none',
            backgroundColor: '#f59e0b',
            color: '#0f172a',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            animation: 'pulse 1.5s infinite'
          }}
          title="Tap to enable sound"
        >
          <Volume2 size={18} />
          <span>Tap to Hear Audio</span>
        </button>
      )}

      {/* Microphone toggle */}
      <button
        onClick={onToggleAudio}
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isAudioMuted ? '#ef4444' : '#334155',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        aria-label={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
      >
        {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {/* Camera toggle */}
      <button
        onClick={onToggleVideo}
        style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: isVideoMuted ? '#ef4444' : '#334155',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
        aria-label={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
      >
        {isVideoMuted ? <VideoOff size={20} /> : <Video size={20} />}
      </button>

      {/* Live Speech Recognition & Real-Time Translation Button */}
      {onToggleSpeechRecognition && (
        <button
          onClick={onToggleSpeechRecognition}
          style={{
            height: '46px',
            padding: '0 16px',
            borderRadius: '9999px',
            border: isSpeechRecognitionActive ? '2px solid #38bdf8' : '1px solid #475569',
            backgroundColor: isSpeechRecognitionActive ? '#0284c7' : '#1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            boxShadow: isSpeechRecognitionActive ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
          }}
          title={isSpeechRecognitionActive ? 'Live Speech Translation ACTIVE - Click to pause' : 'Start Live Speech Translation'}
        >
          <Sparkles size={18} color={isSpeechRecognitionActive ? '#ffffff' : '#38bdf8'} />
          <span>{isSpeechRecognitionActive ? 'Translating Live' : 'Live Translation'}</span>
        </button>
      )}

      {/* Request Interpreter Button (Section 29) */}
      {showInterpreterBtn && (
        <button
          onClick={onRequestInterpreter}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '9999px',
            border: '1px solid #0284c7',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Request a human medical interpreter to join this consultation"
        >
          <Languages size={18} />
          <span>Request Interpreter</span>
        </button>
      )}

      {/* End Call Button */}
      <button
        onClick={onEndCall}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '9999px',
          border: 'none',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="End Consultation"
        aria-label="End Consultation"
      >
        <PhoneOff size={18} />
        <span>End Call</span>
      </button>
    </div>
  );
};
