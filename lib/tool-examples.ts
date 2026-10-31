// Contoh input singkat untuk tombol "Coba dengan contoh" di alat AI.
// Semua kutipan berasal dari karya domain publik atau ditulis sendiri.

const DICKENS = "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.";
const AUSTEN = "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.";
const FOG = "The fog came creeping in over the harbor, grey fingers curling around the masts of sleeping ships.";

export const TOOL_EXAMPLES: Record<string, string> = {
  "mood-transformer": "The rain fell on the empty street, and she walked home alone.",
  "era-translator": "I am very tired today, so I think I will go to bed early.",
  "critical-lens": "Elizabeth Bennet refuses a rich man's first proposal because he insulted her family and her class.",
  "dialect-diver": "You don't know about me without you have read a book by the name of The Adventures of Tom Sawyer; but that ain't no matter.",
  "rhetorical-spotter": DICKENS,
  "vibe-translator": AUSTEN,
  "diction-lab": "The man was sad because his friend left.",
  "sentence-architect": "The woman, who had been waiting for hours in the rain without an umbrella, finally decided to leave.",
  "sentiment-spectrum": DICKENS,
  "imagery-sketcher": FOG,
  "metaphor-generator": "Time passes quickly when you are happy.",
  "academic-outline": "Mary Shelley uses the creature in Frankenstein to question the ambition of science.",
  "essay-auditor": "Social media is bad. Many people use it. It wastes time. Therefore, schools should ban it completely.",
  "plot-twist": "A lighthouse keeper receives a letter every year from someone who signs only with the letter M.",
  "conflict-mapper": "Elizabeth Bennet dislikes Mr. Darcy after he insults her at a ball, but his pride and her prejudice slowly give way.",
  "semantic-visual": "The old house remembered every footstep that had ever crossed its floors.",
  "character-monologue": "An old sailor sits alone in a harbor tavern, remembering the ship that never came back.",
  "literary-synonyms": "sad",
  "nuance-detector": "She smiled politely and said she was fine.",
  "time-traveler": "nice",
  "poem-to-palette": "Because I could not stop for Death, He kindly stopped for me; The Carriage held but just Ourselves And Immortality.",
  "semantic-map": "The sea was calm, but beneath its silver surface the storm was gathering strength.",
  "case-study-generator": "A small bookstore in Bandung increased its sales by starting an online reading club.",
  "imagery-grader": FOG,
  "difficulty-analyzer": AUSTEN,
  "idiom-detector": "He kicked the bucket before he could spill the beans, and now the whole family is in hot water.",
};

/** Contoh untuk alat dengan halaman khusus. */
export const COMPARATOR_EXAMPLE = {
  original: AUSTEN,
  translation: "Sudah menjadi kebenaran yang diakui secara umum bahwa seorang pria lajang yang memiliki harta berlimpah pastilah membutuhkan seorang istri.",
};
export const TONE_ANALYZER_EXAMPLE = AUSTEN;
export const WRITING_ASSISTANT_EXAMPLE = "Yesterday I go to the library for borrow a book. The book was very interesting and I read it until midnight.";
export const LEXICON_EXAMPLE = "melancholy";
export const UNTRANSLATABLES_EXAMPLE = "wistful";
