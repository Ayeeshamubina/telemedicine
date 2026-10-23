import React, { useState, useEffect, useRef } from 'react';
import { Languages, Send, AlertCircle, Sparkles, CheckCircle2, MessageSquare, ArrowLeftRight, Mic, MicOff, Volume2 } from 'lucide-react';
import { api } from '../../services/api';

const AVAILABLE_LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'];

const LANG_CODE_MAP = {
  tamil: 'ta',
  english: 'en',
  hindi: 'hi',
  telugu: 'te',
  malayalam: 'ml',
  kannada: 'kn',
  ta: 'ta',
  en: 'en',
  hi: 'hi',
  te: 'te',
  ml: 'ml',
  kn: 'kn'
};

const LANG_SPEECH_MAP = {
  tamil: 'ta-IN',
  english: 'en-US',
  hindi: 'hi-IN',
  telugu: 'te-IN',
  malayalam: 'ml-IN',
  kannada: 'kn-IN',
  ta: 'ta-IN',
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
  ml: 'ml-IN',
  kn: 'kn-IN'
};

const QUICK_PHRASES = {
  patient: {
    Tamil: [
      'வணக்கம் டாக்டர்',
      'எனக்கு காய்ச்சல் மற்றும் தலைவலி',
      'மருந்து எப்படி சாப்பிட வேண்டும்?',
      'ரொம்ப நன்றி டாக்டர்'
    ],
    English: [
      'Hello Doctor',
      'I have severe fever and headache',
      'How should I take this medicine?',
      'Thank you so much Doctor'
    ],
    Hindi: [
      'नमस्ते डॉक्टर',
      'मुझे बुखार और सिरदर्द है',
      'दवा कैसे लेनी है?',
      'धन्यवाद डॉक्टर'
    ]
  },
  doctor: {
    English: [
      'Are you ok?',
      'Hello, how can I help you today?',
      'Where does it hurt?',
      'Do you have fever or headache?',
      'Take this tablet twice daily after food',
      'Drink plenty of warm water and take rest',
      'Do not worry, you will be fine soon'
    ],
    Tamil: [
      'வணக்கம், உங்களுக்கு என்ன பிரச்சினை?',
      'எங்கு வலிக்கிறது?',
      'இந்த மருந்தை உணவுக்குப் பின் சாப்பிடவும்',
      'கவலைப்பட வேண்டாம், சரியாகிவிடும்'
    ],
    Hindi: [
      'नमस्ते, आज मैं आपकी क्या मदद कर सकता हूँ?',
      'कहाँ दर्द हो रहा है?',
      'यह दवाई दिन में दो बार खाने के बाद लें',
      'चिंता न करें, आप जल्द ठीक हो जाएंगे'
    ]
  }
};

