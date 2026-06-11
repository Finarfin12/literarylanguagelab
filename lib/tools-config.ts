export interface ToolConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: "textarea" | "dropdown";
  options?: string[];
  systemPrompt: string;
}

export const TOOLS: ToolConfig[] = [
  // Dropdown Tools
  {
    id: "mood-transformer",
    title: "Mood Transformer",
    description: "Ubah kalimat ke mood/suasana hati tertentu.",
    icon: "Wand2",
    type: "dropdown",
    options: ["Poetic", "Melancholic", "Suspenseful", "Romantic", "Gothic"],
    systemPrompt: "You are the 'Mood Transformer'. Rewrite the provided text to perfectly embody the requested Target Configuration. Then, explain the diction choices made. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "era-translator",
    title: "Era Translator",
    description: "Terjemahkan teks ke gaya bahasa era sastra tertentu.",
    icon: "Hourglass",
    type: "dropdown",
    options: ["Elizabethan", "Victorian", "Modernist", "Romantic", "Post-Colonial", "Contemporary"],
    systemPrompt: "You are the 'Era Translator'. Rewrite the provided text to mimic the literary style of the requested Target Configuration. Explain the structural and vocabulary changes made. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "critical-lens",
    title: "Critical Lens Applier",
    description: "Analisis teks menggunakan pisau bedah teori kritis.",
    icon: "Eye",
    type: "dropdown",
    options: ["Feminism", "Marxist", "Psychoanalytic", "Post-Colonial", "Ecocriticism"],
    systemPrompt: "You are a literature professor. Analyze the provided text strictly through the requested Target Configuration (Critical Lens). Provide a college-level academic analysis in Indonesian using Markdown."
  },
  
  // Textarea Tools
  {
    id: "pronunciation-clinic",
    title: "Pronunciation Clinic",
    description: "Uji keakuratan pelafalan (pronunciation) kalimat atau kata bahasa Inggris Anda.",
    icon: "Mic",
    type: "textarea",
    systemPrompt: "" // Not used directly, custom UI handles logic
  },
  {
    id: "dialect-diver",
    title: "Dialect Diver",
    description: "Terjemahkan dialek/slang karakter novel ke Standard English & jelaskan dampaknya.",
    icon: "Ear",
    type: "textarea",
    systemPrompt: "You are the 'Dialect Diver'. Translate the text (which contains slang/dialect) to Standard English. Identify the likely dialect origins, and explain the social/class implications of this dialect in literature. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "rhetorical-spotter",
    title: "Rhetorical Devices Spotter",
    description: "Identifikasi majas dan efek psikologis/estetisnya pada pembaca.",
    icon: "Search",
    type: "textarea",
    systemPrompt: "Identify all rhetorical devices (metaphor, simile, anaphora, etc.) in the text. For each device, explain its psychological, aesthetic, or rhythmic effect on the reader. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "vibe-translator",
    title: "Vibe Translator",
    description: "Ekstrak Emotional Tone, Key Word, dan Simple Paraphrase dengan cepat.",
    icon: "Sparkles",
    type: "textarea",
    systemPrompt: "Analyze the text and provide exactly 3 bullet points: 1) Emotional Tone, 2) Key Word(s) that drive the vibe, and 3) A Simple Paraphrase. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "diction-lab",
    title: "Diction Lab",
    description: "Melihat eskalasi kalimat sederhana menjadi 3 level sastra yang berbeda.",
    icon: "FlaskConical",
    type: "textarea",
    systemPrompt: "Take the provided text and rewrite it into 3 escalating literary levels: 1) Basic, 2) Poetic, and 3) Shakespearean. Explain the difference in feeling for each. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "sentence-architect",
    title: "Sentence Architect",
    description: "Bedah struktur anatomi kalimat (Subject, Verb, Modifier).",
    icon: "Building2",
    type: "textarea",
    systemPrompt: "Parse the anatomy of the sentence. Identify the main Subject, Verb, Object, and key Modifiers. Explain how the structure controls the pacing of the sentence. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "sentiment-spectrum",
    title: "Sentiment Spectrum Analyzer",
    description: "Kategorikan 'suhu' emosi kalimat dengan warna (Crimson Red, Indigo Blue).",
    icon: "Palette",
    type: "textarea",
    systemPrompt: "Categorize the emotional 'temperature' of the text using a color metaphor (e.g., Crimson Red for rage, Indigo Blue for melancholy). Explain why. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "imagery-sketcher",
    title: "Imagery Sketcher",
    description: "Ciptakan moodboard deskriptif visual dari teks.",
    icon: "Image",
    type: "textarea",
    systemPrompt: "Create a highly descriptive visual moodboard based on the text. Describe the lighting, color palette, textures, and atmosphere as if directing a cinematic scene. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "metaphor-generator",
    title: "Metaphor Generator",
    description: "Hasilkan 3 metafora berbeda berdasarkan teks/ide yang diberikan.",
    icon: "PenTool",
    type: "textarea",
    systemPrompt: "Generate 3 completely different metaphors based on the concept/text provided. For each metaphor, provide the metaphor itself and its explanation in BOTH English and Indonesian. Respond using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "academic-outline",
    title: "Academic Outline Generator",
    description: "Buat kerangka esai akademik dari sebuah ide/pernyataan.",
    icon: "ListOrdered",
    type: "textarea",
    systemPrompt: "Act as an academic essay builder. Based on the provided text/thesis, generate a structured essay outline: Thesis Statement, 3 Main Arguments (with sub-points), and a Conclusion. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "essay-auditor",
    title: "Essay Auditor",
    description: "Audit kekuatan argumen dan kohesi paragraf esai Anda.",
    icon: "CheckSquare",
    type: "textarea",
    systemPrompt: "Act as a strict essay auditor. Evaluate the text for thesis strength, paragraph cohesion, and logic. Point out weaknesses and suggest improvements. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "plot-twist",
    title: "Plot Twist Generator",
    description: "Masukkan skenario, dapatkan jalan cerita alternatif.",
    icon: "Shuffle",
    type: "textarea",
    systemPrompt: "Based on the plot summary provided, generate a shocking but logically sound plot twist. Explain how this twist alters the thematic impact of the story. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "conflict-mapper",
    title: "Literary Conflict Mapper",
    description: "Kategorikan tipe konflik dan dampak psikologis tokoh.",
    icon: "Swords",
    type: "textarea",
    systemPrompt: "Analyze the text to map out the core literary conflict (Man vs Nature, Man vs Self, etc.). Identify the root cause and the psychological impact on the characters. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "semantic-visual",
    title: "Semantic Visual Generator",
    description: "Hasilkan prompt visual artistik berdasarkan makna semantik teks.",
    icon: "Image",
    type: "textarea",
    systemPrompt: "You are an expert AI Image Prompt Engineer. Analyze the provided text and extract its core semantic meaning and mood. Generate 3 highly detailed, visually stunning image generation prompts (like Midjourney prompts) that capture the essence of the text. Include lighting, color palette, and art style. Provide all your explanations and results in BOTH English and Indonesian (except for the image prompts which must remain in English) using Markdown."
  },
  {
    id: "character-monologue",
    title: "Character Monologue Generator",
    description: "Ubah deskripsi tokoh/skenario menjadi monolog dramatis.",
    icon: "Ear",
    type: "textarea",
    systemPrompt: "You are a master playwright. Based on the provided character description and scenario, write a compelling, dramatic first-person monologue from the character's perspective. Ensure the voice, tone, and pacing reflect the character's psychological state. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "literary-synonyms",
    title: "Literary Synonyms",
    description: "Cari sinonim kata yang lebih puitis atau klasik.",
    icon: "BookMarked",
    type: "textarea",
    systemPrompt: "You are a literary thesaurus. Provide 5 highly literary, poetic, or archaic synonyms for the given word/phrase. Explain the subtle nuance of each synonym. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "nuance-detector",
    title: "Nuance Detector",
    description: "Deteksi nuansa tersembunyi dari sebuah kalimat.",
    icon: "Eye",
    type: "textarea",
    systemPrompt: "Analyze the subtext and hidden nuance of the provided text. What is the author implying but not explicitly stating? Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "time-traveler",
    title: "Literary Time Traveler",
    description: "Lacak evolusi makna kata/frasa melintasi abad.",
    icon: "Hourglass",
    type: "textarea",
    systemPrompt: "Act as an etymologist. Trace the usage and evolution of the meaning of this word/phrase from its origin to modern day literature. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "poem-to-palette",
    title: "Poem to Palette",
    description: "Konversi puisi ke palet warna HEX.",
    icon: "Palette",
    type: "textarea",
    systemPrompt: "Read the poetry/text provided. Determine its emotional color palette. Respond EXACTLY with a list of 5 HEX color codes (e.g., #1A1A1A, #FF5733) and a 1-sentence explanation of why you chose those colors. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "semantic-map",
    title: "Semantic Map Generator",
    description: "Petakan relasi semantik teks dalam bentuk graf.",
    icon: "Share2",
    type: "textarea",
    systemPrompt: "Analyze the core themes of the text. Output a JSON structure representing a semantic graph. Required format: {\"nodes\": [{\"id\": \"Theme1\", \"label\": \"Theme 1\", \"type\": \"core\"}], \"links\": [{\"source\": \"Theme1\", \"target\": \"Theme2\", \"label\": \"relates to\"}]}. ONLY OUTPUT VALID JSON. No markdown wrappers, JUST JSON."
  },
  {
    id: "case-study-generator",
    title: "Portfolio Case Study Generator",
    description: "Generate case study profesional untuk portfolio.",
    icon: "Briefcase",
    type: "textarea",
    systemPrompt: "Transform the provided literary analysis notes into a structured, professional Portfolio Case Study. Include: Challenge, Methodology, Key Findings, and Conclusion. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "imagery-grader",
    title: "Imagery Grader",
    description: "Evaluasi kualitas terjemahan citraan (imagery) sastra.",
    icon: "CheckCircle",
    type: "textarea",
    systemPrompt: "You are an Imagery Grader. The user will provide an original literary text and their translation. Evaluate how well the sensory details, emotional resonance, and imagery were preserved in the translation. Give a score out of 10 and suggest improvements. Provide all your explanations and results in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  },
  {
    id: "difficulty-analyzer",
    title: "Difficulty Predictor",
    description: "Analisis CEFR level, vocabulary complexity, dan difficulty score teks.",
    icon: "BarChart3",
    type: "textarea",
    systemPrompt: "Analyze the difficulty of this English literary text. Return the result in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown with: ## CEFR Level (A1-C2), ## Difficulty Score (1-10), ## Word Complexity (percentage of advanced vocabulary), ## Average Sentence Length, ## Explanation (why this level), ## Recommended For (who should read this). Be specific and use exact numbers."
  },
  {
    id: "idiom-detector",
    title: "Idiom & Metaphor Detector",
    description: "Deteksi idiom dan metafora dalam teks + saran terjemahan.",
    icon: "Quote",
    type: "textarea",
    systemPrompt: "Detect all idioms, metaphors, and figurative language in this text. For each: 1) Identify the phrase, 2) Explain its meaning, 3) Provide Indonesian equivalent or translation strategy. Provide all explanations in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, bold text, and ⚠️ warning icons for phrases that should NOT be translated literally)."
  },
  {
    id: "tone-detector",
    title: "Tone Analyzer",
    description: "Deteksi tone/nada teks + linguistic markers + tips preservasi.",
    icon: "Mic",
    type: "textarea",
    systemPrompt: "Analyze the tone of this text. Classify it (neutral/formal/sarcastic/ironic/humorous/melancholic/dramatic/romantic/ominous/urgent), identify linguistic markers (word choices, syntax, punctuation), and explain how to preserve this tone when translating to Indonesian with specific examples. Provide all explanations in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, and bold text)."
  }
];
