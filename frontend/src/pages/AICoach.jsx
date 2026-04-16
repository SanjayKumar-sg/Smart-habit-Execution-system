/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { auth as authApi } from '../api/client';
import { chatWithCoach } from '../services/gemini';
import toast from 'react-hot-toast';
import { MdSend, MdSmartToy, MdMic, MdMicOff, MdVolumeUp, MdVolumeOff, MdLanguage } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

const WELCOME_EN = "Hello! I'm your AI Health Coach 🤖 I'm here to help you build healthy habits, modify your exercises based on how you feel, and support your wellness journey. How can I help you today?";
const WELCOME_TA = "வணக்கம்! நான் உங்கள் AI ஆரோக்கிய பயிற்சியாளர் 🤖 உங்களுக்கு ஆரோக்கியமான பழக்கங்களை உருவாக்க, உங்கள் உணர்வுகளின் அடிப்படையில் உடற்பயிற்சிகளை மாற்ற உதவ இங்கே இருக்கிறேன். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?";

export default function AICoach() {
  const { user, ageGroup, medicalRecord: cachedMedical, language, setLanguage } = useStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState(cachedMedical);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load medical record for context
    authApi.medicalRecord().then(r => setMedicalRecord(r.data)).catch(() => {});
    // Welcome message
    const welcome = language === 'ta' ? WELCOME_TA : WELCOME_EN;
    setMessages([{ id: 1, role: 'assistant', content: welcome }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getUserData = useCallback(() => ({
    user,
    ageGroup,
    medicalRecord,
    language,
  }), [user, ageGroup, medicalRecord, language]);

  // Text-to-speech
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (language === 'ta') {
      utter.lang = 'ta-IN';
      // Try to find a Tamil voice specifically
      const tamilVoice = voices.find(v => v.lang.includes('ta'));
      if (tamilVoice) utter.voice = tamilVoice;
    } else {
      utter.lang = 'en-US';
      const englishVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'));
      if (englishVoice) utter.voice = englishVoice;
    }

    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.volume = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [voiceEnabled, language]);

  // Speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); toast.error('Voice recognition failed'); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleSend = async (e, overrideMsg) => {
    e?.preventDefault();
    const msg = overrideMsg || input.trim();
    if (!msg) return;
    setInput('');
    const userMsg = { id: Date.now(), role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = messages.filter(m => m.role !== 'system');
      const reply = await chatWithCoach(msg, getUserData(), history);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: reply };
      setMessages(prev => [...prev, aiMsg]);
      if (voiceEnabled) speak(reply);
    } catch (err) {
      toast.error('Coach is offline. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ta' : 'en';
    setLanguage(newLang);
    const welcome = newLang === 'ta' ? WELCOME_TA : WELCOME_EN;
    setMessages([{ id: Date.now(), role: 'assistant', content: welcome }]);
    toast.success(newLang === 'ta' ? 'Tamil மொழியில் பேசுகிறோம்!' : 'Switched to English!');
  };

  const quickPrompts = language === 'ta'
    ? ['இன்றைக்கு என்ன உடற்பயிற்சி செய்யலாம்?', 'என்னை நம்ப வைக்கவும்', 'ஆரோக்கியமான உணவு டிப்ஸ்']
    : ['What exercises suit me today?', 'Motivate me!', 'Give me healthy eating tips'];

  return (
    <div className="fade-in" style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-h) - 4rem)' }}>
      {/* Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="h2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdSmartToy color="var(--primary-light)" /> AI Habit Coach
            {language === 'ta' && <span style={{ fontSize: '0.75rem', background: 'rgba(6,182,212,0.15)', color: 'var(--secondary)', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>தமிழ்</span>}
          </h1>
          <p className="text-muted text-sm">
            {language === 'ta'
              ? 'தமிழ் மற்றும் ஆங்கிலத்தில் தனிப்பட்ட ஆலோசனை பெறுங்கள்'
              : 'Personalized advice in English & Tamil · Voice-enabled'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Language Toggle */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleLanguage}
            title="Toggle English/Tamil"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <MdLanguage size={16} />
            {language === 'ta' ? '🇮🇳 தமிழ்' : '🇬🇧 English'}
          </button>
          {/* Voice toggle */}
          <button
            className={`btn btn-sm ${voiceEnabled ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={() => { setVoiceEnabled(v => !v); if (isSpeaking) stopSpeaking(); }}
            title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
          >
            {voiceEnabled ? <MdVolumeUp size={16} /> : <MdVolumeOff size={16} />}
          </button>
          {/* Stop speaking */}
          {isSpeaking && (
            <button className="btn btn-danger btn-sm" onClick={stopSpeaking}>⏹</button>
          )}
        </div>
      </div>

      {/* Quick Prompts */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {quickPrompts.map(p => (
          <button key={p} className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78rem', border: '1px solid var(--border)', borderRadius: '99px' }}
            onClick={() => handleSend(null, p)}>
            {p}
          </button>
        ))}
      </div>

      {/* Chat Box */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div className="chat-messages" style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <AnimatePresence key={m.id || i}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  {m.role === 'assistant' && <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {m.role === 'user' ? (user?.first_name || 'You') : 'AI Coach'}
                  </span>
                  {m.role === 'assistant' && (
                    <button onClick={() => speak(m.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.1rem' }} title="Speak">
                      🔊
                    </button>
                  )}
                </div>
                <div className={`chat-bubble ${m.role}`} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {m.content}
                </div>
              </motion.div>
            </AnimatePresence>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>
              <div className="chat-bubble assistant" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '0.75rem 1rem' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1.2s infinite 0s' }} />
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1.2s infinite 0.2s' }} />
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-light)', animation: 'bounce 1.2s infinite 0.4s' }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Row */}
        <form className="chat-input-row" onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem', padding: '1rem', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
          {/* Mic button */}
          <button
            type="button"
            className={`voice-btn ${isListening ? 'listening' : ''}`}
            style={{ width: 44, height: 44, flexShrink: 0 }}
            onClick={isListening ? stopListening : startListening}
            title={isListening ? 'Stop listening' : 'Speak your question'}
          >
            {isListening ? <MdMicOff size={20} /> : <MdMic size={20} />}
          </button>

          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder={language === 'ta' ? 'உங்கள் கேள்வியை தட்டச்சு செய்யுங்கள் அல்லது பேசுங்கள்...' : 'Type or speak your question...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            <MdSend />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
