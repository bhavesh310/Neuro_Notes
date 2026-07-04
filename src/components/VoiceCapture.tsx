import { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Mic, MicOff, Pause, Play, Save, Trash2, Square } from 'lucide-react';

type AnyRecognition = any;

const MAX_NETWORK_RETRIES = 3;

export default function VoiceCapture() {
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<'idle' | 'listening' | 'paused'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const recognitionRef = useRef<AnyRecognition | null>(null);
  const shouldKeepAliveRef = useRef(false);
  const networkRetryCountRef = useRef(0);

  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event: any) => {
      // A successful result means the connection is healthy again.
      networkRetryCountRef.current = 0;
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      if (finalText) {
        setTranscript((prev) => (prev ? prev + ' ' : '') + finalText.trim());
        setError(null);
      }
      setInterim(interimText);
    };

    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone permission denied. Allow mic access in your browser.');
        shouldKeepAliveRef.current = false;
        setStatus('idle');
      } else if (e.error === 'network') {
        // The browser couldn't reach the speech recognition service.
        // Retry a few times automatically before giving up — this is often transient.
        networkRetryCountRef.current += 1;
        if (networkRetryCountRef.current <= MAX_NETWORK_RETRIES && shouldKeepAliveRef.current) {
          setError(`Network hiccup — retrying (${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES})...`);
          // rec.onend fires right after this and restarts recognition since shouldKeepAliveRef is still true
        } else {
          setError(
            "Mic error: network — couldn't reach the speech service. Check your internet connection, disable any VPN/ad-blocker, and make sure you're using Chrome over HTTPS or localhost."
          );
          shouldKeepAliveRef.current = false;
          setStatus('idle');
          networkRetryCountRef.current = 0;
        }
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(`Mic error: ${e.error}`);
      }
    };

    rec.onend = () => {
      if (shouldKeepAliveRef.current) {
        try {
          rec.start();
        } catch {
          setStatus('idle');
        }
      } else {
        setInterim('');
      }
    };

    recognitionRef.current = rec;
    return () => {
      shouldKeepAliveRef.current = false;
      try { rec.stop(); } catch {}
    };
  }, []);

  const start = useCallback(() => {
    setError(null);
    networkRetryCountRef.current = 0;
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      shouldKeepAliveRef.current = true;
      rec.start();
    } catch {}
    setStatus('listening');
  }, []);

  const pause = useCallback(() => {
    shouldKeepAliveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setStatus('paused');
  }, []);

  const resume = useCallback(() => start(), [start]);

  const stop = useCallback(() => {
    shouldKeepAliveRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    setStatus('idle');
    setInterim('');
  }, []);

  const saveNote = () => {
    const text = (transcript + ' ' + interim).trim();
    if (!text) return;
    try {
      const raw = localStorage.getItem('neuronotes_notes');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: `n_${Date.now()}`,
        title: text.split(/[.!?]/)[0].slice(0, 60) || 'Voice note',
        content: text,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('neuronotes_notes', JSON.stringify(list));
      window.dispatchEvent(new Event('neuronotes:notes-changed'));
    } catch {}
    setTranscript('');
    setInterim('');
    stop();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const clear = () => { setTranscript(''); setInterim(''); };

  const displayText = (transcript + (interim ? ' ' + interim : '')).trim();
  const isListening = status === 'listening';
  const isPaused = status === 'paused';

  return (
    <div className="w-full sm:w-96 flex flex-col gap-2">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: '#07070f',
          border: `1px solid ${isListening ? 'hsl(263 69% 58% / 0.5)' : isPaused ? 'hsl(189 94% 43% / 0.5)' : 'hsl(240 20% 14%)'}`,
          boxShadow: isListening ? '0 0 0 3px hsl(263 69% 58% / 0.12)' : undefined,
          transition: 'all 0.2s',
        }}
      >
        <Sparkles size={16} className="text-muted-foreground flex-shrink-0" />
        <input
          value={displayText}
          onChange={(e) => { setTranscript(e.target.value); setInterim(''); }}
          placeholder={isListening ? 'Listening…' : isPaused ? 'Paused — resume to keep dictating' : 'Tap mic and start speaking…'}
          className="flex-1 bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
        />
        {!supported ? (
          <span className="font-mono text-[10px] text-muted-foreground">no mic api</span>
        ) : status === 'idle' ? (
          <button
            type="button"
            onClick={start}
            aria-label="Start voice capture"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <MicOff size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            {isListening ? (
              <button
                type="button"
                onClick={pause}
                aria-label="Pause"
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'hsl(263 69% 58% / 0.2)', color: '#a78bfa' }}
              >
                <div className="relative">
                  <Pause size={14} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={resume}
                aria-label="Resume"
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{ background: 'hsl(189 94% 43% / 0.18)', color: '#22d3ee' }}
              >
                <Play size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={stop}
              aria-label="Stop"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Square size={13} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="font-mono text-[11px] text-cyan-400">{error}</p>}
      {savedToast && <p className="font-mono text-[11px] text-violet-300">✓ Saved to your notes</p>}

      {(displayText || isPaused) && (
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {displayText.split(/\s+/).filter(Boolean).length} words
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={clear}
              className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 size={11} /> Clear
            </button>
            <button
              onClick={saveNote}
              disabled={!displayText}
              className="flex items-center gap-1 px-3 py-1 rounded-lg font-mono text-[11px] font-semibold disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#f1f5f9' }}
            >
              <Save size={11} /> Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}