export const LanguageBridge = ({
  patientLanguage = 'Tamil',
  doctorLanguage = 'English',
  onPatientLangChange,
  onDoctorLangChange,
  onSwapLanguages,
  messages = [],
  onSendMessage,
  currentUser,
  consultation
}) => {
  const [inputText, setInputText] = useState('');
  const [translationStatus, setTranslationStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [activePhraseTab, setActivePhraseTab] = useState(currentUser?.role === 'doctor' ? 'doctor' : 'patient');
  const [sendAsRole, setSendAsRole] = useState('auto'); // 'auto' | 'doctor' | 'patient'
  const recognitionRef = useRef(null);

  const doctorDisplayName = consultation?.doctor?.name || (currentUser?.role === 'doctor' ? currentUser.name : 'Dr. Ravi');
  const patientDisplayName = consultation?.patient?.name || (currentUser?.role === 'patient' ? currentUser.name : 'Ayeesha');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.translation.getStatus();
        if (res.success) {
          setTranslationStatus(res.data);
        }
      } catch (err) {
        console.error('Failed to get translation status:', err);
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const playVoice = (text, lang) => {
    if (!text) return;
    const l = (lang || 'en').toLowerCase().trim();
    const langCode = LANG_CODE_MAP[l] || 'en';
    try {
      const audioUrl = api.translation.getTtsAudioUrl(text, langCode);
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = LANG_SPEECH_MAP[l] || 'en-US';
          window.speechSynthesis.speak(u);
        }
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const myLang = currentUser.role === 'patient' ? patientLanguage : doctorLanguage;
  const targetLang = currentUser.role === 'patient' ? doctorLanguage : patientLanguage;

  const sendMessageWithTranslation = async (textToSend, forcedRole = null) => {
    if (!textToSend || !textToSend.trim()) return;
    const cleanText = textToSend.trim();

    // Determine sender role: respect forcedRole, explicit sendAsRole override, or detect by content in auto mode
    let role = forcedRole;
    if (!role) {
      if (sendAsRole && sendAsRole !== 'auto') {
        role = sendAsRole;
      } else {
        const hasEnglish = /[a-zA-Z]/.test(cleanText);
        const hasTamil = /[\u0B80-\u0BFF]/.test(cleanText);
        if (hasEnglish && !hasTamil) {
          role = 'doctor';
        } else if (hasTamil) {
          role = 'patient';
        } else {
          role = currentUser?.role || 'patient';
        }
      }
    }

    const senderName = role === 'doctor' ? doctorDisplayName : patientDisplayName;
    const senderRole = role;

    let sL = role === 'doctor' ? (doctorLanguage || 'English') : (patientLanguage || 'Tamil');
    let tL = role === 'doctor' ? (patientLanguage || 'Tamil') : (doctorLanguage || 'English');

    let translatedText = cleanText;
    try {
      const transRes = await api.translation.translate(cleanText, sL, tL);
      if (transRes.success && transRes.translatedText) {
        translatedText = transRes.translatedText;
      }
    } catch (err) {
      console.error('Translation error:', err);
    }

    const messageData = {
      id: Date.now().toString(),
      senderName,
      senderRole,
      text: cleanText,
      translatedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (onSendMessage) {
      onSendMessage(messageData);
    }
    setInputText('');
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessageWithTranslation(inputText);
  };

  // Push-to-Talk / Voice Input
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported directly in this browser. Please use keyboard dictation 🎤 or type message.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = LANG_SPEECH_MAP[myLang.toLowerCase()] || 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
      };

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText(transcript);
        }
      };

      rec.onerror = (event) => {
        console.warn('Voice input error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Could not start voice input:', err);
      setIsRecording(false);
    }
  };

  const doctorPhrases = QUICK_PHRASES.doctor?.[doctorLanguage] || QUICK_PHRASES.doctor?.English || [];
  const patientPhrases = QUICK_PHRASES.patient?.[patientLanguage] || QUICK_PHRASES.patient?.Tamil || [];
  const activePhrases = activePhraseTab === 'doctor' ? doctorPhrases : patientPhrases;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e2e8f0'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={20} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#0f172a' }}>
              Language Bridge
            </h3>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
            Live Translation Active
          </span>
        </div>

        {/* Interactive Language Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
          <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>Patient Speaks</span>
            {onPatientLangChange ? (
              <select
                value={patientLanguage}
                onChange={(e) => onPatientLangChange(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#0369a1',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '1px 0'
                }}
              >
                {AVAILABLE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : (
              <strong style={{ color: '#0f172a' }}>{patientLanguage}</strong>
            )}
          </div>

          {onSwapLanguages && (
            <button
              type="button"
              onClick={onSwapLanguages}
              className="btn btn-secondary btn-sm"
              style={{ padding: '6px 8px', borderRadius: '6px', height: '34px', flexShrink: 0 }}
              title="Swap Languages"
            >
              <ArrowLeftRight size={14} color="#0284c7" />
            </button>
          )}

          <div style={{ flex: 1, backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', fontWeight: 600 }}>Doctor Speaks</span>
            {onDoctorLangChange ? (
              <select
                value={doctorLanguage}
                onChange={(e) => onDoctorLangChange(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#0f766e',
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '1px 0'
                }}
              >
                {AVAILABLE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            ) : (
              <strong style={{ color: '#0f172a' }}>{doctorLanguage}</strong>
            )}
          </div>
        </div>
      </div>

      {/* Messages stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem', margin: 'auto' }}>
            <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, color: '#475569' }}>Speech & Text Translation Active</div>
            <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
              Doctor ({doctorDisplayName}) speaks {doctorLanguage} ⇄ Patient ({patientDisplayName}) speaks {patientLanguage}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isDoctor = (msg.senderRole || '').toLowerCase() === 'doctor';
            const isMe = msg.senderRole === currentUser?.role;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isDoctor ? (currentUser?.role === 'doctor' ? 'flex-end' : 'flex-start') : (currentUser?.role === 'patient' ? 'flex-end' : 'flex-start'),
                  maxWidth: '85%'
                }}
              >
                <div
                  style={{
                    fontSize: '0.74rem',
                    color: isDoctor ? '#0f766e' : '#0369a1',
                    fontWeight: 700,
                    marginBottom: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: (isDoctor ? (currentUser?.role === 'doctor') : (currentUser?.role === 'patient')) ? 'flex-end' : 'flex-start',
                    gap: '5px'
                  }}
                >
                  <span>{isDoctor ? '🩺' : '👤'}</span>
                  <span>{msg.senderName} ({isDoctor ? 'Doctor' : 'Patient'})</span>
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>• {msg.timestamp}</span>
                </div>
                <div
                  style={{
                    backgroundColor: isDoctor ? '#0f766e' : '#0284c7',
                    color: '#ffffff',
                    padding: '9px 13px',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    wordBreak: 'break-word',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                  }}
                >
                  <div>{msg.text}</div>
                  {msg.translatedText && msg.translatedText !== msg.text && (
                    <div
                      style={{
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '1px solid rgba(255,255,255,0.25)',
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: isDoctor ? '#a7f3d0' : '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <span>⇄ {msg.translatedText}</span>
                      <button
                        type="button"
                        onClick={() => playVoice(msg.translatedText, isDoctor ? 'Tamil' : 'English')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: '#ffffff'
                        }}
                        title="Replay translated voice"
                      >
                        <Volume2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Phrases Tabs (Doctor & Patient) */}
      <div style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '4px 8px', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActivePhraseTab('doctor')}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activePhraseTab === 'doctor' ? '#0f766e' : 'transparent',
              color: activePhraseTab === 'doctor' ? '#ffffff' : '#64748b'
            }}
          >
            🩺 Doctor Phrases
          </button>
          <button
            type="button"
            onClick={() => setActivePhraseTab('patient')}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activePhraseTab === 'patient' ? '#0284c7' : 'transparent',
              color: activePhraseTab === 'patient' ? '#ffffff' : '#64748b'
            }}
          >
            👤 Patient Phrases
          </button>
        </div>

        {/* Phrases List */}
        {activePhrases.length > 0 && (
          <div
            style={{
              padding: '6px 10px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: '6px'
            }}
          >
            {activePhrases.map((phrase, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessageWithTranslation(phrase, activePhraseTab)}
                style={{
                  backgroundColor: '#ffffff',
                  border: activePhraseTab === 'doctor' ? '1px solid #99f6e4' : '1px solid #bae6fd',
                  borderRadius: '9999px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  color: activePhraseTab === 'doctor' ? '#0f766e' : '#0369a1',
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontWeight: 600
                }}
                title={`Click to send as ${activePhraseTab === 'doctor' ? doctorDisplayName : patientDisplayName}`}
              >
                {phrase}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Form with Send-As Selector and Mic Dictation */}
      <div style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px 0', fontSize: '0.72rem', color: '#64748b' }}>
          <span style={{ fontWeight: 600 }}>Send as:</span>
          <button
            type="button"
            onClick={() => setSendAsRole('auto')}
            style={{
              background: sendAsRole === 'auto' ? '#0284c7' : 'transparent',
              color: sendAsRole === 'auto' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '1px 7px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ⚡ Auto
          </button>
          <button
            type="button"
            onClick={() => setSendAsRole('doctor')}
            style={{
              background: sendAsRole === 'doctor' ? '#0f766e' : 'transparent',
              color: sendAsRole === 'doctor' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '1px 7px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🩺 {doctorDisplayName}
          </button>
          <button
            type="button"
            onClick={() => setSendAsRole('patient')}
            style={{
              background: sendAsRole === 'patient' ? '#0369a1' : 'transparent',
              color: sendAsRole === 'patient' ? '#ffffff' : '#64748b',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '1px 7px',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            👤 {patientDisplayName}
          </button>
        </div>

        <form
          onSubmit={handleSend}
          style={{
            padding: '8px 10px 10px',
            display: 'flex',
            gap: '6px',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            style={{
              backgroundColor: isRecording ? '#ef4444' : '#f1f5f9',
              border: isRecording ? '1px solid #dc2626' : '1px solid #cbd5e1',
              color: isRecording ? '#ffffff' : '#475569',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              animation: isRecording ? 'pulse 1s infinite' : 'none'
            }}
            title={isRecording ? 'Listening... click to stop' : `Click to speak`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <input
            type="text"
            placeholder={isRecording ? `🎤 Listening...` : `Type message in English or Tamil...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="form-input"
            style={{ padding: '8px 12px', fontSize: '0.88rem', flex: 1 }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '8px 12px' }}
            disabled={!inputText.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
