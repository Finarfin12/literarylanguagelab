import { 
  BrainCircuit, Palette, BookMarked, GraduationCap, 
  Headphones, Languages, MessageSquare, History, Users 
} from "lucide-react";

export const MENU_GROUPS = [
  {
    title: "LingoWise",
    icon: BrainCircuit,
    color: "text-brand",
    items: [
      { name: "OCR Lens", path: "/library/add/ocr" },
      { name: "Dialect Diver", path: "/tools/dialect-diver" },
      { name: "Tone & Grammar", path: "/tools/tone-analyzer" },
      { name: "Tone Detector", path: "/tools/tone-detector" },
      { name: "Vibe Translator", path: "/tools/vibe-translator" },
      { name: "Mood Transformer", path: "/tools/mood-transformer" },
      { name: "Diction Lab", path: "/tools/diction-lab" },
      { name: "Era Translator", path: "/tools/era-translator" },
      { name: "Sentence Architect", path: "/tools/sentence-architect" },
      { name: "Rhetorical Spotter", path: "/tools/rhetorical-spotter" },
      { name: "Alter Ego Chat", path: "/tools/alter-ego" },
    ]
  },
  {
    title: "LinguaVisual",
    icon: Palette,
    color: "text-purple-400",
    items: [
      { name: "Imagery Sketcher", path: "/tools/imagery-sketcher" },
      { name: "Semantic Visual", path: "/tools/semantic-visual" },
      { name: "Poem to Palette", path: "/tools/poem-to-palette" },
      { name: "Sentiment Spectrum", path: "/tools/sentiment-spectrum" },
      { name: "Semantic Map", path: "/tools/semantic-map" },
    ]
  },
  {
    title: "Lexicon",
    icon: BookMarked,
    color: "text-amber-400",
    items: [
      { name: "Literary Synonyms", path: "/tools/literary-synonyms" },
      { name: "Cultural Context", path: "/tools/cultural-context" },
      { name: "Nuance Detector", path: "/tools/nuance-detector" },
      { name: "Metaphor Generator", path: "/tools/metaphor-generator" },
      { name: "Idiom & Metaphor Detector", path: "/tools/idiom-detector" },
      { name: "Time Traveler", path: "/tools/time-traveler" },
      { name: "Lexicon Search", path: "/tools/lexicon-search" },
      { name: "Vocabulary Bank", path: "/vocabulary" },
      { name: "Idiom Library", path: "/idioms" },
      { name: "Spaced Repetition", path: "/review" },
      { name: "Glossary Builder", path: "/glossary" },
      { name: "Untranslatables", path: "/tools/untranslatables" },
    ]
  },
  {
    title: "Study",
    icon: GraduationCap,
    color: "text-blue-400",
    items: [
      { name: "Side-by-Side Comparator", path: "/tools/comparator" },
      { name: "Difficulty Predictor", path: "/tools/difficulty-analyzer" },
      { name: "Paraphrase Challenge", path: "/tools/paraphrase" },
      { name: "Imagery Grader", path: "/tools/imagery-grader" },
      { name: "Character Monologue", path: "/tools/character-monologue" },
      { name: "Academic Outline", path: "/tools/academic-outline" },
      { name: "AI Writing Assistant", path: "/tools/writing-assistant" },
      { name: "Story Quiz", path: "/tools/story-quiz" },
      { name: "Plot Twist", path: "/tools/plot-twist" },
      { name: "Conflict Mapper", path: "/tools/conflict-mapper" },
      { name: "Critical Lens", path: "/tools/critical-lens" },
    ]
  },
  {
    title: "English Lab",
    icon: Headphones,
    color: "text-emerald-400",
    items: [
      { name: "Grammar Clinic", path: "/english-lab/grammar-clinic" },
      { name: "Flashcard SRS", path: "/english-lab/flashcard" },
      { name: "Dialogue Simulator", path: "/english-lab/dialogue-simulator" },
      { name: "Listening Test", path: "/english-lab/listening-test" },
      { name: "Pronunciation Clinic", path: "/tools/pronunciation-clinic" },
      { name: "Slang Decoder", path: "/english-lab/slang-decoder" },
      { name: "Placement Test", path: "/english-lab/placement-test" },
    ]
  },
  {
    title: "Translation Tools",
    icon: Languages,
    color: "text-cyan-400",
    items: [
      { name: "Translation Workshop", path: "/translation-workshop" },
      { name: "Translation Memory", path: "/translation-memory" },
      { name: "Parallel Text Mode", path: "/tools/parallel-text" },
      { name: "Weekly Challenge", path: "/tools/weekly-challenge" },
      { name: "Translation Timelapse", path: "/tools/translation-timelapse" },
    ]
  },
  {
    title: "Annotations",
    icon: MessageSquare,
    color: "text-yellow-400",
    items: [
      { name: "My Annotations", path: "/tools/annotations" },
    ]
  },
  {
    title: "History",
    icon: History,
    color: "text-foreground",
    items: [
      { name: "Archive & Insights", path: "/history" },
    ]
  },
  {
    title: "Forum & Community",
    icon: Users,
    color: "text-rose-400",
    items: [
      { name: "Discussion Board", path: "/forum" },
      { name: "Jejaring Pembaca", path: "/community" },
      { name: "Global Leaderboard", path: "/leaderboard" },
      { name: "Shared Annotations", path: "/community-annotations" },
      { name: "Translation Duels", path: "/duels" },
      { name: "Reading Clubs", path: "/clubs" },
    ]
  }
];
