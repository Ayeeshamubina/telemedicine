const express = require('express');
const router = express.Router();
const { getTranslationStatus, translateText } = require('../services/translationService');
const { protect } = require('../middleware/authMiddleware');

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

router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: getTranslationStatus()
  });
});

router.get('/tts', async (req, res) => {
  try {
    const { text, lang } = req.query;
    if (!text || !text.trim()) {
      return res.status(400).send('Text parameter required');
    }

    const cleanText = text.trim();
    const l = (lang || 'en').toLowerCase().trim();
    const langCode = LANG_CODE_MAP[l] || 'en';

    // Stream MP3 directly from Google TTS Engine with realistic headers
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!response.ok) {
      return res.status(response.status).send('TTS service unavailable');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error('TTS endpoint error:', err.message);
    res.status(500).send('TTS error: ' + err.message);
  }
});

router.post('/translate', async (req, res, next) => {
  try {
    const text = req.body.text;
    const sourceLang = req.body.sourceLang || req.body.sourceLanguage;
    const targetLang = req.body.targetLang || req.body.targetLanguage;
    if (!text || !sourceLang || !targetLang) {
      return res.status(400).json({
        success: false,
        message: 'Text, source language, and target language are required'
      });
    }

    const result = await translateText(text, sourceLang, targetLang);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
