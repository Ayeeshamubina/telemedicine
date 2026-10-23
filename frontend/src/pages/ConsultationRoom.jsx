import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoControls } from '../components/consultation/VideoControls';
import { LanguageBridge } from '../components/consultation/LanguageBridge';
import { InterpreterRequestModal } from '../components/consultation/InterpreterRequestModal';
import { PrescriptionModal } from '../components/doctor/PrescriptionModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  AlertTriangle,
  RefreshCw,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Languages,
  Sparkles,
  Subtitles,
  Tv,
  MessageSquare,
  Copy,
  ArrowLeftRight
} from 'lucide-react';

const AVAILABLE_LANGUAGES = ['Tamil', 'English', 'Hindi', 'Telugu', 'Kannada', 'Malayalam'];

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

// Stable video stream element that binds srcObject safely and prevents decoder flickering on re-renders
const VideoFeed = ({ stream, style, isMirrored = false, isMuted = false, className = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.muted = isMuted;
      el.volume = isMuted ? 0 : 1.0;
      el.play().catch(() => {});
    }
  }, [stream, isMuted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={className}
      style={{
        ...style,
        transform: isMirrored ? 'scaleX(-1)' : 'none'
      }}
    />
  );
};

export const ConsultationRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();

  const [consultation, setConsultation] = useState(null);
  const [loadingConsultation, setLoadingConsultation] = useState(true);

  // Language State - Patient default Tamil / Hindi / preferred; Doctor default English / preferred
  const [patientLang, setPatientLang] = useState('Tamil');
  const [doctorLang, setDoctorLang] = useState('English');

  // Modals
  const [interpreterModalOpen, setInterpreterModalOpen] = useState(false);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);

  // In-call text messages
  const [messages, setMessages] = useState([]);
  const [mobileTab, setMobileTab] = useState('video'); // 'video' | 'chat'

  // Audio Playback State
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true); // Text-to-speech for translations enabled by default

  // Live Subtitles & Speech Translation State
  const [liveSubtitlesEnabled, setLiveSubtitlesEnabled] = useState(true);
  const [isSpeechRecognitionActive, setIsSpeechRecognitionActive] = useState(false);
  const [speakerMode, setSpeakerMode] = useState('auto'); // 'auto' | 'doctor' | 'patient'
  const shouldListenRef = useRef(true);
  const isCurrentlyListeningRef = useRef(false);
  const isTtsPlayingRef = useRef(false);
  const lastRemoteSpeechTimeRef = useRef(0);
  const [currentSubtitle, setCurrentSubtitle] = useState(null); // { speaker, original, translated, isInterim }
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const speechDebounceTimerRef = useRef(null);
  const lastSpokenTextRef = useRef('');
  const lastSpokenTimeRef = useRef(0);
  const pendingSpeechTextRef = useRef('');

  // WebRTC Hook
  const {
    localStream,
    remoteStreams,
    permissionError,
    isAudioMuted,
    isVideoMuted,
    connectionState,
    isVirtualStream,
    hasRealMic,
    cameraBusy,
    enableMicrophone,
    enableCamera,
    toggleAudio,
    toggleVideo,
    startMedia,
    startVirtualMedia,
    leaveCall
  } = useWebRTC(roomId, user, socket);

  // Video and Audio element refs
  const localVideoRef = useRef(null);
  const remoteAudioElementsRef = useRef({});

  // Fetch consultation session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.consultations.getByRoom(roomId);
        if (res.success && res.data) {
          setConsultation(res.data);
          let pL = res.data.patientLanguage || (user.role === 'patient' ? (user.preferredLanguage || 'Tamil') : 'Tamil');
          let dL = res.data.doctorLanguage || 'English';
          if (pL.toLowerCase() === dL.toLowerCase()) {
            pL = 'Tamil';
            dL = 'English';
          }
          setPatientLang(pL);
          setDoctorLang(dL);
        }
      } catch (err) {
        console.error('Failed to load consultation session:', err);
      } finally {
        setLoadingConsultation(false);
      }
    };
    fetchSession();
  }, [roomId, user]);

  const doctorDisplayName = consultation?.doctor?.name || (user?.role === 'doctor' ? user.name : 'Dr. Ravi');
  const patientDisplayName = consultation?.patient?.name || (user?.role === 'patient' ? user.name : 'Ayeesha');

  // Determine what language this user speaks and what language they want to hear
  const mySpeakingLang = user.role === 'patient' ? patientLang : doctorLang;
  const targetHearingLang = user.role === 'patient' ? doctorLang : patientLang;

  // Speak translated text aloud using Google TTS audio stream with SpeechSynthesis fallback
  const playTranslatedAudio = (text, lang) => {
    if (!ttsEnabled || !text) return;
    const l = (lang || 'en').toLowerCase().trim();
    const langCode = LANG_CODE_MAP[l] || 'en';

    isTtsPlayingRef.current = true;
    try {
      const audioUrl = api.translation.getTtsAudioUrl(text, langCode);
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.onended = () => {
        setTimeout(() => { isTtsPlayingRef.current = false; }, 600);
      };
      audio.onerror = () => {
        isTtsPlayingRef.current = false;
      };
      audio.play().catch((audioErr) => {
        console.warn('Google TTS audio playback fallback to SpeechSynthesis:', audioErr.message);
        if (window.speechSynthesis) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = LANG_SPEECH_MAP[l] || 'en-US';
            utterance.rate = 1.0;
            utterance.onend = () => {
              setTimeout(() => { isTtsPlayingRef.current = false; }, 600);
            };
            utterance.onerror = () => {
              isTtsPlayingRef.current = false;
            };
            window.speechSynthesis.speak(utterance);
          } catch (synthErr) {
            isTtsPlayingRef.current = false;
          }
        } else {
          isTtsPlayingRef.current = false;
        }
      });
    } catch (e) {
      isTtsPlayingRef.current = false;
    }
  };

  // Listen for socket messages, live speech transcripts, language changes, and interpreter joins
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.text) {
        setCurrentSubtitle({
          speaker: `${msg.senderName} (${msg.senderRole === 'doctor' ? 'Doctor' : 'Patient'})`,
          original: msg.text,
          translated: msg.translatedText || msg.text,
          isInterim: false
        });
        if (msg.translatedText && msg.senderRole !== user.role) {
          lastRemoteSpeechTimeRef.current = Date.now();
          const hearingLang = user.role === 'patient' ? patientLang : doctorLang;
          playTranslatedAudio(msg.translatedText, hearingLang);
        }
        setTimeout(() => setCurrentSubtitle(null), 8000);
      }
    };

    const handleLiveTranscript = (data) => {
      // Received speech transcript from other participant
      lastRemoteSpeechTimeRef.current = Date.now();
      setCurrentSubtitle({
        speaker: `${data.speakerName} (${data.speakerRole === 'doctor' ? 'Doctor' : 'Patient'})`,
        original: data.originalText,
        translated: data.translatedText || data.originalText,
        isInterim: false
      });

      // Add to messages log
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: data.speakerName,
          senderRole: data.speakerRole,
          text: data.originalText,
          translatedText: data.translatedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (data.translatedText && data.speakerRole !== user.role) {
        const hearingLang = data.targetLang || (user.role === 'patient' ? patientLang : doctorLang);
        playTranslatedAudio(data.translatedText, hearingLang);
      }

      setTimeout(() => setCurrentSubtitle(null), 8000);
    };

    const handleLanguageUpdate = ({ pLang, dLang }) => {
      if (pLang) setPatientLang(pLang);
      if (dLang) setDoctorLang(dLang);
      showToast(`Consultation languages updated: Patient (${pLang}) ⇄ Doctor (${dLang})`, 'info');
    };

    const handleInterpreterNotification = ({ interpreter }) => {
      showToast(`Interpreter ${interpreter.name} has joined the consultation!`, 'success');
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('speech_transcript', handleLiveTranscript);
    socket.on('language_update', handleLanguageUpdate);
    socket.on('interpreter_joined_notification', handleInterpreterNotification);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('speech_transcript', handleLiveTranscript);
      socket.off('language_update', handleLanguageUpdate);
      socket.off('interpreter_joined_notification', handleInterpreterNotification);
    };
  }, [socket, ttsEnabled, targetHearingLang, user]);

  // Language change handlers
  const handlePatientLangChange = (newLang) => {
    setPatientLang(newLang);
    if (socket) {
      socket.emit('update_languages', { roomId, pLang: newLang, dLang: doctorLang });
    }
  };

  const handleDoctorLangChange = (newLang) => {
    setDoctorLang(newLang);
    if (socket) {
      socket.emit('update_languages', { roomId, pLang: patientLang, dLang: newLang });
    }
  };

  const handleSwapLanguages = () => {
    const tempP = patientLang;
    const tempD = doctorLang;
    setPatientLang(tempD);
    setDoctorLang(tempP);
    if (socket) {
      socket.emit('update_languages', { roomId, pLang: tempD, dLang: tempP });
    }
    showToast(`Languages swapped: Patient (${tempD}) ⇄ Doctor (${tempP})`, 'info');
  };

  // Intelligently resolve speaker role, name, and translation direction
  const resolveSpeakerAndLanguages = (spokenText) => {
    const clean = (spokenText || '').trim();

    // 1. Explicit user override from the speaker toggle buttons
    if (speakerMode === 'doctor') {
      return {
        speakerName: doctorDisplayName,
        speakerRole: 'doctor',
        sourceLang: 'English',
        targetLang: 'Tamil'
      };
    }
    if (speakerMode === 'patient') {
      return {
        speakerName: patientDisplayName,
        speakerRole: 'patient',
        sourceLang: 'Tamil',
        targetLang: 'English'
      };
    }

    // 2. In Auto Mode:
    // Check phonetic English in Tamil letters (when doctor speaks English into ta-IN recognizer)
    const PHONETIC_DOCTOR_PATTERNS = [
      /ஆர்[.\s]*யூ/i,
      /ஹவ்[.\s]*ஆர்/i,
      /ஹவ்[.\s]*கேன்/i,
      /வேர்[.\s]*டஸ்/i,
      /வாட்[.\s]*இஸ்/i,
      /டூ[.\s]*யூ/i,
      /டேக்[.\s]*திஸ்/i,
      /டேக்[.\s]*ரெஸ்ட்/i,
      /டோன்ட்/i,
      /ஓபன்[.\s]*யுவர்/i,
      /யூ[.\s]*வில்/i,
      /தேங்க்[.\s]*யூ/i,
      /ஹலோ[.\s]*டாக்டர்/i
    ];
    if (PHONETIC_DOCTOR_PATTERNS.some((p) => p.test(clean))) {
      return {
        speakerName: doctorDisplayName,
        speakerRole: 'doctor',
        sourceLang: 'English',
        targetLang: 'Tamil'
      };
    }

    const hasEnglishLetters = /[a-zA-Z]/.test(clean);
    const hasTamilCharacters = /[\u0B80-\u0BFF]/.test(clean);

    // Common Tanglish patient words
    const TANGLISH_PATTERNS = [
      /\bvanakkam\b/i,
      /\bkaichal\b/i,
      /\bthalavali\b/i,
      /\bmarundhu\b/i,
      /\bmarunthu\b/i,
      /\bnalla\b/i,
      /\bseri\b/i,
      /\bnandri\b/i,
      /\bepdi\b/i,
      /\beppadi\b/i,
      /\bvayiru\b/i,
      /\budambu\b/i
    ];
    const isTanglish = TANGLISH_PATTERNS.some((p) => p.test(clean));

    // If English letters are present and no Tamil characters -> Doctor Ravi!
    if (hasEnglishLetters && !hasTamilCharacters) {
      return {
        speakerName: doctorDisplayName,
        speakerRole: 'doctor',
        sourceLang: 'English',
        targetLang: 'Tamil'
      };
    }

    // If Tamil characters or Tanglish -> Patient Ayeesha!
    if (hasTamilCharacters || isTanglish) {
      return {
        speakerName: patientDisplayName,
        speakerRole: 'patient',
        sourceLang: 'Tamil',
        targetLang: 'English'
      };
    }

    // Otherwise check the active Speaking dropdown in top bar
    const activeSpeaking = (user?.role === 'patient' ? patientLang : doctorLang) || 'Tamil';
    if (activeSpeaking.toLowerCase() === 'english') {
      return {
        speakerName: doctorDisplayName,
        speakerRole: 'doctor',
        sourceLang: 'English',
        targetLang: 'Tamil'
      };
    }

    return {
      speakerName: patientDisplayName,
      speakerRole: 'patient',
      sourceLang: 'Tamil',
      targetLang: 'English'
    };
  };

  // Execute Translation and Broadcast
  const executeTranslateAndBroadcast = async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;
    const cleanSpoken = spokenText.trim();

    // Prevent duplicate broadcasts within 1.2 seconds
    if (lastSpokenTextRef.current === cleanSpoken && (Date.now() - lastSpokenTimeRef.current < 1200)) {
      return;
    }
    lastSpokenTextRef.current = cleanSpoken;
    lastSpokenTimeRef.current = Date.now();

    try {
      const resolved = resolveSpeakerAndLanguages(cleanSpoken);

      const transRes = await api.translation.translate(cleanSpoken, resolved.sourceLang, resolved.targetLang);
      const translatedText = (transRes.success && transRes.translatedText) ? transRes.translatedText : cleanSpoken;

      // When Doctor speaks: if speech was phonetically recognized in Tamil letters, restore the clean English sentence!
      const originalDisplay = (resolved.speakerRole === 'doctor' && transRes.originalText)
        ? transRes.originalText
        : cleanSpoken;

      // Broadcast live transcript over Socket.IO to other participant
      if (socket) {
        socket.emit('speech_transcript', {
          roomId,
          transcriptData: {
            speakerName: resolved.speakerName,
            speakerRole: resolved.speakerRole,
            originalText: originalDisplay,
            translatedText: translatedText,
            sourceLang: resolved.sourceLang,
            targetLang: resolved.targetLang
          }
        });
      }

      // Display on local screen
      setCurrentSubtitle({
        speaker: `${resolved.speakerName} (${resolved.speakerRole === 'doctor' ? 'Doctor' : 'Patient'})`,
        original: originalDisplay,
        translated: translatedText,
        isInterim: false
      });

      // Append to messages list
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderName: resolved.speakerName,
          senderRole: resolved.speakerRole,
          text: originalDisplay,
          translatedText: translatedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // If text-to-speech is enabled and this was the other role speaking, read translated text aloud
      if (ttsEnabled && resolved.speakerRole !== user.role && translatedText) {
        const hearingLang = user.role === 'patient' ? patientLang : doctorLang;
        playTranslatedAudio(translatedText, hearingLang);
      }

      setTimeout(() => setCurrentSubtitle(null), 8000);
    } catch (err) {
      console.error('Translation execution error:', err);
    }
  };

  // Safely stop recognition instance without triggering recursive events
  const stopRecognitionInstance = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (speechDebounceTimerRef.current) {
      clearTimeout(speechDebounceTimerRef.current);
      speechDebounceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    isCurrentlyListeningRef.current = false;
  };

  // Continuous Speech Recognition Engine with single-utterance isolation (never combining prior sentences)
  const startContinuousSpeechLoop = () => {
    if (!shouldListenRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isCurrentlyListeningRef.current) return;

    try {
      stopRecognitionInstance();

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let langCode = 'en-US';
      if (speakerMode === 'doctor') {
        langCode = 'en-US';
      } else if (speakerMode === 'patient') {
        langCode = 'ta-IN';
      } else {
        const activeSpeaking = (user?.role === 'patient' ? patientLang : doctorLang) || (user?.role === 'doctor' ? 'English' : 'Tamil');
        langCode = activeSpeaking.toLowerCase() === 'english' ? 'en-US' : 'ta-IN';
      }
      rec.lang = langCode;

      rec.onstart = () => {
        isCurrentlyListeningRef.current = true;
        setIsSpeechRecognitionActive(true);
      };

      rec.onresult = (event) => {
        let currentUtterance = '';

        // Read ONLY from event.resultIndex onwards to NEVER combine with prior finalized sentences!
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0]?.transcript || '';
          currentUtterance += chunk + ' ';
        }

        const cleanCurrent = currentUtterance.trim();
        if (!cleanCurrent) return;

        pendingSpeechTextRef.current = cleanCurrent;

        // Visual feedback immediately shows current active phrase
        const interimResolved = resolveSpeakerAndLanguages(cleanCurrent);
        setCurrentSubtitle({
          speaker: `${interimResolved.speakerName} (${interimResolved.speakerRole === 'doctor' ? 'Doctor' : 'Patient'})`,
          original: cleanCurrent,
          translated: 'Translating in real-time...',
          isInterim: true
        });

        // Debounce: wait for speaker to pause (650ms), translate this sentence, and reset buffer for the next sentence!
        if (speechDebounceTimerRef.current) {
          clearTimeout(speechDebounceTimerRef.current);
        }
        speechDebounceTimerRef.current = setTimeout(() => {
          if (pendingSpeechTextRef.current && pendingSpeechTextRef.current.trim()) {
            const textToSend = pendingSpeechTextRef.current.trim();
            pendingSpeechTextRef.current = '';
            executeTranslateAndBroadcast(textToSend);

            // Cycle recognition instance so the next sentence starts with a completely fresh, empty buffer!
            stopRecognitionInstance();
            if (shouldListenRef.current) {
              restartTimerRef.current = setTimeout(() => {
                if (shouldListenRef.current) {
                  startContinuousSpeechLoop();
                }
              }, 120);
            }
          }
        }, 650);
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setIsSpeechRecognitionActive(false);
          isCurrentlyListeningRef.current = false;
        } else if (event.error === 'network') {
          isCurrentlyListeningRef.current = false;
        }
      };

      rec.onend = () => {
        isCurrentlyListeningRef.current = false;
        recognitionRef.current = null;

        // If recognizer ended while speech was pending in buffer, flush and translate immediately!
        if (pendingSpeechTextRef.current && pendingSpeechTextRef.current.trim()) {
          const textToFlush = pendingSpeechTextRef.current.trim();
          pendingSpeechTextRef.current = '';
          if (speechDebounceTimerRef.current) {
            clearTimeout(speechDebounceTimerRef.current);
            speechDebounceTimerRef.current = null;
          }
          executeTranslateAndBroadcast(textToFlush);
        }

        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              startContinuousSpeechLoop();
            }
          }, 150);
        } else {
          setIsSpeechRecognitionActive(false);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Speech recognition loop start error:', err);
      isCurrentlyListeningRef.current = false;
      if (shouldListenRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (shouldListenRef.current) {
            startContinuousSpeechLoop();
          }
        }, 1000);
      }
    }
  };

  // Toggle Continuous Speech Recognition & Real-Time Translation
  const toggleSpeechRecognition = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Google Chrome or type in Language Bridge.', 'warning');
      return;
    }

    if (shouldListenRef.current) {
      shouldListenRef.current = false;
      stopRecognitionInstance();
      setIsSpeechRecognitionActive(false);
      showToast('Live speech recognition paused', 'info');
      return;
    }

    if (!hasRealMic && navigator.mediaDevices?.getUserMedia) {
      try {
        await enableMicrophone();
      } catch (e) {}
    }

    shouldListenRef.current = true;
    setIsSpeechRecognitionActive(true);
    showToast(`🎤 Mic listening in ${mySpeakingLang}! Speak now to translate to ${targetHearingLang}`, 'success');
    startContinuousSpeechLoop();
  };

  // Restart speech recognition with new language whenever language selection updates
  useEffect(() => {
    if (shouldListenRef.current) {
      stopRecognitionInstance();
      restartTimerRef.current = setTimeout(() => {
        if (shouldListenRef.current) {
          startContinuousSpeechLoop();
        }
      }, 200);
    }
  }, [speakerMode, mySpeakingLang, patientLang, doctorLang]);

  // Auto-start speech recognition when consultation connects
  useEffect(() => {
    shouldListenRef.current = true;
    startContinuousSpeechLoop();

    return () => {
      shouldListenRef.current = false;
      stopRecognitionInstance();
    };
  }, []);

  // Unblock audio on user interaction
  const handleUnblockAudio = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      if (!window.__globalAudioCtx) window.__globalAudioCtx = new AudioCtx();
      if (window.__globalAudioCtx.state === 'suspended') window.__globalAudioCtx.resume();
    }
    Object.values(remoteAudioElementsRef.current).forEach((el) => {
      if (el) {
        el.muted = false;
        el.volume = 1.0;
        el.play().catch(console.error);
      }
    });
    document.querySelectorAll('video').forEach((v) => {
      if (!v.classList.contains('local-video-preview')) {
        v.muted = false;
        v.volume = 1.0;
        v.play().catch(console.error);
      }
    });
    if (window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
    setAudioBlocked(false);
    showToast('Audio playback unblocked and active', 'success');
  };

  // Mobile autoplay & speech policy unlocker: Any user touch or click unlocks audio and activates speech loop
  useEffect(() => {
    const unlockOnGesture = () => {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!window.__globalAudioCtx) window.__globalAudioCtx = new AudioCtx();
        if (window.__globalAudioCtx.state === 'suspended') window.__globalAudioCtx.resume();
      }
      Object.values(remoteAudioElementsRef.current).forEach((el) => {
        if (el) {
          el.muted = false;
          el.volume = 1.0;
          el.play().then(() => setAudioBlocked(false)).catch(() => {});
        }
      });
      document.querySelectorAll('video').forEach((v) => {
        if (!v.classList.contains('local-video-preview')) {
          v.muted = false;
          v.volume = 1.0;
          v.play().catch(() => {});
        }
      });
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        try { window.speechSynthesis.resume(); } catch (e) {}
      }
    };

    window.addEventListener('click', unlockOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockOnGesture, { passive: true });
    return () => {
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('touchstart', unlockOnGesture);
    };
  }, []);

  // Handle End Call
  const handleEndCall = async () => {
    shouldListenRef.current = false;
    stopRecognitionInstance();
    setIsSpeechRecognitionActive(false);
    leaveCall();

    if (user.role === 'doctor') {
      if (consultation?._id) {
        try {
          await api.consultations.updateStatus(consultation._id, 'completed');
        } catch (err) {
          console.error('Failed to mark completed:', err);
        }
      }
      setPrescriptionModalOpen(true);
    } else {
      showToast('You left the consultation room.', 'info');
      navigate('/dashboard');
    }
  };

  const handleSendMessage = (msg) => {
    if (socket) {
      socket.emit('send_message', { roomId, message: msg });
    }
  };

  if (loadingConsultation) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner message="Entering consultation room..." />
      </div>
    );
  }

  const remotePeerList = Object.entries(remoteStreams);

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px)',
        backgroundColor: '#0f172a',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dedicated Low-Latency WebRTC Audio Streams */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, opacity: 0.001, pointerEvents: 'none' }}>
        {remotePeerList.map(([socketId, peerData]) => (
          <audio
            key={socketId}
            ref={(el) => {
              if (el) {
                remoteAudioElementsRef.current[socketId] = el;
                if (peerData.stream && el.srcObject !== peerData.stream) {
                  el.srcObject = peerData.stream;
                }
                el.volume = 1.0;
                el.play().then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
              }
            }}
            autoPlay
            playsInline
          />
        ))}
      </div>

      {/* Main Video Call Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '16px'
        }}
      >
        {/* Top Information Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            zIndex: 10,
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: localStream ? '#10b981' : '#f59e0b'
              }}
            />
            <span style={{ color: '#f8fafc', fontSize: '0.88rem', fontWeight: 600 }}>
              MEDIBRIDGE Telemedicine
            </span>

            {/* Room Code Badge & Copy Link */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '3px 8px', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                Room: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{roomId}</strong>
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  showToast('Room link copied! Paste on phone or other browser.', 'success');
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 6px', fontSize: '0.7rem', height: '22px' }}
                title="Copy room link to clipboard"
              >
                <Copy size={11} /> Copy Link
              </button>
            </div>

            <span className={`badge ${hasRealMic ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
              {hasRealMic ? '🎤 Mic Live' : '🔇 Mic Inactive'}
            </span>
          </div>

          {/* Language Selector Controls in Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(30, 41, 59, 0.85)', border: '1px solid #334155', padding: '3px 8px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Speaking:</span>
              <select
                value={user.role === 'patient' ? patientLang : doctorLang}
                onChange={(e) => {
                  const val = e.target.value;
                  if (user.role === 'patient') handlePatientLangChange(val);
                  else handleDoctorLangChange(val);
                }}
                style={{ background: '#0f172a', color: '#38bdf8', border: '1px solid #475569', borderRadius: '4px', fontSize: '0.74rem', padding: '2px 6px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
              >
                {AVAILABLE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSwapLanguages}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}
                title="Swap Speaking and Hearing Languages"
              >
                <ArrowLeftRight size={13} color="#38bdf8" />
              </button>

              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Translate To:</span>
              <select
                value={user.role === 'patient' ? doctorLang : patientLang}
                onChange={(e) => {
                  const val = e.target.value;
                  if (user.role === 'patient') handleDoctorLangChange(val);
                  else handlePatientLangChange(val);
                }}
                style={{ background: '#0f172a', color: '#10b981', border: '1px solid #475569', borderRadius: '4px', fontSize: '0.74rem', padding: '2px 6px', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
              >
                {AVAILABLE_LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Audio Blocked Autoplay Notice */}
            {audioBlocked && (
              <button
                onClick={handleUnblockAudio}
                className="btn btn-warning btn-sm"
                style={{ padding: '4px 10px', fontSize: '0.78rem', animation: 'pulse 1.5s infinite' }}
              >
                <Volume2 size={14} /> Click to Unmute Audio
              </button>
            )}

            {/* Speaker Attribution & Language Selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(30, 41, 59, 0.85)',
                border: '1px solid #475569',
                borderRadius: '9999px',
                padding: '2px 6px'
              }}
              title="Select who is speaking to correctly assign name in chatbox and subtitles"
            >
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, paddingLeft: '4px' }}>Speaker:</span>
              <button
                type="button"
                onClick={() => {
                  setSpeakerMode('auto');
                  showToast('Speaker: Auto-Detect (Doctor English ⇄ Patient Tamil)', 'info');
                }}
                style={{
                  background: speakerMode === 'auto' ? '#0284c7' : 'transparent',
                  color: speakerMode === 'auto' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  cursor: 'pointer'
                }}
              >
                ⚡ Auto
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeakerMode('doctor');
                  if (user?.role === 'patient') {
                    setPatientLang('English');
                    setDoctorLang('Tamil');
                  }
                  showToast(`Mic set to Doctor: ${doctorDisplayName} (English → Tamil)`, 'info');
                }}
                style={{
                  background: speakerMode === 'doctor' ? '#0f766e' : 'transparent',
                  color: speakerMode === 'doctor' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  cursor: 'pointer'
                }}
              >
                🩺 {doctorDisplayName}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSpeakerMode('patient');
                  if (user?.role === 'patient') {
                    setPatientLang('Tamil');
                    setDoctorLang('English');
                  }
                  showToast(`Mic set to Patient: ${patientDisplayName} (Tamil → English)`, 'info');
                }}
                style={{
                  background: speakerMode === 'patient' ? '#0369a1' : 'transparent',
                  color: speakerMode === 'patient' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  cursor: 'pointer'
                }}
              >
                👤 {patientDisplayName}
              </button>
            </div>

            {/* Live Speech Recognition & Translation Button */}
            <button
              onClick={toggleSpeechRecognition}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid #38bdf8',
                backgroundColor: isSpeechRecognitionActive ? '#0284c7' : 'rgba(2, 132, 199, 0.15)',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Speak naturally and have your speech translated in real-time"
            >
              <Sparkles size={14} color={isSpeechRecognitionActive ? '#ffffff' : '#38bdf8'} />
              <span>{isSpeechRecognitionActive ? 'Live Translation: ACTIVE' : 'Start Live Translation'}</span>
            </button>

            {/* Voice Readout TTS Toggle */}
            <button
              onClick={() => {
                const nextVal = !ttsEnabled;
                setTtsEnabled(nextVal);
                showToast(`Voice translation readout ${nextVal ? 'enabled' : 'disabled'}`, 'info');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '9999px',
                border: '1px solid #475569',
                backgroundColor: ttsEnabled ? '#0f766e' : 'transparent',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
              title="Toggle reading translated speech aloud"
            >
              <Volume2 size={13} color={ttsEnabled ? '#34d399' : '#94a3b8'} />
              <span>Voice: {ttsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Subtitles Overlay Toggle */}
            <button
              onClick={() => setLiveSubtitlesEnabled(!liveSubtitlesEnabled)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                borderRadius: '9999px',
                border: '1px solid #475569',
                backgroundColor: liveSubtitlesEnabled ? '#1e293b' : 'transparent',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              <Subtitles size={13} color={liveSubtitlesEnabled ? '#38bdf8' : '#94a3b8'} />
              <span>Subtitles: {liveSubtitlesEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Video Feeds Display Stage */}
        <div
          onClick={audioBlocked ? handleUnblockAudio : undefined}
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#020617',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: audioBlocked ? 'pointer' : 'default'
          }}
        >
          {/* Floating Live Translation Status Badge */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleSpeechRecognition();
            }}
            style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: isSpeechRecognitionActive ? 'rgba(2, 132, 199, 0.9)' : 'rgba(30, 41, 59, 0.9)',
              border: isSpeechRecognitionActive ? '1px solid #38bdf8' : '1px solid #475569',
              borderRadius: '9999px',
              padding: '5px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 30,
              backdropFilter: 'blur(8px)',
              cursor: 'pointer',
              boxShadow: isSpeechRecognitionActive ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none'
            }}
            title="Click to toggle Live Speech Translation"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isSpeechRecognitionActive ? '#10b981' : '#f59e0b',
                boxShadow: isSpeechRecognitionActive ? '0 0 8px #10b981' : 'none'
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 700 }}>
              {isSpeechRecognitionActive
                ? `🟢 Live Translation: ${speakerMode === 'doctor' ? `🩺 ${doctorDisplayName} (Doctor)` : speakerMode === 'patient' ? `👤 ${patientDisplayName} (Patient)` : '⚡ Auto (Doctor ⇄ Patient)'} • ${mySpeakingLang} ⇄ ${targetHearingLang}`
                : `⏸️ Tap to Activate Live Translation (${speakerMode === 'doctor' ? doctorDisplayName : speakerMode === 'patient' ? patientDisplayName : 'Auto-Detect'})`}
            </span>
          </div>
          {/* Prominent Audio Unblock Banner for Mobile & Autoplay Policy */}
          {audioBlocked && (
            <button
              type="button"
              onClick={handleUnblockAudio}
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer',
                zIndex: 35,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <Volume2 size={20} />
              <span>🔊 Tap to Hear Doctor / Patient (Unmute Audio)</span>
            </button>
          )}

          {remotePeerList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', maxWidth: '520px', margin: '0 auto' }}>
              <LoadingSpinner message="Waiting for other participant to connect..." />
              <div
                style={{
                  marginTop: '18px',
                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '18px 24px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active Room Code:</span>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem' }}>
                    {roomId}
                  </span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: '0 0 14px', lineHeight: 1.45 }}>
                  Both the doctor and patient must enter this exact room code. You can copy the link below and open it on your mobile phone or in an Incognito/Private browser tab:
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('Direct consultation link copied! Open on phone or another tab.', 'success');
                  }}
                  className="btn btn-primary btn-sm btn-block"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Copy size={15} /> Copy Consultation Link
                </button>
              </div>
            </div>
          ) : remotePeerList.length === 1 ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {/* Remote Video is unmuted so WebRTC audio plays directly to phone/laptop speakers */}
              <VideoFeed
                stream={remotePeerList[0][1]?.stream}
                isMuted={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Volume2 size={14} color="#10b981" />
                <span>{remotePeerList[0][1]?.user?.name || 'Remote Participant'} ({remotePeerList[0][1]?.user?.role || 'User'})</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                padding: '8px'
              }}
            >
              {remotePeerList.map(([socketId, peerData]) => (
                <div key={socketId} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '10px', overflow: 'hidden' }}>
                  <VideoFeed
                    stream={peerData.stream}
                    isMuted={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    {peerData.user?.name} ({peerData.user?.role})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Real-Time Live Subtitles & Translation Overlay */}
          {liveSubtitlesEnabled && currentSubtitle && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '85%',
                backgroundColor: 'rgba(15, 23, 42, 0.94)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '12px',
                padding: '12px 24px',
                color: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 25
              }}
            >
              <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600, marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#38bdf8" />
                <span>{currentSubtitle.speaker}</span>
                {currentSubtitle.isInterim && (
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                    Listening...
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.98rem', color: '#e2e8f0', marginBottom: currentSubtitle.translated ? '4px' : '0' }}>
                "{currentSubtitle.original}"
              </div>
              {currentSubtitle.translated && (
                <div style={{ fontSize: '1.08rem', color: '#38bdf8', fontWeight: 700 }}>
                  ⇄ {currentSubtitle.translated}
                </div>
              )}
            </div>
          )}

          {/* Local User Preview */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '24px',
              width: '180px',
              height: '120px',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
              zIndex: 20
            }}
          >
            <VideoFeed
              stream={localStream}
              isMirrored={!isVirtualStream}
              isMuted={true}
              className="local-video-preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {isVideoMuted && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8'
                }}
              >
                <VideoOff size={24} />
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                left: '6px',
                fontSize: '0.7rem',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>You</span>
              {isAudioMuted ? <MicOff size={10} color="#ef4444" /> : <Mic size={10} color="#10b981" />}
            </div>
          </div>

          {/* Switch to Hardware Webcam Button */}
          {isVirtualStream && (
            <button
              type="button"
              onClick={enableCamera}
              style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.78rem',
                border: '1px solid #38bdf8',
                cursor: 'pointer',
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              title="Click to turn on physical webcam"
            >
              <RefreshCw size={13} />
              <span>{cameraBusy ? 'Camera in use: Tap to Switch to Hardware Webcam' : 'Turn on Hardware Webcam'}</span>
            </button>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
          <VideoControls
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onEndCall={handleEndCall}
            onRequestInterpreter={() => setInterpreterModalOpen(true)}
            showInterpreterBtn={user.role !== 'interpreter'}
            isSpeechRecognitionActive={isSpeechRecognitionActive}
            onToggleSpeechRecognition={toggleSpeechRecognition}
            audioBlocked={audioBlocked}
            onUnblockAudio={handleUnblockAudio}
          />
        </div>
      </div>

      {/* Language Bridge Side Panel */}
      <div className={`bridge-panel-wrap ${mobileTab === 'chat' ? 'mobile-active' : ''}`}>
        <LanguageBridge
          patientLanguage={patientLang}
          doctorLanguage={doctorLang}
          onPatientLangChange={handlePatientLangChange}
          onDoctorLangChange={handleDoctorLangChange}
          onSwapLanguages={handleSwapLanguages}
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={user}
          consultation={consultation}
        />
      </div>

      {/* Mobile Floating Tab Switcher */}
      <div className="mobile-tab-bar">
        <button
          onClick={() => setMobileTab('video')}
          className={`mobile-tab-btn ${mobileTab === 'video' ? 'active' : ''}`}
        >
          Video Call
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
        >
          🌐 Translation & Notes {messages.length > 0 ? `(${messages.length})` : ''}
        </button>
      </div>

      {/* Interpreter Request Modal */}
      <InterpreterRequestModal
        isOpen={interpreterModalOpen}
        onClose={() => setInterpreterModalOpen(false)}
        roomId={roomId}
        initialPatientLang={patientLang}
        initialDoctorLang={doctorLang}
        onRequestSent={(requestData) => {
          if (socket) {
            socket.emit('dispatch_interpreter_request', requestData);
          }
        }}
      />

      {/* Post-Consultation Prescription Modal */}
      {user.role === 'doctor' && (
        <PrescriptionModal
          isOpen={prescriptionModalOpen}
          onClose={() => {
            setPrescriptionModalOpen(false);
            navigate('/doctor/dashboard');
          }}
          patientId={consultation?.patient?._id}
          patientName={consultation?.patient?.name}
          consultationId={consultation?._id}
          appointmentId={consultation?.appointment}
          onSuccess={() => {
            setPrescriptionModalOpen(false);
            navigate('/doctor/dashboard');
          }}
        />
      )}

      <style>{`
        .bridge-panel-wrap {
          width: 380px;
          height: 100%;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
        }
        .mobile-tab-bar {
          display: none;
        }
        @media (max-width: 860px) {
          .mobile-tab-bar {
            display: flex;
            position: fixed;
            top: 10px;
            right: 12px;
            z-index: 100;
            background: rgba(15, 23, 42, 0.9);
            padding: 4px;
            border-radius: 9999px;
            border: 1px solid #334155;
            backdrop-filter: blur(8px);
            gap: 4px;
          }
          .mobile-tab-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
          }
          .mobile-tab-btn.active {
            background: #0284c7;
            color: #ffffff;
          }
          .bridge-panel-wrap {
            display: none;
            position: absolute;
            inset: 0;
            width: 100% !important;
            height: 100% !important;
            z-index: 50;
            background: #ffffff;
          }
          .bridge-panel-wrap.mobile-active {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
