import AnimatedPage from "@/components/AnimatedPage";
import { Eyebrow } from "@/components/ui/primitives";
import ReadingDrill from "@/components/reading/ReadingDrill";

export const metadata = { title: "Latihan Skimming & Scanning · Literary Language Lab" };

export default function LatihanMembacaPage() {
  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <Eyebrow>Ruang I</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Latihan Skimming & Scanning</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Skimming menangkap gambaran umum dengan cepat; scanning mencari satu informasi tanpa membaca semuanya. Pilih teks, pilih jenis latihan, dan nyalakan timer hanya bila kamu mau.
        </p>
      </header>
      <ReadingDrill />
    </AnimatedPage>
  );
}
