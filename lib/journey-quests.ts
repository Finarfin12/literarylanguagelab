// lib/journey-quests.ts
// Definisi quest untuk Reading Journey

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  tool: string;
  toolPath: string;
}

export interface JourneyLevel {
  level: number;
  cefr: string;
  title: string;
  subtitle: string;
  quests: Quest[];
  milestone: { badge: string; xpBonus: number };
}

export const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    level: 1, cefr: 'A1', title: 'The First Page', subtitle: 'Langkah pertama dalam dunia bahasa Inggris.',
    quests: [
      { id: 'a1_read', title: 'First Story', description: 'Baca 1 cerita/buku pendek dari perpustakaan.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'a1_grammar', title: 'Grammar Check', description: 'Analisis teks dengan Grammar Clinic, skor ≥40.', icon: '📝', tool: 'Grammar Clinic', toolPath: '/english-lab/grammar-clinic' },
      { id: 'a1_vocab', title: 'Word Collector', description: 'Simpan 10 kata baru ke Vocabulary Bank.', icon: '🃏', tool: 'Vocabulary Bank', toolPath: '/vocabulary' },
      { id: 'a1_flashcard', title: 'Memory Training', description: 'Review 10 kata dengan Flashcard SRS.', icon: '🧠', tool: 'Flashcard SRS', toolPath: '/english-lab/flashcard' },
      { id: 'a1_listen', title: 'Listen Closely', description: 'Selesaikan 1 sesi Listening Test level A1.', icon: '🎧', tool: 'Listening Test', toolPath: '/english-lab/listening-test' },
      { id: 'a1_speak', title: 'Say It Right', description: 'Uji pelafalan 5 kalimat di Pronunciation Clinic.', icon: '🗣️', tool: 'Pronunciation Clinic', toolPath: '/tools/pronunciation-clinic' },
      { id: 'a1_dialogue', title: 'Real Talk', description: 'Selesaikan 1 skenario di Dialogue Simulator.', icon: '💬', tool: 'Dialogue Simulator', toolPath: '/english-lab/dialogue-simulator' },
      { id: 'a1_translate', title: 'First Translation', description: 'Terjemahkan 1 paragraf di Translation Workshop.', icon: '✍️', tool: 'Translation Workshop', toolPath: '/translation-workshop' },
    ],
    milestone: { badge: '📗 The First Page', xpBonus: 100 }
  },
  {
    level: 2, cefr: 'A2', title: 'Finding Your Voice', subtitle: 'Mulai menemukan suara Anda dalam bahasa Inggris.',
    quests: [
      { id: 'a2_read', title: 'Avid Reader', description: 'Baca 2 cerita/buku dari perpustakaan.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'a2_grammar', title: 'Grammar Builder', description: 'Analisis 2 teks dengan Grammar Clinic, rata-rata skor ≥55.', icon: '📝', tool: 'Grammar Clinic', toolPath: '/english-lab/grammar-clinic' },
      { id: 'a2_vocab', title: 'Word Hoarder', description: 'Kumpulkan total 30 kata di Vocabulary Bank.', icon: '🃏', tool: 'Vocabulary Bank', toolPath: '/vocabulary' },
      { id: 'a2_flashcard', title: 'SRS Streak', description: 'Review 25 kata dengan Flashcard SRS.', icon: '🧠', tool: 'Flashcard SRS', toolPath: '/english-lab/flashcard' },
      { id: 'a2_listen', title: 'Active Listener', description: 'Selesaikan 2 sesi Listening Test level A2.', icon: '🎧', tool: 'Listening Test', toolPath: '/english-lab/listening-test' },
      { id: 'a2_speak', title: 'Confident Speaker', description: 'Uji pelafalan 10 kalimat dengan rata-rata skor ≥60%.', icon: '🗣️', tool: 'Pronunciation Clinic', toolPath: '/tools/pronunciation-clinic' },
      { id: 'a2_slang', title: 'Street Smart', description: 'Decode 5 ekspresi slang di Slang Decoder.', icon: '🧩', tool: 'Slang Decoder', toolPath: '/english-lab/slang-decoder' },
      { id: 'a2_dialogue', title: 'Conversationalist', description: 'Selesaikan 2 skenario berbeda di Dialogue Simulator.', icon: '💬', tool: 'Dialogue Simulator', toolPath: '/english-lab/dialogue-simulator' },
      { id: 'a2_writing', title: 'First Draft', description: 'Selesaikan 1 Weekly Writing Challenge.', icon: '✍️', tool: 'Writing Challenge', toolPath: '/english-lab/writing-challenge' },
      { id: 'a2_vocab_preview', title: 'Prepared Reader', description: 'Gunakan Pre-Reading Vocab Preview sebelum membaca 1 buku.', icon: '👁️', tool: 'Vocab Preview', toolPath: '/library' },
      { id: 'a2_listening_challenge', title: 'Vocal Reader', description: 'Selesaikan 1 Listening Challenge Lisan setelah membaca bab.', icon: '🎤', tool: 'Listening Challenge', toolPath: '/library' },
    ],
    milestone: { badge: '📘 Finding Your Voice', xpBonus: 150 }
  },
  {
    level: 3, cefr: 'B1', title: 'Between the Lines', subtitle: 'Mulai membaca di antara baris — memahami makna tersirat.',
    quests: [
      { id: 'b1_read', title: 'Literary Explorer', description: 'Baca 3 teks sastra dan selesaikan 1 kuis pemahaman.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'b1_lingowise', title: 'AI Analyst', description: 'Gunakan LingoWise AI (mode apa saja) pada 2 teks berbeda.', icon: '🔍', tool: 'LingoWise AI', toolPath: '/lingowise' },
      { id: 'b1_grammar', title: 'Grammar Master', description: 'Dapatkan skor ≥70 di Grammar Clinic.', icon: '📝', tool: 'Grammar Clinic', toolPath: '/english-lab/grammar-clinic' },
      { id: 'b1_vocab', title: 'Vocabulary Builder', description: 'Kumpulkan total 60 kata, review 40 dengan SRS.', icon: '🃏', tool: 'Flashcard SRS', toolPath: '/english-lab/flashcard' },
      { id: 'b1_listen', title: 'Deep Listener', description: 'Selesaikan Listening Test B1, skor ≥60%.', icon: '🎧', tool: 'Listening Test', toolPath: '/english-lab/listening-test' },
      { id: 'b1_translate', title: 'Translator\'s Path', description: 'Terjemahkan 2 paragraf dan dapatkan evaluasi AI.', icon: '✍️', tool: 'Translation Workshop', toolPath: '/translation-workshop' },
      { id: 'b1_alter_ego', title: 'Meet the Author', description: 'Ngobrol dengan 1 penulis legendaris di Alter Ego Chat.', icon: '🎭', tool: 'Alter Ego Chat', toolPath: '/tools/alter-ego' },
      { id: 'b1_paraphrase', title: 'Paraphrase Pro', description: 'Selesaikan 1 Paraphrase Challenge dengan skor ≥6/10.', icon: '🔄', tool: 'Paraphrase Challenge', toolPath: '/tools/paraphrase' },
      { id: 'b1_writing', title: 'Avid Writer', description: 'Selesaikan 3 Weekly Writing Challenge.', icon: '✍️', tool: 'Writing Challenge', toolPath: '/english-lab/writing-challenge' },
    ],
    milestone: { badge: '📙 Between the Lines', xpBonus: 200 }
  },
  {
    level: 4, cefr: 'B2', title: 'The Literary Explorer', subtitle: 'Menjelajahi keindahan bahasa sastra dengan percaya diri.',
    quests: [
      { id: 'b2_read', title: 'Classic Connoisseur', description: 'Baca 2 novel klasik (≥3 bab) dari Gutenberg.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'b2_rhetorical', title: 'Rhetoric Hunter', description: 'Gunakan Rhetorical Spotter untuk mendeteksi majas pada 2 teks.', icon: '🎯', tool: 'Rhetorical Spotter', toolPath: '/tools/rhetorical-spotter' },
      { id: 'b2_sentence', title: 'Syntax Surgeon', description: 'Analisis 3 kalimat kompleks dengan Sentence Architect.', icon: '🏗️', tool: 'Sentence Architect', toolPath: '/tools/sentence-architect' },
      { id: 'b2_diction', title: 'Word Alchemist', description: 'Analisis diksi pada 2 kutipan berbeda di Diction Lab.', icon: '⚗️', tool: 'Diction Lab', toolPath: '/tools/diction-lab' },
      { id: 'b2_listen', title: 'Attentive Ear', description: 'Selesaikan Listening Test B2, skor ≥70%.', icon: '🎧', tool: 'Listening Test', toolPath: '/english-lab/listening-test' },
      { id: 'b2_translate', title: 'Faithful Translator', description: 'Dapatkan evaluasi "Equivalence" ≥ Good pada terjemahan.', icon: '✍️', tool: 'Translation Workshop', toolPath: '/translation-workshop' },
      { id: 'b2_idiom', title: 'Idiom Collector', description: 'Simpan 15 idiom ke dalam Idiom Library.', icon: '📚', tool: 'Idiom Library', toolPath: '/idioms' },
      { id: 'b2_dialogue', title: 'Fluent Speaker', description: 'Dapatkan fluency score ≥70 di Dialogue Simulator.', icon: '💬', tool: 'Dialogue Simulator', toolPath: '/english-lab/dialogue-simulator' },
    ],
    milestone: { badge: '📕 The Literary Explorer', xpBonus: 300 }
  },
  {
    level: 5, cefr: 'C1', title: 'Master Craftsman', subtitle: 'Menguasai seni membedah bahasa dan sastra.',
    quests: [
      { id: 'c1_read', title: 'Deep Reader', description: 'Baca karya berat (Shakespeare/Dickens) dan selesaikan kuis.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'c1_era', title: 'Time Traveler', description: 'Gunakan Era Translator untuk mengubah teks antar 2 era berbeda.', icon: '⏳', tool: 'Era Translator', toolPath: '/tools/era-translator' },
      { id: 'c1_vibe', title: 'Nuance Master', description: 'Gunakan Vibe Translator untuk 3 kutipan bernuansa berbeda.', icon: '🎨', tool: 'Vibe Translator', toolPath: '/tools/vibe-translator' },
      { id: 'c1_critical', title: 'Critical Thinker', description: 'Analisis 2 teks dengan Critical Lens.', icon: '🔬', tool: 'Critical Lens', toolPath: '/tools/critical-lens' },
      { id: 'c1_vocab', title: 'Lexicon Master', description: 'Kumpulkan 150+ kata, kuasai 100 kata (mastery ≥3).', icon: '📚', tool: 'Vocabulary Bank', toolPath: '/vocabulary' },
      { id: 'c1_translate', title: 'Literary Translator', description: 'Terjemahkan puisi atau prosa sastra dengan evaluasi ≥ Good.', icon: '✍️', tool: 'Translation Workshop', toolPath: '/translation-workshop' },
      { id: 'c1_essay', title: 'Essay Writer', description: 'Tulis esai analisis dan dapatkan feedback dari AI Writing Assistant.', icon: '📝', tool: 'AI Writing Assistant', toolPath: '/tools/writing-assistant' },
      { id: 'c1_community', title: 'Community Sage', description: 'Posting 3 kontribusi di Forum diskusi sastra.', icon: '🏛️', tool: 'Forum', toolPath: '/forum' },
    ],
    milestone: { badge: '📓 Master Craftsman', xpBonus: 400 }
  },
  {
    level: 6, cefr: 'C2', title: 'Keeper of Words', subtitle: 'Penjaga kata-kata — menguasai bahasa Inggris di level tertinggi.',
    quests: [
      { id: 'c2_read', title: 'Literary Sage', description: 'Baca 5 karya sastra berat dari era yang berbeda.', icon: '📖', tool: 'Public Domain Books', toolPath: '/gutenberg' },
      { id: 'c2_dialect', title: 'Dialect Scholar', description: 'Analisis dialek pada 3 teks sastra berbeda dengan Dialect Diver.', icon: '🗺️', tool: 'Dialect Diver', toolPath: '/tools/dialect-diver' },
      { id: 'c2_mood', title: 'Mood Sculptor', description: 'Ubah suasana 3 teks berbeda menggunakan Mood Transformer.', icon: '🎭', tool: 'Mood Transformer', toolPath: '/tools/mood-transformer' },
      { id: 'c2_alter_ego', title: 'Literary Counsel', description: 'Berdialog mendalam dengan 3 penulis legendaris di Alter Ego Chat.', icon: '👤', tool: 'Alter Ego Chat', toolPath: '/tools/alter-ego' },
      { id: 'c2_duel', title: 'Translation Champion', description: 'Menangkan 1 Translation Duel.', icon: '⚔️', tool: 'Translation Duels', toolPath: '/duels' },
      { id: 'c2_glossary', title: 'Glossary Architect', description: 'Buat glosarium lengkap (≥20 entri) untuk 1 buku.', icon: '📋', tool: 'Glossary Builder', toolPath: '/glossary' },
      { id: 'c2_cultural', title: 'Cultural Explorer', description: 'Tambahkan 10 entri ke Cultural Context Library.', icon: '🏛️', tool: 'Cultural Context', toolPath: '/tools/cultural-context' },
      { id: 'c2_club', title: 'Club Leader', description: 'Buat atau pimpin diskusi di 1 Reading Club.', icon: '📚', tool: 'Reading Clubs', toolPath: '/clubs' },
    ],
    milestone: { badge: '📜 Keeper of Words', xpBonus: 500 }
  }
];

export function getJourneyByLevel(level: number): JourneyLevel | undefined {
  return JOURNEY_LEVELS.find(j => j.level === level);
}

export function getJourneyByCefr(cefr: string): JourneyLevel | undefined {
  return JOURNEY_LEVELS.find(j => j.cefr === cefr);
}
