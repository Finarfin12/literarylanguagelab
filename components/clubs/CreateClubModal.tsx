"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createClub } from "@/app/(dashboard)/clubs/actions";
import SubmitButton from "@/components/ui/SubmitButton";

export default function CreateClubModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-brand hover:bg-brand/90 text-brand-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-5 h-5" />
        Buat Klub Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          ></div>
          
          <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Bentuk Klub Membaca</h2>
            <p className="text-muted-foreground mb-8 text-sm">Undang teman-temanmu atau buka untuk publik untuk membahas literatur klasik bersama-sama.</p>

            <form action={createClub} className="space-y-5" onSubmit={() => setTimeout(() => setIsOpen(false), 500)}>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Nama Klub</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  placeholder="Contoh: Poe's Nightmares" 
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all" 
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Deskripsi Tujuan</label>
                <textarea 
                  name="description" 
                  required 
                  placeholder="Kita akan membedah puisi-puisi melankolis era Romantik..." 
                  className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent min-h-[100px] resize-none transition-all"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Privasi</label>
                <select name="is_public" className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all">
                  <option value="true">Publik (Siapa saja bisa bergabung)</option>
                  <option value="false">Privat (Hanya undangan)</option>
                </select>
              </div>

              <div className="pt-4">
                <SubmitButton className="w-full py-4 bg-brand text-brand-foreground font-bold rounded-xl hover:bg-brand/90 transition-colors shadow-lg">
                  Dirikan Klub Sekarang
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
