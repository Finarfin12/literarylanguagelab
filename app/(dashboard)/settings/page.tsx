"use client";

import { useState, useEffect } from "react";
import { User, Settings, Save, Upload, Loader2, Mail, ShieldAlert, Globe2, Bell, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [isPublic, setIsPublic] = useState(false);
  const [languagePref, setLanguagePref] = useState("id");
  const [notificationPref, setNotificationPref] = useState(true);

  const [deleting, setDeleting] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFullName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");
        setAboutMe(user.user_metadata?.about_me || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setIsPublic(profile.is_public ?? false);
          setLanguagePref(profile.language_preference ?? "id");
          setNotificationPref(profile.notification_preference ?? true);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let finalAvatarUrl = avatarUrl;

      // Handle file upload if a new file is selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('Avatar')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('Avatar')
          .getPublicUrl(filePath);

        finalAvatarUrl = publicUrl;
      }

      // Update auth user metadata
      const updates = {
        data: {
          full_name: fullName,
          about_me: aboutMe,
          avatar_url: finalAvatarUrl
        }
      };

      // Only update email if it changed (triggers confirmation email)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (email && email !== currentUser?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setMessage("Silakan cek kotak masuk email baru Anda untuk konfirmasi perubahan email. ");
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      // Update profiles table too
      if (currentUser) {
        await supabase.from('profiles').update({
          full_name: fullName,
          avatar_url: finalAvatarUrl,
          is_public: isPublic,
          language_preference: languagePref,
          notification_preference: notificationPref
        }).eq('id', currentUser.id);
      }

      setAvatarUrl(finalAvatarUrl);
      if (!message) setMessage("Profil berhasil diperbarui!");
      
    } catch (err: any) {
      console.error(err);
      setMessage(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteEmail !== email) {
      alert("Email konfirmasi tidak cocok!");
      return;
    }
    
    const confirmMsg = "PERINGATAN: Aksi ini tidak dapat dibatalkan! Semua data, XP, kosa kata, dan riwayat baca Anda akan hilang selamanya. Yakin ingin melanjutkan?";
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: deleteEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err: any) {
      alert(`Gagal menghapus akun: ${err.message}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand" />
            Pengaturan Akun
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Kelola informasi pribadi dan preferensi Anda.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${message.includes('Gagal') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 bg-card border border-foreground/10 shadow-sm p-8 rounded-3xl">
          
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center shrink-0 border-2 border-brand/30">
              {avatarUrl || (file && URL.createObjectURL(file)) ? (
                <img src={file ? URL.createObjectURL(file) : avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Foto Profil</label>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl transition-colors text-sm font-medium">
                <Upload className="w-4 h-4" />
                Pilih Gambar
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                  }}
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">Format JPG, PNG, atau GIF. Maks 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nama Lengkap / Username</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tentang Saya (Biografi Singkat)</label>
            <textarea 
              value={aboutMe}
              onChange={e => setAboutMe(e.target.value)}
              rows={4}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none transition-all"
              placeholder="Ceritakan sedikit tentang ketertarikan sastra Anda..."
            />
          </div>

          <div className="pt-8 border-t border-foreground/10">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-brand" />
              Preferensi & Privasi
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                <div>
                  <p className="font-bold text-foreground text-sm">Profil Publik</p>
                  <p className="text-xs text-muted-foreground mt-1">Izinkan pengguna lain mencari dan melihat profil Anda.</p>
                </div>
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-5 h-5 accent-brand" />
              </label>

              <label className="flex items-center justify-between p-4 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                <div>
                  <p className="font-bold text-foreground text-sm flex items-center gap-2"><Bell className="w-4 h-4" /> Notifikasi Email</p>
                  <p className="text-xs text-muted-foreground mt-1">Terima pengingat Spaced Repetition mingguan.</p>
                </div>
                <input type="checkbox" checked={notificationPref} onChange={e => setNotificationPref(e.target.checked)} className="w-5 h-5 accent-brand" />
              </label>

              <div className="p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                <p className="font-bold text-foreground text-sm mb-2">Bahasa Utama</p>
                <select value={languagePref} onChange={e => setLanguagePref(e.target.value)} className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-foreground/10 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>

        <div className="mt-12 bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
          <h3 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6" /> Danger Zone
          </h3>
          <p className="text-sm text-red-500/80 mb-6">Penghapusan akun bersifat permanen. Semua data kosa kata, riwayat, dan profil Anda akan musnah tanpa bisa dikembalikan.</p>
          
          <form onSubmit={handleDeleteAccount} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-medium text-red-500/80">Ketik ulang email Anda untuk konfirmasi</label>
              <input 
                type="email" 
                value={deleteEmail}
                onChange={e => setDeleteEmail(e.target.value)}
                placeholder="email@anda.com"
                className="w-full bg-background border border-red-500/30 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={deleting || deleteEmail !== email}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shrink-0 shadow-md"
            >
              {deleting ? "Menghapus..." : "Hapus Akun Permanen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
