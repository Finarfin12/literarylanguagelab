## Layer 3 — Translation-Specific (Differentiator)

**Definisi:** Tools yang **sangat spesifik untuk kebutuhan mahasiswa penerjemahan**. Ini yang bikin LLL bukan sekadar "language learning app", tapi **translation learning platform**.

**Prioritas:** P1-P2 (post-MVP, tapi ini killer feature)  
**User expectation:** "Wow, ini persis yang saya butuhin buat tugas translate"

### Fitur:

#### 3.1 Equivalence Checker

**Problem:** Mahasiswa penerjemahan sering bingung: "Apakah terjemahan saya sudah equivalent secara makna?"

**Solution:**
- Input: teks Inggris + terjemahan Indonesia
- AI analisis:
  - Semantic equivalence (apakah makna inti sama?)
  - Pragmatic equivalence (apakah fungsi komunikatif sama?)
  - Dynamic equivalence (apakah efek pada pembaca sama?)
  - Formal equivalence (apakah struktur dipertahankan?)
- Output: skor + highlight bagian yang bermasalah + saran

**Use case:**
> Original: "The moon hung low, a silver coin in the velvet night."
> 
> Terjemahan 1: "Bulan tergantung rendah, koin perak di malam beludru."
> Terjemahan 2: "Bulan tampak rendah, seperti keping perak di langit malam yang kelam."
> 
> AI feedback:
> - Terjemahan 1: struktur terlalu literal, "tergantung" aneh, "malam beludru" kaku
> - Terjemahan 2: lebih natural, "seperti" eksplisit tapi lebih readable

#### 3.2 Register Matcher

**Problem:** Teks sumber formal, terjemahan malah jadi casual (atau sebaliknya)

**Solution:**
- AI deteksi register teks Inggris (archaic/formal/literary/neutral/colloquial)
- AI deteksi register terjemahan Indonesia
- Kasih warning jika mismatch + saran koreksi

**Use case:**
> Original: "Thou art most beauteous in thy splendor." (archaic)
> Terjemahan: "Kamu cantik banget." (casual)
> 
> AI: ⚠️ Register mismatch. Original uses archaic formal language. Suggested: "Engkau sangat cantik dalam kemegahanmu."

#### 3.3 Untranslatables Explorer

**Problem:** Ada kata/konsep yang tidak punya padanan langsung (misal: "wistful", "serendipity", "schadenfreude")

**Solution:**
- Database kata-kata untranslatable
- Strategi penerjemahan:
  - Deskriptif (jelaskan dalam kalimat)
  - Borrowing (pakai kata asli + footnote)
  - Cultural equivalent (cari padanan kultural)
  - Modulation (ubah sudut pandang)
- Contoh dari karya terjemahan profesional

**Use case:**
> Word: "wistful"
> 
> Strategies:
> 1. Deskriptif: "penuh kerinduan yang samar" (kehilangan nuansa brevity)
> 2. Borrowing: "wistful" + footnote "penuh kerinduan lembut pada masa lalu"
> 3. Contextual: tergantung kalimat, bisa jadi "rindu", "melankolis", atau "nostalgia lembut"
> 
> Professional examples:
> - Translator A: "kerinduan yang halus"
> - Translator B: "rindu yang samar-samar"

#### 3.4 Back-Translation Tester

**Problem:** Mahasiswa tidak yakin apakah terjemahan mereka akurat

**Solution:**
- User input terjemahan Indonesia
- AI terjemahkan balik ke Inggris (back-translation)
- Bandingkan dengan teks asli
- Highlight perbedaan makna

**Use case:**
> Original: "She gazed at the horizon, lost in thought."
> User translation: "Dia menatap ufuk, tenggelam dalam pemikiran."
> Back-translation: "She stared at the horizon, drowned in thoughts."
> 
> AI feedback:
> - "gazed" (soft, contemplative) → "stared" (more intense) — nuansa berubah
> - "lost in thought" (idiom) → "drowned in thoughts" (lebih dramatis)
> - Suggested: "Dia memandangi ufuk, larut dalam lamunan." → back to "She gazed at the horizon, absorbed in reverie." (closer)

#### 3.5 Translation Memory

**Problem:** User sering translate frasa/idiom yang sama berulang kali, tapi lupa pilihan terjemahan sebelumnya (konsistensi hilang)

**Solution:**
- Simpan semua frasa yang pernah diterjemahkan
- Saat ketemu frasa serupa, kasih suggestion dari translation memory
- User bisa approve/reject/edit

**Use case:**
> Previous: "in the dead of night" → "di tengah malam yang sunyi"
> Current text: "...in the dead of winter..."
> 
> Suggestion: "di tengah musim dingin yang sunyi" (consistent pattern)

#### 3.6 Glossary Builder

**Problem:** Teks tertentu punya terminologi khusus (misal novel sci-fi, teks hukum, puisi era Victorian)

**Solution:**
- User buat glossary per-text atau per-author
- Definisi + preferred translation + notes
- Saat baca teks dari author/genre sama, glossary auto-load

**Use case:**
> Glossary: "Jane Austen — Regency Era Terms"
> 
> - "drawing room" → "ruang tamu formal" (bukan "ruang gambar")
> - "gentleman" → "pria terhormat" (bukan sekadar "pria")
> - "estate" → "tanah milik" (bukan "perumahan")

#### 3.7 Side-by-Side Comparator

**Problem:** Mahasiswa ingin belajar dari terjemahan profesional, tapi susah compare line-by-line

**Solution:**
- Upload teks asli + terjemahan resmi (misal dari buku terbitan)
- Display side-by-side dengan alignment
- Annotate keputusan penerjemah:
  - Kenapa pilih kata ini?
  - Strategi apa yang dipakai?
  - Trade-off apa yang diambil?

**Use case:**
> Original: "It is a truth universally acknowledged..."
> Professional: "Adalah kebenaran yang diakui secara universal..."
> 
> AI annotation:
> - Strategi: formal equivalence (struktur dipertahankan)
> - Trade-off: sedikit kaku, tapi mempertahankan tone Jane Austen
> - Alternatif modern: "Semua orang tahu bahwa..." (lebih natural, tapi hilang formality)
