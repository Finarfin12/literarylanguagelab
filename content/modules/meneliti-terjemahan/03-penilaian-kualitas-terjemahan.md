---
slug: meneliti-terjemahan-3-penilaian-kualitas-terjemahan
subject: meneliti-terjemahan
order: 3
level: C1
title: Penilaian kualitas terjemahan
tools: /translation-workspace
objectives:
- Menyebut pendekatan penilaian kualitas: holistik, analitik, berbasis kesalahan, dan berbasis fungsi
- Menyusun model penilaian dengan kriteria, tipologi kesalahan, bobot, dan skala
- Menjelaskan pentingnya penilai ganda, pelatihan penilai, dan sampel penilaian
- Membedakan penilaian manusia dari metrik otomatis dan membaca batas masing-masing
sources:
- Translation studies (Wikipedia) | https://en.wikipedia.org/wiki/Translation_studies | ok
- Inter-rater reliability (Wikipedia) | https://en.wikipedia.org/wiki/Inter-rater_reliability | ok
- BLEU (Wikipedia) | https://en.wikipedia.org/wiki/BLEU | ok
- Machine translation (Wikipedia) | https://en.wikipedia.org/wiki/Machine_translation | ok
---

## Mengapa menilai kualitas itu sulit

Semua orang yang pernah membaca terjemahan punya pendapat tentang mutunya. Tetapi penelitian memerlukan lebih dari pendapat: ia memerlukan **cara menilai yang dapat dijelaskan, diulang, dan diperiksa orang lain**. Penilaian kualitas terjemahan sulit karena (1) kualitas berdimensi banyak (ketepatan, kewajaran, gaya, kesesuaian fungsi), (2) tujuan terjemahan berbeda-beda, dan (3) penilai berbeda sering memberi nilai berbeda. Pelajaran ini membahas cara mengelola ketiganya.

## Empat pendekatan umum

| Pendekatan | Cara kerja | Kelebihan | Kelemahan |
|---|---|---|---|
| **Holistik** | satu nilai keseluruhan (mis. skala 1–5) | cepat, mencerminkan kesan umum | tidak menjelaskan penyebab, rawan subjektivitas |
| **Analitik** | nilai per kriteria (ketepatan, bahasa, istilah, gaya) | memperlihatkan kekuatan dan kelemahan | lebih lama, kriteria harus jelas |
| **Berbasis kesalahan** | menandai dan menghitung kesalahan menurut jenis dan keparahan | objektif, mudah dilacak | mengabaikan kualitas positif, bergantung definisi kesalahan |
| **Berbasis fungsi** | menilai apakah terjemahan memenuhi tujuannya bagi pembaca nyata | relevan dengan penggunaan | membutuhkan pembaca atau pengguna, tujuan harus jelas |

Dalam praktik, penelitian dan industri sering menggabungkan pendekatan: misalnya penilaian berbasis kesalahan untuk ketepatan dan penilaian analitik untuk kewajaran dan gaya.

## Menyusun model penilaian

Model penilaian yang baik memiliki lima komponen.

**1. Tujuan dan konteks penilaian.** Terjemahan apa, untuk siapa, untuk apa? Penilaian terjemahan dokumen medis berbeda dari penilaian terjemahan puisi.

**2. Kriteria.** Misalnya: ketepatan isi, kewajaran bahasa sasaran, istilah dan konsistensi, kesesuaian register dan fungsi, format. Tiap kriteria diberi definisi satu kalimat dan contoh.

**3. Tipologi kesalahan.** Daftar jenis kesalahan: penghilangan, penambahan, penyimpangan makna, istilah salah, tata bahasa, ejaan, kewajaran, register, format. Beberapa model standar industri menyediakan tipologi bertingkat, dan lembaga atau pemesan bisa memiliki tipologinya sendiri; periksa sumber resmi yang kamu pakai.

