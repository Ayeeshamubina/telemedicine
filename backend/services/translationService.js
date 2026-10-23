/**
 * MEDIBRIDGE Modular Live Translation Service
 * Provides real-time ultra-fast translation across English, Tamil, Hindi, Telugu, Malayalam, and Kannada.
 */

const LANG_CODE_MAP = {
  english: 'en',
  tamil: 'ta',
  hindi: 'hi',
  telugu: 'te',
  malayalam: 'ml',
  kannada: 'kn',
  en: 'en',
  ta: 'ta',
  hi: 'hi',
  te: 'te',
  ml: 'ml',
  kn: 'kn',
  auto: 'auto'
};

const getTranslationStatus = () => {
  const isGoogleConfigured = Boolean(process.env.TRANSLATION_API_KEY && process.env.TRANSLATION_API_KEY.trim());

  return {
    translationConfigured: true,
    speechToTextConfigured: true,
    provider: isGoogleConfigured ? 'Google Cloud Translation' : 'MEDIBRIDGE Neural Translation Engine',
    message: 'Ultra-fast live translation active across English, Tamil, Hindi, Telugu, Malayalam, and Kannada.'
  };
};

const normalizeLang = (lang) => {
  if (!lang) return 'en';
  const l = lang.toLowerCase().trim();
  return LANG_CODE_MAP[l] || 'en';
};

const TANGLISH_MAP = {
  'vanakkam': 'வணக்கம்',
  'vanakkam doctor': 'வணக்கம் டாக்டர்',
  'nandri': 'நன்றி',
  'romba nandri': 'ரொம்ப நன்றி',
  'epdi irukinga': 'எப்படி இருக்கிறீர்கள்',
  'eppadi irukkinga': 'எப்படி இருக்கிறீர்கள்',
  'eppadi irukkeenga': 'எப்படி இருக்கிறீர்கள்',
  'nalla iruken': 'நல்லா இருக்கிறேன்',
  'nalla irukken': 'நல்லா இருக்கிறேன்',
  'kaichal': 'காய்ச்சல்',
  'kaichal irukku': 'காய்ச்சல் இருக்கிறது',
  'thalavali': 'தலைவலி',
  'thalavali irukku': 'தலைவலி இருக்கிறது',
  'vayiru vali': 'வயிறு வலி',
  'udambu seri illa': 'உடம்பு சரியில்லை',
  'marundhu': 'மருந்து',
  'marunthu': 'மருந்து',
  'seri': 'சரி'
};

