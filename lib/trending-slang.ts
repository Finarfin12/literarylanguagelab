export interface TrendingSlang {
  phrase: string;
  category: "Gen Z" | "Internet" | "Gaming" | "Pop Culture" | "Business";
}

export const TRENDING_SLANG: TrendingSlang[] = [
  // Gen Z & Internet
  { phrase: "no cap", category: "Gen Z" },
  { phrase: "lowkey", category: "Gen Z" },
  { phrase: "highkey", category: "Gen Z" },
  { phrase: "mid", category: "Gen Z" },
  { phrase: "sus", category: "Gen Z" },
  { phrase: "bussin", category: "Gen Z" },
  { phrase: "rizz", category: "Gen Z" },
  { phrase: "slay", category: "Gen Z" },
  { phrase: "rent free", category: "Internet" },
  { phrase: "touch grass", category: "Internet" },
  { phrase: "based", category: "Internet" },
  { phrase: "ghosting", category: "Internet" },
  { phrase: "FOMO", category: "Internet" },
  { phrase: "TL;DR", category: "Internet" },
  { phrase: "IYKYK", category: "Internet" },
  { phrase: "main character energy", category: "Internet" },
  { phrase: "red flag", category: "Internet" },
  { phrase: "green flag", category: "Internet" },
  
  // Gaming
  { phrase: "AFK", category: "Gaming" },
  { phrase: "GG", category: "Gaming" },
  { phrase: "nerf", category: "Gaming" },
  { phrase: "buff", category: "Gaming" },
  { phrase: "lag", category: "Gaming" },
  
  // Pop Culture & General
  { phrase: "spill the tea", category: "Pop Culture" },
  { phrase: "throw shade", category: "Pop Culture" },
  { phrase: "stan", category: "Pop Culture" },
  { phrase: "gatekeep", category: "Pop Culture" },
  { phrase: "gaslight", category: "Pop Culture" },
  { phrase: "glow up", category: "Pop Culture" },
  
  // Business (Bonus for context)
  { phrase: "circle back", category: "Business" },
  { phrase: "bandwidth", category: "Business" },
  { phrase: "synergy", category: "Business" },
  { phrase: "deep dive", category: "Business" },
];
