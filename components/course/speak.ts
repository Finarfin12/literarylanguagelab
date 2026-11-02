// Memutar kalimat bahasa Inggris untuk langkah Kursus Dasar (kosakata, dengar, bicara).
// Mengikuti mesin suara pilihan pengguna (`tts_engine` di localStorage, sama dengan Listening Test dan Dikte):
// Groq lewat /api/tts, atau suara peramban. Mengembalikan false bila perangkat tidak punya suara.

let current: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export function stopSpeaking() {
  current?.pause();
  current = null;
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

export async function speakText(text: string, slow = false, onEnd?: () => void): Promise<boolean> {
  stopSpeaking();
  let engine = "browser";
  try {
    engine = localStorage.getItem("tts_engine") || "browser";
  } catch {
    // storage diblokir: suara peramban
  }

  if (engine === "groq") {
    try {
      const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) {
        currentUrl = URL.createObjectURL(await res.blob());
        const audio = new Audio(currentUrl);
        audio.playbackRate = slow ? 0.8 : 1;
        audio.onended = () => onEnd?.();
        current = audio;
        await audio.play();
        return true;
      }
    } catch {
      // jatuh ke suara peramban
    }
  }

  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = slow ? 0.65 : 0.9;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return true;
}
