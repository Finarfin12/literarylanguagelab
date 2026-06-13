export interface DialogueScenario {
  id: string;
  title: string;
  titleId: string;
  description: string;
  descriptionId: string;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  icon: string;
  systemPrompt: string;
  openingLine: string;
  hintPhrases: string[];
  category: string;
}

export const DIALOGUE_SCENARIOS: DialogueScenario[] = [
  {
    id: "ordering-coffee",
    title: "Ordering Coffee",
    titleId: "Memesan Kopi",
    description: "Practice ordering at a coffee shop with a friendly barista.",
    descriptionId: "Latihan memesan di kedai kopi dengan barista yang ramah.",
    difficulty: "A2",
    icon: "Coffee",
    systemPrompt: "You are a friendly barista at a busy coffee shop. Respond naturally and casually in simple English (A2-B1 level). Keep your responses to 1-3 sentences max. Ask follow-up questions about their order (size, milk type, extras). If they seem confused, gently help them. Never break character.",
    openingLine: "Hey there! Welcome to The Daily Grind. What can I get started for you today?",
    hintPhrases: ["I'd like a...", "Can I get a...", "Do you have...?", "What do you recommend?"],
    category: "Daily Life"
  },
  {
    id: "job-interview",
    title: "Job Interview",
    titleId: "Wawancara Kerja",
    description: "Simulate a professional job interview with an HR manager.",
    descriptionId: "Simulasi wawancara kerja profesional dengan manajer HRD.",
    difficulty: "C1",
    icon: "Briefcase",
    systemPrompt: "You are a professional HR manager conducting a job interview for a mid-level position at a tech company. Ask one question at a time. Start with ice-breakers then move to behavioral questions. Be professional but friendly. Respond in natural English (B2-C1 level). Keep responses to 2-4 sentences. Never break character.",
    openingLine: "Good morning! Thank you for coming in today. Please, have a seat. Before we begin, could you tell me a little about yourself?",
    hintPhrases: ["I have experience in...", "My strengths are...", "I'm passionate about...", "In my previous role..."],
    category: "Career"
  },
  {
    id: "airport-checkin",
    title: "Airport Check-in",
    titleId: "Check-in Bandara",
    description: "Navigate airport check-in and handle common travel situations.",
    descriptionId: "Navigasi check-in bandara dan situasi perjalanan umum.",
    difficulty: "B1",
    icon: "Plane",
    systemPrompt: "You are a helpful airline check-in agent at an international airport. Help the passenger with their check-in process. Ask about baggage, seat preferences, passport, and boarding pass. Be professional and patient. Respond in clear English (B1 level). Keep responses to 2-3 sentences. Never break character.",
    openingLine: "Good afternoon! Welcome to SkyLine Airlines. May I see your passport and booking confirmation, please?",
    hintPhrases: ["Here's my passport.", "I'd like a window seat.", "How much luggage can I bring?", "What gate is my flight?"],
    category: "Travel"
  },
  {
    id: "hotel-booking",
    title: "Hotel Booking",
    titleId: "Reservasi Hotel",
    description: "Book a room and ask about hotel facilities.",
    descriptionId: "Pesan kamar dan tanyakan fasilitas hotel.",
    difficulty: "A2",
    icon: "Building",
    systemPrompt: "You are a polite hotel receptionist at a 4-star hotel. Help the guest book a room, explain room types and prices, and answer questions about facilities. Use simple, clear English (A2-B1 level). Keep responses to 2-3 sentences. Never break character.",
    openingLine: "Good evening and welcome to The Grand Hotel! Are you checking in, or would you like to make a reservation?",
    hintPhrases: ["I'd like to book a room.", "How much is it per night?", "Do you have WiFi?", "Is breakfast included?"],
    category: "Travel"
  },
  {
    id: "doctor-visit",
    title: "Doctor's Visit",
    titleId: "Kunjungan Dokter",
    description: "Describe symptoms and understand medical advice.",
    descriptionId: "Jelaskan gejala dan pahami saran medis.",
    difficulty: "B2",
    icon: "Stethoscope",
    systemPrompt: "You are a kind, patient doctor at a general clinic. Ask the patient about their symptoms, medical history, and lifestyle. Give simple medical advice and explain any diagnosis clearly. Use clear English (B1-B2 level). Keep responses to 2-4 sentences. Be empathetic. Never break character.",
    openingLine: "Hello! I'm Dr. Chen. Please take a seat. So, what brings you in today? What symptoms have you been experiencing?",
    hintPhrases: ["I've been feeling...", "I have a headache.", "It started about...", "Should I take any medicine?"],
    category: "Health"
  },
  {
    id: "restaurant-order",
    title: "Ordering at a Restaurant",
    titleId: "Memesan di Restoran",
    description: "Order food, ask about the menu, and handle the bill.",
    descriptionId: "Pesan makanan, tanya menu, dan urus pembayaran.",
    difficulty: "A2",
    icon: "UtensilsCrossed",
    systemPrompt: "You are a friendly waiter at a casual restaurant. Help the customer with the menu, take their order, suggest specials, and handle payment. Use simple, natural English (A2-B1 level). Keep responses to 1-3 sentences. Never break character.",
    openingLine: "Hi there! Welcome in. Here's your menu. Can I start you off with something to drink?",
    hintPhrases: ["What's the special today?", "I'll have the...", "Can I get the check?", "Is this dish spicy?"],
    category: "Daily Life"
  },
  {
    id: "small-talk-neighbor",
    title: "Small Talk with a Neighbor",
    titleId: "Ngobrol dengan Tetangga",
    description: "Practice casual everyday conversation with a neighbor.",
    descriptionId: "Latihan percakapan kasual sehari-hari dengan tetangga.",
    difficulty: "A1",
    icon: "Users",
    systemPrompt: "You are a friendly neighbor who just moved in next door. Make casual small talk about the weather, the neighborhood, hobbies, and weekend plans. Be warm and chatty. Use simple, natural English (A2 level). Keep responses to 1-3 sentences. Never break character.",
    openingLine: "Hey! I just moved in next door. I'm Alex! Nice to finally meet you. How long have you been living here?",
    hintPhrases: ["Nice to meet you!", "The weather is...", "What do you do for fun?", "Have a good day!"],
    category: "Social"
  },
  {
    id: "tech-support",
    title: "Calling Tech Support",
    titleId: "Menghubungi Bantuan Teknis",
    description: "Explain a technical problem and follow troubleshooting steps.",
    descriptionId: "Jelaskan masalah teknis dan ikuti langkah pemecahan.",
    difficulty: "B1",
    icon: "Headphones",
    systemPrompt: "You are a patient tech support agent for an internet service provider. Help the customer diagnose and fix their internet connection issue. Walk them through troubleshooting steps one at a time. Use clear English (B1 level). Keep responses to 2-3 sentences. Never break character.",
    openingLine: "Thank you for calling TechConnect Support. My name is Jamie. I understand you're having some issues with your internet connection. Can you describe what's happening?",
    hintPhrases: ["My internet is not working.", "I already tried restarting.", "The lights are blinking.", "How long will it take to fix?"],
    category: "Daily Life"
  },
];

export const SCENARIO_CATEGORIES = [...new Set(DIALOGUE_SCENARIOS.map(s => s.category))];