**4. Bobot dan keparahan.** Kesalahan tidak setara. Skema yang umum: kritis (berakibat serius), mayor (mengubah makna), minor (tidak mengubah makna). Kesalahan diberi bobot (misalnya kritis = 10, mayor = 5, minor = 1) lalu dijumlahkan dan dinormalisasi per jumlah kata, misalnya per 1.000 kata, agar teks panjang dan pendek dapat dibandingkan.

**5. Skala dan ambang.** Skala keputusan (lulus-tidak lulus, atau tingkat mutu) dan ambangnya. Ambang adalah keputusan, bukan fakta; tuliskan alasannya.

Contoh skema bobot sederhana (fiktif): kritis 10, mayor 5, minor 1. Sebuah sampel 1.000 kata memuat 1 kritis, 3 mayor, dan 12 minor. Skor kesalahan = 10 + 15 + 12 = 37 per 1.000 kata. Model lalu menetapkan ambang (misalnya di atas 25 per 1.000 kata berarti perlu revisi). Angka dan ambang hanyalah contoh; model nyata menyesuaikan tujuan.

## Penilai, pelatihan, dan sampel

Karena penilai berbeda dapat memberi nilai berbeda, penelitian yang baik mengendalikan variasi itu.

- **Penilai ganda.** Dua orang atau lebih menilai bagian yang sama secara independen.
- **Pelatihan dan kalibrasi.** Penilai membaca definisi kriteria, menilai contoh bersama, mendiskusikan perbedaan, dan menyepakati penerapan sebelum menilai data sebenarnya.
- **Penilai buta.** Bila relevan, penilai tidak tahu terjemahan mana buatan siapa (manusia atau mesin, penerjemah A atau B) agar tidak bias.
- **Sampel penilaian.** Untuk teks panjang, nilai sampel bagian (misalnya beberapa segmen acak) dengan jumlah yang cukup, dan jelaskan cara memilih sampel.
- **Urutan acak.** Acak urutan teks yang dinilai agar kelelahan atau efek urutan tidak menguntungkan satu pihak.

Variasi antarpenilai diukur dengan reliabilitas antarpenilai, yang dihitung pada pelajaran berikutnya.

## Penilaian manusia dan metrik otomatis

Dalam penelitian terjemahan mesin, ada **metrik otomatis** yang membandingkan keluaran mesin dengan satu atau beberapa terjemahan acuan, misalnya BLEU, yang menghitung kecocokan rangkaian kata. Kelebihannya: cepat, murah, dan dapat diulang. Keterbatasannya: kecocokan dengan acuan bukan ukuran langsung mutu bagi pembaca; terjemahan yang baik tetapi berbeda dari acuan dapat dinilai buruk; metrik tidak peka terhadap sebagian kesalahan makna, gaya, dan fungsi.

Pegangan aman: metrik otomatis berguna untuk **membandingkan sistem** secara kasar atau memantau perubahan, tetapi tidak menggantikan penilaian manusia, terutama untuk teks yang menuntut ketepatan atau gaya. Laporkan metrik bersama keterbatasannya.

## Mengaitkan dengan tujuan terjemahan

Kembali ke teori skopos: kualitas ditentukan oleh kecocokan dengan tujuan. Karena itu model penilaian sebaiknya **menyertakan brief**: terjemahan yang sempurna untuk satu tujuan bisa gagal untuk tujuan lain. Misalnya terjemahan dokumen internal untuk dipahami cepat menilai kejelasan lebih tinggi daripada gaya, sedangkan terjemahan buku untuk diterbitkan menilai gaya dan suara sangat tinggi.

## Contoh dan pembahasan

Penelitian kecil: membandingkan kualitas terjemahan tiga paragraf berita dari dua sumber (penerjemah manusia dan mesin yang disunting).

Model: tujuan: berita untuk pembaca umum Indonesia. Kriteria: ketepatan (bobot dua kali), kewajaran, istilah, register. Tipologi kesalahan dan bobot kritis 10, mayor 5, minor 1. Penilai: dua penilai terlatih, buta terhadap sumber terjemahan, urutan acak. Sampel: 12 segmen dari tiga paragraf. Keluaran: skor kesalahan per 1.000 kata untuk tiap sumber dan nilai analitik 1–4 per kriteria.

