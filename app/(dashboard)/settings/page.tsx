"use client";

import { useState, useEffect } from "react";
import { User, Settings, Save, Upload, Loader2, Mail } from "lucide-react";
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

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFullName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");
        setAboutMe(user.user_metadata?.about_me || "");
        setAvatarUrl(user.user_metadata?.avatar_url || "");
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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatar')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatar')
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

      setAvatarUrl(finalAvatarUrl);
      if (!message) setMessage("Profil berhasil diperbarui!");
      
    } catch (err: any) {
      console.error(err);
      setMessage(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
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

        <form onSubmit={handleSave} className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl">
          
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0 border-2 border-brand/30">
              {avatarUrl || (file && URL.createObjectURL(file)) ? (
                <img src={file ? URL.createObjectURL(file) : avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">Foto Profil</label>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm">
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50"
                placeholder="John Doe"
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
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tentang Saya (Biografi Singkat)</label>
            <textarea 
              value={aboutMe}
              onChange={e => setAboutMe(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 resize-none"
              placeholder="Ceritakan sedikit tentang ketertarikan sastra Anda..."
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
