-- Fase 8 (v3): onboarding 3 pertanyaan.
-- Tujuan belajar, target waktu harian, dan penanda onboarding selesai.
-- Kode tetap jalan sebelum migrasi ini dijalankan (tidak ada redirect ke /onboarding).

alter table profiles add column if not exists learning_goal text
  check (learning_goal in ('umum','sastra','penerjemahan'));
alter table profiles add column if not exists daily_minutes int
  check (daily_minutes is null or daily_minutes in (10, 20, 30));
alter table profiles add column if not exists onboarded_at timestamptz;
