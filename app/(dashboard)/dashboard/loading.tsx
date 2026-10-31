import { Skeleton } from "@/components/ui/primitives";

// Tampil seketika saat berpindah ke Beranda, selagi data dimuat di server.
export default function DashboardLoading() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24" aria-busy="true" aria-label="Memuat beranda">
      <Skeleton className="h-9 w-2/3 mb-3" />
      <Skeleton className="h-5 w-1/2 mb-8" />
      <Skeleton className="h-36 w-full mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Skeleton className="h-56 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
