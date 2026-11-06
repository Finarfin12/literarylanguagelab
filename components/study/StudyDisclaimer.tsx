/** Keterangan tetap Modul Belajar (PRD §9.3): bukan kuliah resmi, tanpa SKS, nilai, atau ijazah. */
export const STUDY_DISCLAIMER = "Pendamping belajar mandiri; bukan program resmi lembaga mana pun. Tidak ada SKS, nilai resmi, atau ijazah.";

export default function StudyDisclaimer() {
  return <p className="mt-10 text-xs text-muted-foreground">{STUDY_DISCLAIMER}</p>;
}
