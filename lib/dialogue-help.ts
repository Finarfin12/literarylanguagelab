// Bantuan pemula untuk Dialogue Simulator (Fase 22.3). Data lokal ditulis sendiri per skenario: arti untuk frasa bantuan
// yang sudah ada (`hintPhrases`) dan beberapa awalan kalimat. Fungsi murni tanpa impor agar bisa diuji unit
// (tests/dialogue-help.test.mts). Tanpa AI; terjemahan balasan AI ada di route terpisah dan hanya dimuat saat diklik.

export interface DialogueHelp {
  /** Arti Indonesia untuk tiap frasa di `hintPhrases` skenario (kunci = frasa Inggris persis). */
  phrases: Record<string, string>;
  /** 2-3 awalan kalimat; mengetuknya mengisi kolom ketik, pengguna melanjutkan sendiri. */
  starters: string[];
}

export const DIALOGUE_HELP: Record<string, DialogueHelp> = {
  "ordering-coffee": {
    phrases: {
      "I'd like a...": "Saya mau ... (memesan)",
      "Can I get a...": "Boleh saya minta ...",
      "Do you have...?": "Apakah ada ...?",
      "What do you recommend?": "Apa yang Anda sarankan?",
    },
    starters: ["Hello, I would like a ", "Can I get a small ", "Do you have any "],
  },
  "job-interview": {
    phrases: {
      "I have experience in...": "Saya punya pengalaman di bidang ...",
      "My strengths are...": "Kelebihan saya adalah ...",
      "I'm passionate about...": "Saya sangat tertarik pada ...",
      "In my previous role...": "Di pekerjaan saya sebelumnya ...",
    },
    starters: ["Thank you for having me. My name is ", "I have worked as a ", "I am interested in this job because "],
  },
  "airport-checkin": {
    phrases: {
      "Here's my passport.": "Ini paspor saya.",
      "I'd like a window seat.": "Saya mau kursi dekat jendela.",
      "How much luggage can I bring?": "Berapa banyak bagasi yang boleh saya bawa?",
      "What gate is my flight?": "Penerbangan saya di gerbang berapa?",
    },
    starters: ["Hello, I have a flight to ", "Here is my ", "I have one bag to "],
  },
  "hotel-booking": {
    phrases: {
      "I'd like to book a room.": "Saya mau memesan kamar.",
      "How much is it per night?": "Berapa harganya per malam?",
      "Do you have WiFi?": "Apakah ada WiFi?",
      "Is breakfast included?": "Apakah sudah termasuk sarapan?",
    },
    starters: ["Hello, I would like to book a room for ", "I need a room from ", "Is there a "],
  },
  "doctor-visit": {
    phrases: {
      "I've been feeling...": "Akhir-akhir ini saya merasa ...",
      "I have a headache.": "Kepala saya sakit.",
      "It started about...": "Mulainya sekitar ...",
      "Should I take any medicine?": "Apakah saya perlu minum obat?",
    },
    starters: ["Hello doctor, I have a ", "I feel ", "It started two days "],
  },
  "restaurant-order": {
    phrases: {
      "What's the special today?": "Apa menu spesial hari ini?",
      "I'll have the...": "Saya pesan ...",
      "Can I get the check?": "Boleh minta tagihannya?",
      "Is this dish spicy?": "Apakah hidangan ini pedas?",
    },
    starters: ["Hello, a table for ", "I will have the ", "Can I have some "],
  },
  "small-talk-neighbor": {
    phrases: {
      "Nice to meet you!": "Senang berkenalan dengan Anda!",
      "The weather is...": "Cuacanya ...",
      "What do you do for fun?": "Apa kegemaran Anda?",
      "Have a good day!": "Semoga harimu menyenangkan!",
    },
    starters: ["Hello, my name is ", "I live in the house next to ", "Nice weather today, "],
  },
  "tech-support": {
    phrases: {
      "My internet is not working.": "Internet saya tidak berfungsi.",
      "I already tried restarting.": "Saya sudah mencoba menyalakan ulang.",
      "The lights are blinking.": "Lampunya berkedip.",
      "How long will it take to fix?": "Berapa lama perbaikannya?",
    },
    starters: ["Hello, I have a problem with my ", "It stopped working ", "I already tried to "],
  },
};

/** Bantuan untuk skenario; null bila skenario belum punya data. */
export function helpFor(scenarioId: string): DialogueHelp | null {
  return DIALOGUE_HELP[scenarioId] ?? null;
}

/** Arti frasa bantuan; null bila tidak ada. */
export function phraseMeaning(scenarioId: string, phrase: string): string | null {
  return helpFor(scenarioId)?.phrases[phrase] ?? null;
}

/** Bawaan sakelar "Bantuan pemula": menyala untuk A1 saja. Pilihan pengguna yang tersimpan menang atas bawaan. */
export function beginnerHelpDefault(cefr: string | null | undefined): boolean {
  return cefr === "A1";
}

export function resolveBeginnerHelp(stored: string | null | undefined, cefr: string | null | undefined): boolean {
  if (stored === "on") return true;
  if (stored === "off") return false;
  return beginnerHelpDefault(cefr);
}

/** Batas panjang balasan yang boleh diterjemahkan (melindungi biaya). */
export const MAX_TRANSLATE_CHARS = 600;
