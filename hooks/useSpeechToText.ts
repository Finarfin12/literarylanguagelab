"use client";

import { useState, useRef, useCallback } from 'react';

export type STTEngine = 'browser' | 'whisper';

export interface STTOptions {
  onComplete?: (text: string) => void;
}

export function useSpeechToText(options?: STTOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript('');
    
    // Read preference
    const engine = (localStorage.getItem('stt_engine') as STTEngine) || 'browser';

    if (engine === 'browser') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Browser ini tidak mendukung Native Speech Recognition. Silakan gunakan Google Chrome atau ubah engine ke Whisper di Pengaturan.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        let errorMsg = `Error: ${event.error}`;
        if (event.error === 'not-allowed') {
          errorMsg = "Akses mikrofon ditolak. Mohon izinkan browser untuk mengakses mikrofon Anda.";
        } else if (event.error === 'audio-capture') {
          errorMsg = "Tidak dapat menangkap suara. Pastikan mikrofon Anda terhubung, berfungsi, dan tidak sedang digunakan secara eksklusif oleh aplikasi lain.";
        } else if (event.error === 'no-speech') {
          errorMsg = "Tidak ada suara yang terdeteksi.";
        } else if (event.error === 'network') {
          errorMsg = "Koneksi jaringan terputus. Native Speech API memerlukan koneksi internet aktif di beberapa browser.";
        }
        setError(errorMsg);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        // Browser Native often sets transcript in chunks, so we rely on the parent having the latest `transcript` state.
        // However, we can also pass the internal state if needed. But it's tricky because of closures.
        // We will call onComplete inside a useEffect watching `isRecording` later to ensure we have the final transcript.
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err: any) {
        setError(err.message);
      }
    } else {
      // Whisper Engine
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());
            
            await processWhisper(audioBlob);
          };

          mediaRecorder.start();
          setIsRecording(true);
        })
        .catch(err => {
          console.error("Microphone error", err);
          setError("Gagal mengakses mikrofon. Pastikan Anda memberikan izin akses.");
        });
    }
  }, []);

  const stopRecording = useCallback(() => {
    const engine = (localStorage.getItem('stt_engine') as STTEngine) || 'browser';
    
    if (engine === 'browser' && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (engine === 'whisper' && mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  }, [isRecording]);

  const processWhisper = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal memproses audio di server');
      }

      const data = await response.json();
      setTranscript(data.text);
      if (options?.onComplete) {
        options.onComplete(data.text);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger onComplete for Browser API since onend closure is tricky
  const prevRecording = useRef(false);
  useEffect(() => {
    if (prevRecording.current && !isRecording && !isProcessing && transcript) {
      const engine = (localStorage.getItem('stt_engine') as STTEngine) || 'browser';
      if (engine === 'browser' && options?.onComplete) {
        options.onComplete(transcript);
      }
    }
    prevRecording.current = isRecording;
  }, [isRecording, isProcessing, transcript, options]);

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    startRecording,
    stopRecording
  };
}
