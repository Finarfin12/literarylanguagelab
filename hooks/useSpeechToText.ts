"use client";

import { useState, useRef, useCallback } from 'react';

export type STTEngine = 'browser' | 'whisper';

export function useSpeechToText() {
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
        setError(`Error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
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
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    startRecording,
    stopRecording
  };
}
