"use client";

// Tab horizontal yang bisa digeser di layar kecil. Dipakai untuk memilih sub-tampilan dalam satu halaman.

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto scrollbar-none border-b border-border">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`flex items-center gap-2 px-4 min-h-[44px] text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active ? "border-brand-solid text-brand-ink" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
