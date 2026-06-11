# Gamification & Role System (Sistem Hak Akses & Peringkat)

Dokumen ini mencatat rencana desain untuk sistem peran (Roles), peringkat (Tiers), dan pencapaian (Badges) yang akan diimplementasikan di **Literary Language Lab** untuk meningkatkan retensi dan keterlibatan pengguna dalam belajar sastra dan bahasa asing.

---

## 1. Sistem Roles (Peran Akses Komunitas)
Struktur hak akses pengguna dirancang menyerupai hierarki sebuah perpustakaan raksasa atau akademi sastra.

| Role | Nama Alias | Hak Akses & Tugas |
| :--- | :--- | :--- |
| **Admin** | *Librarian* (Pustakawan Utama) | Kendali penuh (Superuser). Memiliki akses ke **User Management Menu** untuk mengangkat Curator/Moderator, menghapus akun spam, mengedit semua teks, dan konfigurasi sistem. |
| **Moderator** | *Archivist* (Penjaga Arsip) | Menjaga ketertiban *Forum* dan *Book Club*. Berhak menghapus komentar toksik, memberi label (*pin/lock thread*), dan mengarahkan diskusi. |
| **Curator** | *Curator* (Kurator Sastra) | Kontributor terpercaya. Berhak memverifikasi kualitas *Text Library*, menambahkan *Cultural Context*, dan menyetujui terjemahan. |
| **User** | *Scholar* (Pembaca Biasa) | Peran default. Bisa membaca buku, memakai semua alat LingoWise AI, menyimpan kosakata, dan memposting di forum. |

---

## 2. Sistem Tiers / Ranks (Peringkat Pembelajar)
Sistem peringkat ini berbasis poin pengalaman (XP) yang digabungkan secara visual dengan Tingkat Kemahiran Bahasa (CEFR Level) pengguna. Peringkat ini akan dipamerkan di profil publik maupun forum dengan format **[Gelar Gamifikasi] ([Level CEFR])**, misalnya: **Novice Reader (A1)** atau **Bibliophile (B2)**.

XP didapat dari: durasi membaca, jumlah interaksi forum, dan jumlah kata/idiom yang disimpan.

1. **Lv. 1 - Novice Reader** *(contoh: Novice Reader (A1))*
   * *Syarat:* Baru mendaftar di platform.
2. **Lv. 5 - Bibliophile** *(contoh: Bibliophile (A2))*
   * *Syarat:* Selesai membaca 5 bab/teks dan memiliki setidaknya 50 kata di kamus.
3. **Lv. 15 - Wordsmith** *(contoh: Wordsmith (B1))*
   * *Syarat:* Berkembang menjadi pembelajar aktif, sering menggunakan LingoWise AI (seperti *Glossary Builder* & *Idiom Library*).
4. **Lv. 30 - Literary Scholar** *(contoh: Literary Scholar (B2))*
   * *Syarat:* Membaca lintasan genre yang luas dan memiliki partisipasi solid di *Book Club* / *Forum*.
5. **Lv. 50 - Master of Linguistics** *(contoh: Master of Linguistics (C1/C2))*
   * *Syarat:* Tingkat *end-game*. Diberikan kepada pembaca elit dengan rentetan membaca (*streaks*) berbulan-bulan dan wawasan tingkat dewa.

---

## 3. Sistem Badges (Lencana Pencapaian)
*Badge* adalah trofi unik untuk perilaku spesifik di luar XP umum. Berguna untuk memicu kepuasan koleksioner (*collector's mindset*).

### A. Kategori Konsistensi (Streaks)
*   🔥 **The Daily Candle:** Membaca 7 hari berturut-turut.
*   🕰️ **Time Traveler:** Mempertahankan kebiasaan membaca 30 hari berturut-turut tanpa putus.

### B. Kategori Penjelajah Genre (Genre Explorer)
*   💀 **Gothic Soul:** Menyelesaikan 3 teks bergenre horor/gotik klasik (misal: *Edgar Allan Poe*, *Mary Shelley*).
*   🎭 **Shakespeare's Apprentice:** Rutin membaca naskah drama atau teater klasik.
*   📜 **The Poet's Heart:** Menghabiskan banyak waktu mengapresiasi teks puisi dan sajak.

### C. Kategori Penggunaan LingoWise AI
*   🕵️ **Cultural Detective:** Membongkar rahasia sejarah menggunakan fitur *Cultural Context Editor* lebih dari 20 kali.
*   🧩 **Idiom Hunter:** Sukses berburu dan menyimpan 50 idiom kuno ke dalam kamusnya.
*   🗣️ **Orpheus Listener:** Sangat sering memanfaatkan mode pembaca bersuara tinggi (Groq TTS) untuk melatih kemampuan *listening*.

### D. Kategori Sosial & Kontribusi
*   ☕ **Book Club Host:** Mengambil inisiatif untuk mendirikan dan memimpin diskusi di *Book Club* pribadi.
*   🤝 **The Translator:** Menyumbangkan anotasi/terjemahan paragraf yang paling banyak mendapat *upvote* (jempol) dari komunitas.

---

## 4. Rencana Implementasi Teknis (Catatan untuk Developer)
*   **Database:** Memerlukan tabel `user_xp`, `user_badges` (relasi *many-to-many* antara profil dan master *badge*).
*   **User Management Menu (Admin Only):** Perlu dibuatkan halaman khusus (dashboard) untuk Admin agar bisa memantau daftar pengguna, mengubah *Role* (misal: menunjuk seseorang jadi Curator), dan mengelola peringatan/ban.
*   **Trigger/Cron:** Evaluasi *streaks* dan XP dapat dijalankan melalui *Supabase Database Webhooks* atau *cron job*.
*   **Frontend:** Menampilkan lencana (berupa ikon SVG atau Emoji menarik) di halaman `/profile` dan di avatar saat berinteraksi di `/forum`.
