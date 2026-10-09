import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, X, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>(
    'Hello! I can help you find hospitals, register patients, check blood donors, manage your queue token, or switch languages. How can I assist you?'
  );
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const recognitionRef = useRef<unknown>(null);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new (SpeechRecognition as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: () => void;
        onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
        onerror: (e: { error: string }) => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      })();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleCommand(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setSpeechSupported(false);
    }
  }, [language]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    try {
      (recognitionRef.current as { start: () => void }).start();
    } catch {
      // recognition may already be active
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        (recognitionRef.current as { stop: () => void }).stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleCommand = (rawText: string) => {
    const cmd = rawText.toLowerCase().trim();
    let reply = '';
    let navTarget: string | null = null;

    if (cmd.includes('register') || cmd.includes('intake') || cmd.includes('నమోదు') || cmd.includes('पंजीकरण')) {
      reply = 'Opening patient registration form.';
      navTarget = '/patient-intake';
    } else if (cmd.includes('hospital') || cmd.includes('ఆసుపత్రి') || cmd.includes('अस्पताल')) {
      reply = 'Searching nearby verified hospitals and healthcare facilities.';
      navTarget = '/hospitals';
    } else if (cmd.includes('donor') || cmd.includes('blood') || cmd.includes('రక్తం') || cmd.includes('रक्त')) {
      reply = 'Navigating to blood donor and recipient coordination network.';
      navTarget = '/blood-network';
    } else if (cmd.includes('queue') || cmd.includes('token') || cmd.includes('టోకెన్') || cmd.includes('कतार')) {
      reply = 'Displaying your active queue token and estimated wait time.';
      navTarget = '/my-token';
    } else if (cmd.includes('triage') || cmd.includes('emergency') || cmd.includes('ట్రియాజ్') || cmd.includes('ఆపద')) {
      reply = 'Opening emergency triage assessment board.';
      navTarget = '/triage-assessment';
    } else if (cmd.includes('medication') || cmd.includes('medicine') || cmd.includes('మందులు') || cmd.includes('दवा')) {
      reply = 'Opening medication schedule and adherence tracker.';
      navTarget = '/medications';
    } else if (cmd.includes('metric') || cmd.includes('health') || cmd.includes('pressure') || cmd.includes('రక్తపోటు')) {
      reply = 'Opening longitudinal health dashboard and blood pressure trends.';
      navTarget = '/health-dashboard';
    } else if (cmd.includes('telugu') || cmd.includes('తెలుగు')) {
      setLanguage('te');
      reply = 'భాషను తెలుగుకు మార్చడం జరిగింది.';
    } else if (cmd.includes('hindi') || cmd.includes('हिंदी')) {
      setLanguage('hi');
      reply = 'भाषा को हिंदी में बदल दिया गया है।';
    } else if (cmd.includes('english')) {
      setLanguage('en');
      reply = 'Switched display language to English.';
    } else {
      reply = `Understood: "${rawText}". I can direct you to Hospitals, Queue, Blood Network, or Patient Intake.`;
    }

    setAssistantReply(reply);
    speakText(reply);

    if (navTarget) {
      setTimeout(() => {
        onNavigate(navTarget as string);
        onClose();
      }, 1400);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setTranscript(textInput);
    handleCommand(textInput);
    setTextInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-lg overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {t.nav.voiceAssistant}
              </h3>
              <p className="text-xs text-slate-400">
                Multilingual Voice & Text Navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assistant Response Box */}
        <div className="p-5 flex-1 space-y-4">
          <div className="p-4 bg-teal-950/50 border border-teal-800/70 rounded-lg flex items-start gap-3">
            <Volume2 className={`w-5 h-5 text-teal-400 shrink-0 mt-0.5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <div>
              <p className="text-xs font-semibold text-teal-300 uppercase tracking-wide">MART Assistant</p>
              <p className="text-sm text-teal-100 mt-1 leading-relaxed">{assistantReply}</p>
            </div>
          </div>

          {transcript && (
            <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200">
              <span className="font-medium text-slate-400">You said:</span> &ldquo;{transcript}&rdquo;
            </div>
          )}

          {/* Voice Input Section */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950/60 rounded-lg border border-dashed border-slate-800">
            {speechSupported ? (
              <>
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30 scale-105'
                      : 'bg-teal-600 text-white hover:bg-teal-500'
                  }`}
                  aria-label={isListening ? 'Stop recording' : 'Start microphone recording'}
                >
                  {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <p className="mt-3 text-xs font-medium text-slate-300">
                  {isListening ? t.voice.listening : t.voice.speakNow}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-400 p-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Web Speech API is unavailable in this browser; please use text commands below.</span>
              </div>
            )}
          </div>

          {/* Quick Command Suggestions */}
          <div>
            <p className="text-xs font-medium text-slate-400 mb-2">{t.voice.trySaying}</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Register a new patient',
                'Find nearby hospitals',
                'Show my queue token',
                'Find available blood donors',
                'Show blood pressure readings',
                'Change language to Telugu',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTranscript(cmd);
                    handleCommand(cmd);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-750 text-slate-250 border border-slate-700/80 rounded-md transition-colors text-left font-medium"
                >
                  &ldquo;{cmd}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Visible Text-Input Fallback */}
          <form onSubmit={handleTextSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={t.voice.textFallback}
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.voice.sendText}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