Perhatikan komponen yang membuat penilaian dapat dipertanggungjawabkan: tujuan jelas, kriteria definisi, bobot terbuka, penilai ganda dan buta, serta urutan acak. Hasilnya bukan "manusia lebih baik" secara umum, melainkan "pada sampel ini, menurut model ini, skor kesalahan sumber A lebih rendah"; batas klaim ikut ditulis.

## Latihan

```exercise
{ "type": "match", "prompt": { "lefts": ["Holistik", "Analitik", "Berbasis kesalahan", "Berbasis fungsi"], "rights": ["Satu nilai keseluruhan", "Nilai per kriteria", "Menghitung kesalahan menurut jenis dan keparahan", "Menilai apakah tujuan bagi pembaca nyata terpenuhi"], "instruction": "Pasangkan pendekatan penilaian dengan cirinya." }, "answer": { "pairs": [{ "left": "Holistik", "right": "Satu nilai keseluruhan" }, { "left": "Analitik", "right": "Nilai per kriteria" }, { "left": "Berbasis kesalahan", "right": "Menghitung kesalahan menurut jenis dan keparahan" }, { "left": "Berbasis fungsi", "right": "Menilai apakah tujuan bagi pembaca nyata terpenuhi" }] }, "explanation_id": "Pendekatan sering digabungkan menurut tujuan penilaian." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Sampel 1.000 kata memuat 1 kesalahan kritis (bobot 10), 3 mayor (bobot 5), dan 12 minor (bobot 1). Berapa skor kesalahan per 1.000 kata?", "options": ["37", "16", "25", "52"] }, "answer": { "correct": "37" }, "explanation_id": "10 + (3 x 5) + (12 x 1) = 10 + 15 + 12 = 37." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Mengapa penilaian sebaiknya memakai penilai ganda yang terlatih?", "options": ["Karena penilai berbeda sering memberi nilai berbeda; kalibrasi dan perbandingan mengendalikan variasi", "Agar penilaian lebih lama", "Agar tidak perlu kriteria", "Karena satu penilai selalu salah"] }, "answer": { "correct": "Karena penilai berbeda sering memberi nilai berbeda; kalibrasi dan perbandingan mengendalikan variasi" }, "explanation_id": "Reliabilitas antarpenilai diukur setelah penilai dilatih dan menilai independen." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Apa batas metrik otomatis seperti BLEU?", "options": ["Kecocokan dengan acuan bukan ukuran langsung mutu bagi pembaca dan tidak peka terhadap sebagian kesalahan makna dan gaya", "Ia selalu menggantikan penilai manusia", "Ia mengukur kepuasan pembaca", "Ia tidak membutuhkan acuan"] }, "answer": { "correct": "Kecocokan dengan acuan bukan ukuran langsung mutu bagi pembaca dan tidak peka terhadap sebagian kesalahan makna dan gaya" }, "explanation_id": "Metrik berguna membandingkan sistem secara kasar, bukan menggantikan penilaian manusia." }
```

## Rangkuman

- Penilaian kualitas perlu cara yang dapat dijelaskan, diulang, dan diperiksa karena kualitas berdimensi banyak.
- Empat pendekatan: holistik, analitik, berbasis kesalahan, berbasis fungsi; sering digabung.
- Model penilaian: tujuan, kriteria, tipologi kesalahan, bobot dan keparahan (kritis, mayor, minor), skala dan ambang.
- Kendalikan variasi: penilai ganda, pelatihan, penilai buta, sampel yang jelas, urutan acak.
- Metrik otomatis berguna secara kasar tetapi tidak menggantikan penilaian manusia; kualitas selalu dikaitkan dengan tujuan.

## Tugas

Susun model penilaian untuk satu jenis teks pilihanmu: tujuan, lima kriteria berdefinisi, tipologi kesalahan sepuluh jenis, bobot, dan ambang beralasan. Terapkan pada dua terjemahan paragraf yang sama, hitung skor kesalahan per 1.000 kata, dan tulis tiga baris tentang batas klaimmu.