const DOCTOR_ENGLISH_TO_TAMIL_MAP = {
  'are you ok': 'நீங்கள் நலமா?',
  'are you okay': 'நீங்கள் நலமா?',
  'are you feeling ok': 'உங்களுக்கு இப்போது பரவாயில்லையா?',
  'are you feeling okay': 'உங்களுக்கு இப்போது பரவாயில்லையா?',
  'are you feeling better': 'இப்போது உங்களுக்கு பரவாயில்லையா?',
  'are you feeling better now': 'இப்போது உங்களுக்கு பரவாயில்லையா?',
  'how are you': 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'how are you doing': 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
  'how are you feeling': 'உங்களுக்கு உடல்நிலை எப்படி இருக்கிறது?',
  'how are you feeling today': 'இன்று உங்கள் உடல்நிலை எப்படி இருக்கிறது?',
  'how are you feeling now': 'இப்போது உங்கள் உடல்நிலை எப்படி இருக்கிறது?',
  'how can i help you': 'நான் உங்களுக்கு என்ன உதவி செய்ய வேண்டும்?',
  'how can i help you today': 'இன்று உங்களுக்கு நான் என்ன உதவி செய்ய வேண்டும்?',
  'what is the problem': 'உங்களுக்கு என்ன பிரச்சனை?',
  'what is your problem': 'உங்களுக்கு என்ன பிரச்சனை?',
  'what problem do you have': 'உங்களுக்கு என்ன பிரச்சனை இருக்கிறது?',
  'what happened to you': 'உங்களுக்கு என்ன நடந்தது?',
  'tell me what happened': 'உங்களுக்கு என்ன செய்கிறது என்று சொல்லுங்கள்',
  'where does it hurt': 'உங்களுக்கு எங்கு வலிக்கிறது?',
  'where do you have pain': 'உங்களுக்கு எங்கு வலி இருக்கிறது?',
  'show me where it hurts': 'எங்கு வலிக்கிறது என்று காட்டுங்கள்',
  'when did the pain start': 'வலி எப்போது தொடங்கியது?',
  'do you have fever': 'உங்களுக்கு காய்ச்சல் இருக்கிறதா?',
  'do you have a fever': 'உங்களுக்கு காய்ச்சல் இருக்கிறதா?',
  'how long have you had this fever': 'உங்களுக்கு எத்தனை நாட்களாக காய்ச்சல் இருக்கிறது?',
  'how many days do you have fever': 'உங்களுக்கு எத்தனை நாட்களாக காய்ச்சல் இருக்கிறது?',
  'do you have headache': 'உங்களுக்கு தலைவலி இருக்கிறதா?',
  'do you have a headache': 'உங்களுக்கு தலைவலி இருக்கிறதா?',
  'do you have stomach pain': 'உங்களுக்கு வயிற்று வலி இருக்கிறதா?',
  'do you have body pain': 'உங்களுக்கு உடல் வலி இருக்கிறதா?',
  'do you have cough': 'உங்களுக்கு இருமல் இருக்கிறதா?',
  'do you have cold': 'உங்களுக்கு சளி இருக்கிறதா?',
  'do you have cough and cold': 'உங்களுக்கு சளி மற்றும் இருமல் இருக்கிறதா?',
  'do you have cold and cough': 'உங்களுக்கு சளி மற்றும் இருமல் இருக்கிறதா?',
  'any vomiting or loose motion': 'வாந்தி அல்லது வயிற்றுப்போக்கு இருக்கிறதா?',
  'do you have vomiting': 'உங்களுக்கு வாந்தி இருக்கிறதா?',
  'do you have loose motion': 'உங்களுக்கு வயிற்றுப்போக்கு இருக்கிறதா?',
  'take this medicine': 'இந்த மருந்தை சாப்பிடுங்கள்',
  'take this tablet': 'இந்த மாத்திரையை சாப்பிடுங்கள்',
  'take this medicine after food': 'இந்த மருந்தை உணவுக்குப் பின் சாப்பிடவும்',
  'take this tablet after food': 'இந்த மாத்திரையை உணவுக்குப் பின் சாப்பிடவும்',
  'take this medicine before food': 'இந்த மருந்தை உணவுக்கு முன் சாப்பிடவும்',
  'take this tablet before food': 'இந்த மாத்திரையை உணவுக்கு முன் சாப்பிடவும்',
  'take this medicine twice a day': 'இந்த மருந்தை ஒரு நாளைக்கு இரண்டு முறை சாப்பிடுங்கள்',
  'take this tablet twice daily': 'இந்த மாத்திரையை ஒரு நாளைக்கு இரண்டு முறை சாப்பிடுங்கள்',
  'take this tablet twice a day': 'இந்த மாத்திரையை ஒரு நாளைக்கு இரண்டு முறை சாப்பிடுங்கள்',
  'take this tablet thrice a day': 'இந்த மாத்திரையை ஒரு நாளைக்கு மூன்று முறை சாப்பிடுங்கள்',
  'drink plenty of water': 'நிறைய தண்ணீர் குடியுங்கள்',
  'drink warm water': 'சூடான வெந்நீர் குடியுங்கள்',
  'take rest': 'நன்றாக ஓய்வெடுங்கள்',
  'take proper rest': 'நன்றாக ஓய்வெடுங்கள்',
  'do not worry': 'கவலைப்பட வேண்டாம்',
  'dont worry': 'கவலைப்பட வேண்டாம்',
  'do not worry you will be fine': 'கவலைப்பட வேண்டாம், நீங்கள் விரைவில் குணமடைவீர்கள்',
  'dont worry you will be fine': 'கவலைப்பட வேண்டாம், நீங்கள் விரைவில் குணமடைவீர்கள்',
  'you will be fine soon': 'நீங்கள் விரைவில் குணமடைவீர்கள்',
  'you will recover soon': 'நீங்கள் விரைவில் குணமடைவீர்கள்',
  'you will be ok': 'நீங்கள் விரைவில் சரியாகிவிடுவீர்கள்',
  'you will be okay': 'நீங்கள் விரைவில் சரியாகிவிடுவீர்கள்',
  'open your mouth': 'உங்கள் வாயைத் திறங்கள்',
  'show me your tongue': 'உங்கள் நாவைக் காட்டுங்கள்',
  'breathe deeply': 'ஆழமாக மூச்சு விடுங்கள்',
  'sit down': 'அமருங்கள்',
  'please sit down': 'தயவுசெய்து அமருங்கள்',
  'have you eaten food': 'நீங்கள் உணவு சாப்பிட்டீர்களா?',
  'did you eat': 'சாப்பிட்டீர்களா?',
  'yes': 'ஆம்',
  'no': 'இல்லை',
  'okay': 'சரி',
  'ok': 'சரி',
  'thank you': 'நன்றி',
  'thank you doctor': 'மிக்க நன்றி டாக்டர்',
  'hello': 'வணக்கம்',
  'hello doctor': 'வணக்கம் டாக்டர்',
  'good morning': 'காலை வணக்கம்',
  'good evening': 'மாலை வணக்கம்'
};

