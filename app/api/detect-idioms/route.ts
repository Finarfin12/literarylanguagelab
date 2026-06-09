import { NextResponse } from "next/server";

interface IdiomEntry {
  phrase: string;
  meaning: string;
  indonesian: string;
  pattern: RegExp;
}

function buildPhraseRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = escaped.replace(/\\'?s\b/g, "'?s").replace(/\bsomeone\b/g, "(?:someone|somebody|him|her|me|them|us)");
  return new RegExp("\\b" + pattern.replace(/\s+/g, "\\s+") + "\\b", "i");
}

const IDIOM_DB: IdiomEntry[] = (() => {
  const raw: Omit<IdiomEntry, "pattern">[] = [
    { phrase: "break the ice", meaning: "to initiate conversation in a social setting", indonesian: "mencairkan suasana" },
    { phrase: "let the cat out of the bag", meaning: "to reveal a secret unintentionally", indonesian: "membocorkan rahasia" },
    { phrase: "hit the nail on the head", meaning: "to describe exactly what is causing a situation", indonesian: "tepat sekali / pas mengenai sasaran" },
    { phrase: "piece of cake", meaning: "something very easy to do", indonesian: "sangat mudah" },
    { phrase: "spill the beans", meaning: "to reveal secret information", indonesian: "membocorkan rahasia" },
    { phrase: "cost an arm and a leg", meaning: "to be very expensive", indonesian: "sangat mahal" },
    { phrase: "under the weather", meaning: "feeling ill or sick", indonesian: "kurang enak badan" },
    { phrase: "once in a blue moon", meaning: "something that happens very rarely", indonesian: "sangat jarang terjadi" },
    { phrase: "bite the bullet", meaning: "to endure a painful experience bravely", indonesian: "menghadapi kenyataan pahit dengan berani" },
    { phrase: "beat around the bush", meaning: "to avoid talking about the main topic", indonesian: "berbelit-belit / tidak langsung ke inti" },
    { phrase: "call it a day", meaning: "to stop working on something", indonesian: "cukup untuk hari ini" },
    { phrase: "cut to the chase", meaning: "to get to the point", indonesian: "langsung ke intinya" },
    { phrase: "raining cats and dogs", meaning: "raining very heavily", indonesian: "hujan deras sekali" },
    { phrase: "blessing in disguise", meaning: "something that seems bad but turns out good", indonesian: "berkah tersembunyi" },
    { phrase: "barking up the wrong tree", meaning: "pursuing the wrong course of action", indonesian: "salah sasaran / salah orang" },
    { phrase: "burning the midnight oil", meaning: "working late into the night", indonesian: "bekerja sampai larut malam" },
    { phrase: "get out of hand", meaning: "to become uncontrollable", indonesian: "menjadi tidak terkendali" },
    { phrase: "keep an eye on", meaning: "to watch or monitor something", indonesian: "mengawasi / memperhatikan" },
    { phrase: "pull someone's leg", meaning: "to tease or joke with someone", indonesian: "bercanda / mengerjai" },
    { phrase: "take it with a grain of salt", meaning: "to not take something too seriously", indonesian: "jangan terlalu serius menanggapinya" },
    { phrase: "the elephant in the room", meaning: "an obvious problem that no one wants to discuss", indonesian: "masalah besar yang sengaja diabaikan" },
    { phrase: "throw in the towel", meaning: "to give up or admit defeat", indonesian: "menyerah" },
    { phrase: "up in the air", meaning: "uncertain or undecided", indonesian: "belum pasti" },
    { phrase: "cross that bridge when we come to it", meaning: "to deal with a problem when it arises", indonesian: "hadapi nanti saat saatnya tiba" },
    { phrase: "devil's advocate", meaning: "arguing against something for debate's sake", indonesian: "sengaja berdebat untuk menguji argumen" },
    { phrase: "kill two birds with one stone", meaning: "achieve two things with one action", indonesian: "sekali mendayung, dua tiga pulau terlampaui" },
    { phrase: "at the drop of a hat", meaning: "immediately, without hesitation", indonesian: "segera / tanpa ragu" },
    { phrase: "hit the books", meaning: "to study hard", indonesian: "belajar dengan giat" },
    { phrase: "a dime a dozen", meaning: "very common, nothing special", indonesian: "biasa saja / banyak yang seperti itu" },
    { phrase: "actions speak louder than words", meaning: "what you do matters more than what you say", indonesian: "perbuatan lebih berarti daripada kata-kata" },
    { phrase: "add fuel to the fire", meaning: "to make a bad situation worse", indonesian: "memperkeruh suasana" },
    { phrase: "back to the drawing board", meaning: "to start over after a failure", indonesian: "mulai dari awal lagi" },
    { phrase: "ball is in your court", meaning: "it's your turn to take action", indonesian: "sekarang giliranmu" },
    { phrase: "bend over backwards", meaning: "to try very hard to help or please someone", indonesian: "berusaha mati-matian" },
    { phrase: "bite off more than you can chew", meaning: "to take on more than you can handle", indonesian: "mengambil tanggung jawab di luar kemampuan" },
    { phrase: "blow off steam", meaning: "to release anger or frustration", indonesian: "melampiaskan kekesalan" },
    { phrase: "break a leg", meaning: "good luck (theatre expression)", indonesian: "semoga sukses" },
    { phrase: "burn bridges", meaning: "to destroy relationships permanently", indonesian: "memutus hubungan baik-baik" },
    { phrase: "by the skin of your teeth", meaning: "barely, by a very narrow margin", indonesian: "nyaris tidak berhasil" },
    { phrase: "call it a night", meaning: "to stop an activity for the rest of the night", indonesian: "cukup untuk malam ini" },
    { phrase: "can't judge a book by its cover", meaning: "don't judge based on appearance alone", indonesian: "jangan menilai dari luarnya saja" },
    { phrase: "cry over spilled milk", meaning: "to be upset about something that can't be undone", indonesian: "menyesali yang sudah terjadi" },
    { phrase: "cut corners", meaning: "to do something poorly to save time or money", indonesian: "mengambil jalan pintas" },
    { phrase: "cut someone some slack", meaning: "to be less critical of someone", indonesian: "jangan terlalu keras pada seseorang" },
    { phrase: "don't count your chickens before they hatch", meaning: "don't assume success too early", indonesian: "jangan berandai-andai terlalu cepat" },
    { phrase: "down to earth", meaning: "practical, realistic, humble", indonesian: "rendah hati dan praktis" },
    { phrase: "draw the line", meaning: "to set a limit or boundary", indonesian: "menetapkan batasan" },
    { phrase: "easy come easy go", meaning: "things gained easily are often lost easily", indonesian: "mudah datang mudah pergi" },
    { phrase: "every cloud has a silver lining", meaning: "every bad situation has a positive side", indonesian: "setiap kesulitan pasti ada hikmahnya" },
    { phrase: "face the music", meaning: "to accept the consequences of your actions", indonesian: "menghadapi konsekuensi" },
    { phrase: "feel under the weather", meaning: "to feel ill or unwell", indonesian: "kurang sehat" },
    { phrase: "fish out of water", meaning: "someone uncomfortable in their surroundings", indonesian: "canggung di lingkungan asing" },
    { phrase: "give the benefit of the doubt", meaning: "to trust someone without proof", indonesian: "percaya dulu tanpa bukti" },
    { phrase: "go back to the drawing board", meaning: "to restart planning after failure", indonesian: "merencanakan ulang dari awal" },
    { phrase: "hit the sack", meaning: "to go to bed", indonesian: "pergi tidur" },
    { phrase: "hit the hay", meaning: "to go to sleep", indonesian: "tidur" },
    { phrase: "in the heat of the moment", meaning: "acting impulsively due to strong emotions", indonesian: "dalam keadaan emosi" },
    { phrase: "it takes two to tango", meaning: "both parties are responsible for a situation", indonesian: "kedua belah pihak sama-sama bertanggung jawab" },
    { phrase: "jump on the bandwagon", meaning: "to follow a popular trend", indonesian: "ikut-ikutan tren" },
    { phrase: "keep your chin up", meaning: "to stay positive during difficult times", indonesian: "tetap semangat / jangan menyerah" },
    { phrase: "last straw", meaning: "the final problem that causes a reaction", indonesian: "puncak kesabaran" },
    { phrase: "leave no stone unturned", meaning: "to search thoroughly", indonesian: "mencari sampai ke pelosok" },
    { phrase: "let sleeping dogs lie", meaning: "to not disturb a problematic situation", indonesian: "jangan mengungkit masalah lama" },
    { phrase: "like two peas in a pod", meaning: "very similar, especially in appearance", indonesian: "sangat mirip / seperti pinang dibelah dua" },
    { phrase: "make a long story short", meaning: "to summarize briefly", indonesian: "singkat cerita" },
    { phrase: "miss the boat", meaning: "to miss an opportunity", indonesian: "kehilangan kesempatan" },
    { phrase: "not a rocket science", meaning: "not difficult to understand", indonesian: "tidak sulit / bukan ilmu roket" },
    { phrase: "off the top of my head", meaning: "from memory without checking", indonesian: "dari ingatan saja" },
    { phrase: "on the ball", meaning: "alert and competent", indonesian: "sigap dan cekatan" },
    { phrase: "on thin ice", meaning: "in a risky or dangerous situation", indonesian: "dalam situasi berbahaya" },
    { phrase: "once bitten twice shy", meaning: "cautious after being hurt once", indonesian: "trauma setelah pengalaman buruk" },
    { phrase: "out of the blue", meaning: "unexpectedly without warning", indonesian: "tiba-tiba tanpa diduga" },
    { phrase: "play devil's advocate", meaning: "to argue the opposite for debate's sake", indonesian: "sengaja berdebat dari sisi berlawanan" },
    { phrase: "pull yourself together", meaning: "to regain composure", indonesian: "tenangkan diri" },
    { phrase: "put all your eggs in one basket", meaning: "to risk everything on one venture", indonesian: "mempertaruhkan segalanya pada satu hal" },
    { phrase: "rain on someone's parade", meaning: "to spoil someone's plans or happiness", indonesian: "merusak kebahagiaan seseorang" },
    { phrase: "read between the lines", meaning: "to understand the hidden meaning", indonesian: "memahami makna tersirat" },
    { phrase: "ring a bell", meaning: "to sound familiar", indonesian: "terdengar familiar" },
    { phrase: "rock the boat", meaning: "to disturb a stable situation", indonesian: "mengganggu kestabilan" },
    { phrase: "save for a rainy day", meaning: "to save money for future hard times", indonesian: "menabung untuk masa sulit" },
    { phrase: "see eye to eye", meaning: "to agree completely", indonesian: "sepakat sepenuhnya" },
    { phrase: "sit on the fence", meaning: "to be undecided or neutral", indonesian: "tidak memihak" },
    { phrase: "snowed under", meaning: "overwhelmed with work", indonesian: "kebanjiran pekerjaan" },
    { phrase: "steal someone's thunder", meaning: "to take credit for someone else's achievement", indonesian: "mencuri pujian orang lain" },
    { phrase: "straight from the horse's mouth", meaning: "from the original or most reliable source", indonesian: "langsung dari sumber terpercaya" },
    { phrase: "take the bull by the horns", meaning: "to confront a problem directly", indonesian: "menghadapi masalah langsung" },
    { phrase: "the ball is in your court", meaning: "your turn to make a decision", indonesian: "keputusan ada padamu" },
    { phrase: "the best thing since sliced bread", meaning: "an excellent new invention", indonesian: "penemuan yang luar biasa" },
    { phrase: "the whole nine yards", meaning: "everything, the entire amount", indonesian: "segalanya / seluruhnya" },
    { phrase: "through thick and thin", meaning: "through good times and bad times", indonesian: "dalam suka dan duka" },
    { phrase: "time flies", meaning: "time passes very quickly", indonesian: "waktu berlalu cepat" },
    { phrase: "to make matters worse", meaning: "to worsen an already bad situation", indonesian: "yang lebih parah lagi" },
    { phrase: "tongue in cheek", meaning: "said ironically, not meant seriously", indonesian: "bercanda / tidak serius" },
    { phrase: "turn a blind eye", meaning: "to ignore something intentionally", indonesian: "pura-pura tidak melihat" },
    { phrase: "turn over a new leaf", meaning: "to start fresh, change for the better", indonesian: "memulai hidup baru" },
    { phrase: "water under the bridge", meaning: "past events that are no longer important", indonesian: "masa lalu yang sudah berlalu" },
    { phrase: "wear your heart on your sleeve", meaning: "to show emotions openly", indonesian: "menunjukkan perasaan secara terbuka" },
    { phrase: "when pigs fly", meaning: "something that will never happen", indonesian: "sesuatu yang mustahil terjadi" },
    { phrase: "wild goose chase", meaning: "a futile search or pursuit", indonesian: "usaha yang sia-sia" },
    { phrase: "you can say that again", meaning: "I completely agree with you", indonesian: "saya setuju sekali" },
    { phrase: "a blessing in disguise", meaning: "something that seems bad but turns out good", indonesian: "berkah tersembunyi" },
    { phrase: "a penny for your thoughts", meaning: "what are you thinking about?", indonesian: "apa yang sedang kamu pikirkan?" },
    { phrase: "ace in the hole", meaning: "a hidden advantage or resource", indonesian: "kartu truf / keunggulan tersembunyi" },
    { phrase: "as fit as a fiddle", meaning: "in excellent physical condition", indonesian: "sangat sehat dan bugar" },
    { phrase: "bells and whistles", meaning: "extra features or decorations", indonesian: "fitur tambahan" },
    { phrase: "between a rock and a hard place", meaning: "facing two difficult choices", indonesian: "terjepit di antara dua pilihan sulit" },
    { phrase: "bite the dust", meaning: "to fail or die", indonesian: "gagal total / mati" },
    { phrase: "break a sweat", meaning: "to exert oneself physically", indonesian: "berkeringat / bekerja keras" },
    { phrase: "burst your bubble", meaning: "to disappoint or shatter an illusion", indonesian: "menghancurkan harapan" },
    { phrase: "cat got your tongue", meaning: "why are you not speaking?", indonesian: "kenapa diam saja?" },
    { phrase: "caught between two stools", meaning: "unable to decide between two options", indonesian: "serba salah memilih" },
    { phrase: "chew the fat", meaning: "to chat informally", indonesian: "ngobrol santai" },
    { phrase: "close but no cigar", meaning: "nearly successful but ultimately failed", indonesian: "hampir berhasil tapi gagal" },
    { phrase: "come rain or shine", meaning: "no matter what happens", indonesian: "apapun yang terjadi" },
    { phrase: "crack someone up", meaning: "to make someone laugh hard", indonesian: "membuat tertawa terbahak-bahak" },
    { phrase: "curiosity killed the cat", meaning: "being too curious can lead to trouble", indonesian: "terlalu ingin tahu bisa berbahaya" },
    { phrase: "cut the mustard", meaning: "to meet expectations or standards", indonesian: "memenuhi standar" },
    { phrase: "dead as a doornail", meaning: "completely dead or inactive", indonesian: "benar-benar mati" },
    { phrase: "don't give up the day job", meaning: "you're not very good at this", indonesian: "jangan berhenti dari pekerjaan utamamu" },
    { phrase: "don't put all your eggs in one basket", meaning: "don't risk everything on one thing", indonesian: "jangan pertaruhkan semuanya" },
    { phrase: "down in the dumps", meaning: "feeling very sad or depressed", indonesian: "sangat sedih / murung" },
    { phrase: "drive someone up the wall", meaning: "to greatly annoy or irritate someone", indonesian: "membuat sangat kesal" },
    { phrase: "every dog has its day", meaning: "everyone has their moment of success", indonesian: "setiap orang punya masa kejayaan" },
    { phrase: "fair and square", meaning: "honest and straightforward", indonesian: "jujur dan adil" },
    { phrase: "fall on deaf ears", meaning: "to be ignored", indonesian: "diabaikan begitu saja" },
    { phrase: "feeling blue", meaning: "feeling sad or depressed", indonesian: "merasa sedih" },
    { phrase: "get your act together", meaning: "to organize yourself better", indonesian: "bereskan dirimu" },
    { phrase: "give the cold shoulder", meaning: "to ignore or be unfriendly to someone", indonesian: "mendiamkan / mengacuhkan" },
    { phrase: "go down in flames", meaning: "to fail spectacularly", indonesian: "gagal total" },
    { phrase: "green light", meaning: "permission to proceed", indonesian: "izin untuk melanjutkan" },
    { phrase: "have a bone to pick", meaning: "to have a complaint to discuss", indonesian: "ada masalah yang perlu dibicarakan" },
    { phrase: "head over heels", meaning: "completely in love", indonesian: "jatuh cinta setengah mati" },
    { phrase: "hit the ground running", meaning: "to start something with great energy", indonesian: "langsung bekerja dengan semangat" },
    { phrase: "hold your horses", meaning: "wait a moment, be patient", indonesian: "sabar dulu / tunggu sebentar" },
    { phrase: "in a nutshell", meaning: "in summary, briefly", indonesian: "singkatnya" },
    { phrase: "it's not over till the fat lady sings", meaning: "don't assume the outcome until it's finished", indonesian: "jangan berasumsi sebelum semuanya selesai" },
    { phrase: "jump the gun", meaning: "to act prematurely", indonesian: "bertindak terlalu cepat" },
    { phrase: "kick the bucket", meaning: "to die", indonesian: "meninggal" },
    { phrase: "knock on wood", meaning: "to hope for good luck to continue", indonesian: "semoga tidak sial" },
    { phrase: "let the chips fall where they may", meaning: "accept whatever happens", indonesian: "terima apapun hasilnya" },
    { phrase: "live and learn", meaning: "learn from experience", indonesian: "belajar dari pengalaman" },
    { phrase: "loose cannon", meaning: "an unpredictable and dangerous person", indonesian: "orang yang tidak bisa diprediksi" },
    { phrase: "lose your touch", meaning: "to lose a skill you once had", indonesian: "kehilangan kemampuan" },
    { phrase: "mum's the word", meaning: "keep it a secret, say nothing", indonesian: "jangan bilang siapa-siapa" },
    { phrase: "nip it in the bud", meaning: "to stop a problem early", indonesian: "hentikan masalah sebelum membesar" },
    { phrase: "no pain no gain", meaning: "you must work hard for results", indonesian: "berakit-rakit ke hulu, berenang-renang ke tepian" },
    { phrase: "off the record", meaning: "unofficial, not for publication", indonesian: "tidak resmi / off the record" },
    { phrase: "on cloud nine", meaning: "extremely happy", indonesian: "sangat bahagia" },
    { phrase: "on the fence", meaning: "undecided between two options", indonesian: "ragu-ragu" },
    { phrase: "out of the frying pan into the fire", meaning: "from a bad situation to a worse one", indonesian: "keluar dari mulut buaya masuk mulut harimau" },
    { phrase: "over my dead body", meaning: "I will never allow this", indonesian: "tidak akan pernah selama aku masih hidup" },
    { phrase: "par for the course", meaning: "normal, expected", indonesian: "biasa saja / sudah diduga" },
    { phrase: "play it by ear", meaning: "to decide as events unfold", indonesian: "putuskan nanti sesuai situasi" },
    { phrase: "pot calling the kettle black", meaning: "criticizing someone for a fault you also have", indonesian: "menuding padahal diri sendiri sama" },
    { phrase: "put your foot down", meaning: "to assert authority firmly", indonesian: "bersikap tegas" },
    { phrase: "red herring", meaning: "a misleading clue or distraction", indonesian: "petunjuk menyesatkan" },
    { phrase: "right off the bat", meaning: "immediately, from the start", indonesian: "langsung sejak awal" },
    { phrase: "rule of thumb", meaning: "a general principle based on experience", indonesian: "aturan praktis / patokan umum" },
    { phrase: "saved by the bell", meaning: "rescued by a timely interruption", indonesian: "terselamatkan oleh interupsi tepat waktu" },
    { phrase: "silver lining", meaning: "a positive aspect in a bad situation", indonesian: "sisi positif dari kesulitan" },
    { phrase: "skeleton in the closet", meaning: "a hidden secret from the past", indonesian: "rahasia kelam yang disembunyikan" },
    { phrase: "smell a rat", meaning: "to suspect something is wrong", indonesian: "mencurigai ada yang tidak beres" },
    { phrase: "so far so good", meaning: "things are going well up to this point", indonesian: "sejauh ini baik-baik saja" },
    { phrase: "spitting image", meaning: "exact likeness, very similar appearance", indonesian: "sangat mirip" },
    { phrase: "stab someone in the back", meaning: "to betray someone", indonesian: "mengkhianati" },
    { phrase: "sweet tooth", meaning: "a liking for sweet foods", indonesian: "suka makanan manis" },
    { phrase: "take a rain check", meaning: "to postpone an offer", indonesian: "tunda dulu" },
    { phrase: "the whole shebang", meaning: "everything, the entire thing", indonesian: "segalanya" },
    { phrase: "through the grapevine", meaning: "via informal gossip or rumors", indonesian: "lewat kabar angin / desas-desus" },
    { phrase: "tie the knot", meaning: "to get married", indonesian: "menikah" },
    { phrase: "twist someone's arm", meaning: "to persuade forcefully", indonesian: "membujuk dengan paksa" },
    { phrase: "up the ante", meaning: "to increase the stakes or demands", indonesian: "menaikkan taruhan" },
    { phrase: "wet behind the ears", meaning: "inexperienced, naive", indonesian: "masih hijau / belum berpengalaman" },
    { phrase: "white elephant", meaning: "an expensive but useless possession", indonesian: "barang mewah yang tidak berguna" },
    { phrase: "win hands down", meaning: "to win very easily", indonesian: "menang dengan mudah" },
    { phrase: "wolf in sheep's clothing", meaning: "someone dangerous who pretends to be harmless", indonesian: "musuh dalam selimut" },
    { phrase: "you can't have your cake and eat it too", meaning: "you can't have two incompatible things", indonesian: "tidak bisa mendapatkan dua hal sekaligus yang bertentangan" },
    { phrase: "zig when you should zag", meaning: "to make a wrong decision", indonesian: "salah langkah" },
  ];
  return raw.map((entry) => ({ ...entry, pattern: buildPhraseRegex(entry.phrase) }));
})();

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const matches: { phrase: string; meaning: string; indonesian: string; index: number }[] = [];

    IDIOM_DB.forEach((idiom) => {
      let match: RegExpExecArray | null;
      const re = new RegExp(idiom.pattern.source, "gi");
      while ((match = re.exec(text)) !== null) {
        matches.push({
          phrase: idiom.phrase,
          meaning: idiom.meaning,
          indonesian: idiom.indonesian,
          index: match.index,
        });
      }
    });

    matches.sort((a, b) => a.index - b.index);

    return NextResponse.json({ idioms: matches });
  } catch (err: unknown) {
    console.error("Idiom detection error:", err);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}
