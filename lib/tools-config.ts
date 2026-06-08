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
    systemPrompt: "You are the 'Mood Transformer'. Rewrite the provided text to perfectly embody the requested Target Configuration. Then, explain the diction choices made. Respond in Indonesian using Markdown."
  },
  {
    id: "era-translator",
    title: "Era Translator",
    description: "Terjemahkan teks ke gaya bahasa era sastra tertentu.",
    icon: "Hourglass",
    type: "dropdown",
    options: ["Elizabethan", "Victorian", "Modernist", "Romantic", "Post-Colonial", "Contemporary"],
    systemPrompt: "You are the 'Era Translator'. Rewrite the provided text to mimic the literary style of the requested Target Configuration. Explain the structural and vocabulary changes made. Respond in Indonesian using Markdown."
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
    id: "dialect-diver",
    title: "Dialect Diver",
    description: "Terjemahkan dialek/slang karakter novel ke Standard English & jelaskan dampaknya.",
    icon: "Ear",
    type: "textarea",
    systemPrompt: "You are the 'Dialect Diver'. Translate the text (which contains slang/dialect) to Standard English. Identify the likely dialect origins, and explain the social/class implications of this dialect in literature. Respond in Indonesian using Markdown."
  },
  {
    id: "rhetorical-spotter",
    title: "Rhetorical Devices Spotter",
    description: "Identifikasi majas dan efek psikologis/estetisnya pada pembaca.",
    icon: "Search",
    type: "textarea",
    systemPrompt: "Identify all rhetorical devices (metaphor, simile, anaphora, etc.) in the text. For each device, explain its psychological, aesthetic, or rhythmic effect on the reader. Respond in Indonesian using Markdown."
  },
  {
    id: "vibe-translator",
    title: "Vibe Translator",
    description: "Ekstrak Emotional Tone, Key Word, dan Simple Paraphrase dengan cepat.",
    icon: "Sparkles",
    type: "textarea",
    systemPrompt: "Analyze the text and provide exactly 3 bullet points: 1) Emotional Tone, 2) Key Word(s) that drive the vibe, and 3) A Simple Paraphrase. Respond in Indonesian using Markdown."
  },
  {
    id: "diction-lab",
    title: "Diction Lab",
    description: "Melihat eskalasi kalimat sederhana menjadi 3 level sastra yang berbeda.",
    icon: "FlaskConical",
    type: "textarea",
    systemPrompt: "Take the provided text and rewrite it into 3 escalating literary levels: 1) Basic, 2) Poetic, and 3) Shakespearean. Explain the difference in feeling for each. Respond in Indonesian using Markdown."
  },
  {
    id: "sentence-architect",
    title: "Sentence Architect",
    description: "Bedah struktur anatomi kalimat (Subject, Verb, Modifier).",
    icon: "Building2",
    type: "textarea",
    systemPrompt: "Parse the anatomy of the sentence. Identify the main Subject, Verb, Object, and key Modifiers. Explain how the structure controls the pacing of the sentence. Respond in Indonesian using Markdown."
  },
  {
    id: "sentiment-spectrum",
    title: "Sentiment Spectrum Analyzer",
    description: "Kategorikan 'suhu' emosi kalimat dengan warna (Crimson Red, Indigo Blue).",
    icon: "Palette",
    type: "textarea",
    systemPrompt: "Categorize the emotional 'temperature' of the text using a color metaphor (e.g., Crimson Red for rage, Indigo Blue for melancholy). Explain why. Respond in Indonesian using Markdown."
  },
  {
    id: "imagery-sketcher",
    title: "Imagery Sketcher",
    description: "Ciptakan moodboard deskriptif visual dari teks.",
    icon: "Image",
    type: "textarea",
    systemPrompt: "Create a highly descriptive visual moodboard based on the text. Describe the lighting, color palette, textures, and atmosphere as if directing a cinematic scene. Respond in Indonesian using Markdown."
  },
  {
    id: "metaphor-generator",
    title: "Metaphor Generator",
    description: "Hasilkan 3 metafora berbeda berdasarkan teks/ide yang diberikan.",
    icon: "PenTool",
    type: "textarea",
    systemPrompt: "Generate 3 completely different metaphors based on the concept/text provided. Explain the hidden meaning and emotion of each metaphor. Respond in Indonesian using Markdown."
  },
  {
    id: "academic-outline",
    title: "Academic Outline Generator",
    description: "Buat kerangka esai akademik dari sebuah ide/pernyataan.",
    icon: "ListOrdered",
    type: "textarea",
    systemPrompt: "Act as an academic essay builder. Based on the provided text/thesis, generate a structured essay outline: Thesis Statement, 3 Main Arguments (with sub-points), and a Conclusion. Respond in Indonesian using Markdown."
  },
  {
    id: "essay-auditor",
    title: "Essay Auditor",
    description: "Audit kekuatan argumen dan kohesi paragraf esai Anda.",
    icon: "CheckSquare",
    type: "textarea",
    systemPrompt: "Act as a strict essay auditor. Evaluate the text for thesis strength, paragraph cohesion, and logic. Point out weaknesses and suggest improvements. Respond in Indonesian using Markdown."
  },
  {
    id: "plot-twist",
    title: "Plot Twist Generator",
    description: "Masukkan skenario, dapatkan jalan cerita alternatif.",
    icon: "Shuffle",
    type: "textarea",
    systemPrompt: "Based on the plot summary provided, generate a shocking but logically sound plot twist. Explain how this twist alters the thematic impact of the story. Respond in Indonesian using Markdown."
  },
  {
    id: "conflict-mapper",
    title: "Literary Conflict Mapper",
    description: "Kategorikan tipe konflik dan dampak psikologis tokoh.",
    icon: "Swords",
    type: "textarea",
    systemPrompt: "Analyze the text to map out the core literary conflict (Man vs Nature, Man vs Self, etc.). Identify the root cause and the psychological impact on the characters. Respond in Indonesian using Markdown."
  }
];