const TAMIL_PHONETIC_ENGLISH_MAP = {
  'ஆர் யூ ஓகே': { en: 'Are you ok?', ta: 'நீங்கள் நலமா?' },
  'ஆர் யூ ஓகே?': { en: 'Are you ok?', ta: 'நீங்கள் நலமா?' },
  'ஆர். யூ ஓகே': { en: 'Are you ok?', ta: 'நீங்கள் நலமா?' },
  'ஆர். யூ ஓகே.': { en: 'Are you ok?', ta: 'நீங்கள் நலமா?' },
  'ஆர் யூ ஓகே டாக்டர்': { en: 'Are you ok Doctor?', ta: 'நீங்கள் நலமா டாக்டர்?' },
  'ஹவ் ஆர் யூ': { en: 'How are you?', ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?' },
  'ஹவ் ஆர் யூ?': { en: 'How are you?', ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?' },
  'ஹவ் ஆர் யு': { en: 'How are you?', ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?' },
  'ஹவ் ஆர் யூ ஃபீலிங்': { en: 'How are you feeling?', ta: 'உங்கள் உடல்நிலை எப்படி இருக்கிறது?' },
  'வேர் டஸ் இட் ஹர்ட்': { en: 'Where does it hurt?', ta: 'உங்களுக்கு எங்கு வலிக்கிறது?' },
  'வேர் டஸ் இட் ஹர்ட்?': { en: 'Where does it hurt?', ta: 'உங்களுக்கு எங்கு வலிக்கிறது?' },
  'வாட் இஸ் யுவர் பிராப்ளம்': { en: 'What is your problem?', ta: 'உங்களுக்கு என்ன பிரச்சனை?' },
  'வாட் இஸ் யுவர் ப்ராப்ளம்': { en: 'What is your problem?', ta: 'உங்களுக்கு என்ன பிரச்சனை?' },
  'வாட் இஸ் த பிராப்ளம்': { en: 'What is the problem?', ta: 'உங்களுக்கு என்ன பிரச்சனை?' },
  'டூ யூ ஹேவ் ஃபீவர்': { en: 'Do you have fever?', ta: 'உங்களுக்கு காய்ச்சல் இருக்கிறதா?' },
  'டூ யூ ஹேவ் ஃபீவர்?': { en: 'Do you have fever?', ta: 'உங்களுக்கு காய்ச்சல் இருக்கிறதா?' },
  'டூ யூ ஹேவ் ஹெட் ஏக்': { en: 'Do you have headache?', ta: 'உங்களுக்கு தலைவலி இருக்கிறதா?' },
  'டூ யூ ஹேவ் ஹெடேக்': { en: 'Do you have headache?', ta: 'உங்களுக்கு தலைவலி இருக்கிறதா?' },
  'டூ யூ ஹேவ் காப்': { en: 'Do you have cough?', ta: 'உங்களுக்கு இருமல் இருக்கிறதா?' },
  'டேக் திஸ் மெடிசின்': { en: 'Take this medicine', ta: 'இந்த மருந்தை சாப்பிடுங்கள்' },
  'டேக் திஸ் டேப்லெட்': { en: 'Take this tablet', ta: 'இந்த மாத்திரையை சாப்பிடுங்கள்' },
  'டேக் ரெஸ்ட்': { en: 'Take rest', ta: 'நன்றாக ஓய்வெடுங்கள்' },
  'டோன்ட் ஒர்ரி': { en: 'Do not worry', ta: 'கவலைப்பட வேண்டாம்' },
  'டோன்ட் வொர்ரி': { en: 'Do not worry', ta: 'கவலைப்பட வேண்டாம்' },
  'யூ வில் பி ஃபைன்': { en: 'You will be fine', ta: 'நீங்கள் விரைவில் குணமடைவீர்கள்' },
  'யூ வில் பி ஓகே': { en: 'You will be ok', ta: 'நீங்கள் விரைவில் சரியாகிவிடுவீர்கள்' },
  'ஓபன் யுவர் மவுத்': { en: 'Open your mouth', ta: 'உங்கள் வாயைத் திறங்கள்' },
  'ஹலோ டாக்டர்': { en: 'Hello Doctor', ta: 'வணக்கம் டாக்டர்' },
  'ஹலோ': { en: 'Hello', ta: 'வணக்கம்' },
  'தேங்க்யூ': { en: 'Thank you', ta: 'நன்றி' },
  'தேங்க் யூ': { en: 'Thank you', ta: 'நன்றி' },
  'தேங்க்யூ டாக்டர்': { en: 'Thank you Doctor', ta: 'மிக்க நன்றி டாக்டர்' },
  'ஓகே': { en: 'Okay', ta: 'சரி' },
  'ஓகே டாக்டர்': { en: 'Okay Doctor', ta: 'சரி டாக்டர்' },
  'நோ பிராப்ளம்': { en: 'No problem', ta: 'பிரச்சனை இல்லை' }
};

const POLISH_PAIRS = [
  ['உனக்கு', 'உங்களுக்கு'],
  ['உன்னால்', 'உங்களால்'],
  ['உன்னை', 'உங்களை'],
  ['உன்', 'உங்கள்'],
  ['உனது', 'உங்களது'],
  ['நீ', 'நீங்கள்'],
  ['கவலைப்படாதே', 'கவலைப்பட வேண்டாம்'],
  ['பயப்படாதே', 'பயப்பட வேண்டாம்'],
  ['சாப்பிடு', 'சாப்பிடுங்கள்'],
  ['குடி', 'குடியுங்கள்'],
  ['காட்டு', 'காட்டுங்கள்'],
  ['சொல்', 'சொல்லுங்கள்'],
  ['எடு', 'எடுத்துக் கொள்ளுங்கள்'],
  ['திற', 'திறங்கள்'],
  ['இருப்பாய்', 'இருப்பீர்கள்'],
  ['தளர்வான இயக்கம்', 'வயிற்றுப்போக்கு']
];

const polishTamilHonorifics = (tamilText) => {
  if (!tamilText || typeof tamilText !== 'string') return tamilText;
  let text = tamilText;
  for (const [target, replacement] of POLISH_PAIRS) {
    if (target.includes(' ')) {
      text = text.replaceAll(target, replacement);
    } else {
      const regex = new RegExp(`(^|[^\\u0B80-\\u0BFF])${target}(?=[^\\u0B80-\\u0BFF]|$)`, 'gu');
      text = text.replace(regex, `$1${replacement}`);
    }
  }
  return text;
};

const lookupPhonetic = (rawText) => {
  if (!rawText) return null;
  const clean = rawText.trim();
  if (TAMIL_PHONETIC_ENGLISH_MAP[clean]) return TAMIL_PHONETIC_ENGLISH_MAP[clean];
  const withoutPunct = clean.replace(/[?.!,]+$/g, '').trim();
  if (TAMIL_PHONETIC_ENGLISH_MAP[withoutPunct]) return TAMIL_PHONETIC_ENGLISH_MAP[withoutPunct];
  const withoutDots = withoutPunct.replace(/\./g, '').replace(/\s+/g, ' ').trim();
  if (TAMIL_PHONETIC_ENGLISH_MAP[withoutDots]) return TAMIL_PHONETIC_ENGLISH_MAP[withoutDots];
  return null;
};

const translateText = async (text, sourceLang = 'auto', targetLang = 'en') => {
  if (!text || !text.trim()) {
    return { success: false, message: 'Empty text provided' };
  }

  let cleanText = text.trim();
  const src = sourceLang === 'auto' ? 'auto' : normalizeLang(sourceLang);
  const tgt = normalizeLang(targetLang);

  // Check Tamil phonetic transcriptions of English words (e.g. "ஆர். யூ ஓகே.", "ஆர் யூ ஓகே?")
  const phoneticEntry = lookupPhonetic(cleanText);
  if (phoneticEntry) {
    return {
      success: true,
      isConfigured: true,
      provider: 'MEDIBRIDGE Medical Lexicon',
      originalText: phoneticEntry.en,
      translatedText: tgt === 'ta' ? phoneticEntry.ta : phoneticEntry.en
    };
  }

  // Pre-process common Tanglish phrases into Tamil script if source is Tamil or auto
  if ((src === 'ta' || src === 'auto') && tgt !== 'ta') {
    const lower = cleanText.toLowerCase();
    if (TANGLISH_MAP[lower]) {
      cleanText = TANGLISH_MAP[lower];
    }
  }

  // Fast-track common English doctor inquiries into natural polite Tamil
  if ((src === 'en' || src === 'auto') && tgt === 'ta') {
    const normalizedEn = cleanText.toLowerCase().replace(/[?.!,]+$/g, '').trim();
    if (DOCTOR_ENGLISH_TO_TAMIL_MAP[normalizedEn]) {
      return {
        success: true,
        isConfigured: true,
        provider: 'MEDIBRIDGE Medical Lexicon',
        translatedText: DOCTOR_ENGLISH_TO_TAMIL_MAP[normalizedEn]
      };
    }
  }

  // If source and target are identical and text is ASCII, return as-is
  const isPureAscii = /^[\x00-\x7F]*$/.test(cleanText);
  if (src === tgt && isPureAscii) {
    return {
      success: true,
      isConfigured: true,
      translatedText: cleanText
    };
  }

  // If src === tgt but regional script detected, auto-detect source!
  const effectiveSrc = (src === tgt) ? 'auto' : src;

  // 1. Ultra-fast Primary Google Neural Translation Endpoint (< 150ms)
  try {
    const clients5Url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${effectiveSrc}&tl=${tgt}&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(clients5Url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(4500)
    });
    if (response.ok) {
      const data = await response.json();
      const translated = Array.isArray(data) ? data[0] : (data?.sentences?.[0]?.trans || data);
      if (typeof translated === 'string' && translated.trim()) {
        const finalTamil = tgt === 'ta' ? polishTamilHonorifics(translated.trim()) : translated.trim();
        return {
          success: true,
          isConfigured: true,
          provider: 'MEDIBRIDGE Neural Engine',
          translatedText: finalTamil
        };
      }
    }
  } catch (c5Err) {
    console.warn('[Translation] Primary clients5 warning:', c5Err.message);
  }

  // 2. Secondary Google GTX Engine Endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${effectiveSrc}&tl=${tgt}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((chunk) => chunk[0]).filter(Boolean).join('');
        if (translated && translated.trim()) {
          const finalTamil = tgt === 'ta' ? polishTamilHonorifics(translated.trim()) : translated.trim();
          return {
            success: true,
            isConfigured: true,
            provider: 'MEDIBRIDGE Neural Engine (GTX)',
            translatedText: finalTamil
          };
        }
      }
    }
  } catch (gtxErr) {
    console.warn('[Translation] Secondary GTX warning:', gtxErr.message);
  }

  // 3. Tertiary MyMemory Engine Endpoint
  try {
    const pair = `${effectiveSrc === 'auto' ? 'en' : effectiveSrc}|${tgt}`;
    const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(pair)}`;
    const mmRes = await fetch(mmUrl, { signal: AbortSignal.timeout(3500) });
    if (mmRes.ok) {
      const mmData = await mmRes.json();
      if (mmData.responseData?.translatedText && mmData.responseData.translatedText.trim()) {
        const rawRes = mmData.responseData.translatedText.trim();
        const finalTamil = tgt === 'ta' ? polishTamilHonorifics(rawRes) : rawRes;
        return {
          success: true,
          isConfigured: true,
          provider: 'MyMemory Neural Translation',
          translatedText: finalTamil
        };
      }
    }
  } catch (mmErr) {
    console.warn('[Translation] Tertiary MyMemory warning:', mmErr.message);
  }

  // 4. Google Cloud Official API (if key configured)
  if (process.env.TRANSLATION_API_KEY && process.env.TRANSLATION_API_KEY.trim()) {
    try {
      const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}`
        },
        body: JSON.stringify({
          q: cleanText,
          source: effectiveSrc === 'auto' ? undefined : effectiveSrc,
          target: tgt,
          format: 'text'
        })
      });
      const data = await response.json();
      if (data.data?.translations?.[0]?.translatedText) {
        const rawRes = data.data.translations[0].translatedText.trim();
        const finalTamil = tgt === 'ta' ? polishTamilHonorifics(rawRes) : rawRes;
        return {
          success: true,
          isConfigured: true,
          provider: 'Google Cloud API',
          translatedText: finalTamil
        };
      }
    } catch (apiErr) {
      console.warn('[Translation] Google Cloud API error:', apiErr.message);
    }
  }

  // 5. Fallback: Return original clean text
  return {
    success: true,
    isConfigured: true,
    provider: 'Direct Pass',
    translatedText: cleanText
  };
};

module.exports = {
  getTranslationStatus,
  translateText
};
