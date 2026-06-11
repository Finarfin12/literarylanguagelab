"use client";

import { useState, useEffect } from "react";
import { User, Settings, Save, Upload, Loader2, Mail, ShieldAlert, Globe2, Bell, AlertTriangle, BookOpen, BrainCircuit } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

interface UserPreferences {
  reading: {
    font_family: string;
    font_size: number;
    line_height: number;
    text_width: string;
    theme: string;
    auto_save: boolean;
    highlight_color: string;
    line_numbers: boolean;
    tts_enabled: boolean;
    tts_provider: string;
    enable_quizzes: boolean;
  };
  dictionary: {
    auto_lookup: boolean;
    show_register: boolean;
    show_etymology: boolean;
    def_language: string;
  };
  learning: {
    default_mastery: number;
    auto_add_vocab: boolean;
    cards_per_session: number;
    show_context: boolean;
  };
  display: {
    show_reading_time: boolean;
    high_contrast: boolean;
    screen_reader: boolean;
    keyboard_shortcuts: boolean;
  };
  privacy: {
    allow_analytics: boolean;
    share_anonymous_data: boolean;
    public_profile: boolean;
    show_in_leaderboard: boolean;
  };
  performance: {
    offline_mode: boolean;
    preload_next_text: boolean;
  };
  developer: {
    debug_mode: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  reading: { font_family: "serif", font_size: 16, line_height: 1.75, text_width: "medium", theme: "light", auto_save: true, highlight_color: "#FFD700", line_numbers: false, tts_enabled: false, tts_provider: "browser", enable_quizzes: true },
  dictionary: { auto_lookup: true, show_register: true, show_etymology: false, def_language: "id" },
  learning: { default_mastery: 0, auto_add_vocab: false, cards_per_session: 20, show_context: true },
  display: { show_reading_time: true, high_contrast: false, screen_reader: false, keyboard_shortcuts: true },
  privacy: { allow_analytics: true, share_anonymous_data: true, public_profile: false, show_in_leaderboard: false },
  performance: { offline_mode: false, preload_next_text: true },
  developer: { debug_mode: false }
};

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"profil" | "reading" | "learning" | "privacy">("profil");
  
  // Profile State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [languagePref, setLanguagePref] = useState("id");
  const [notificationPref, setNotificationPref] = useState(true);
  const [userRole, setUserRole] = useState("student");
  const [sttEngine, setSttEngine] = useState("browser");

  // Preferences State
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Deletion State
  const [deleting, setDeleting] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  
  // Export/System States
  const [exporting, setExporting] = useState<string | null>(null);
  const [clearingCache, setClearingCache] = useState(false);

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
          setUserRole(profile.role ?? "student");
          
          if (profile.preferences) {
            // Merge existing preferences with default to avoid undefined errors
            setPreferences({
              reading: { ...defaultPreferences.reading, ...(profile.preferences.reading || {}) },
              dictionary: { ...defaultPreferences.dictionary, ...(profile.preferences.dictionary || {}) },
              learning: { ...defaultPreferences.learning, ...(profile.preferences.learning || {}) },
              display: { ...defaultPreferences.display, ...(profile.preferences.display || {}) },
              privacy: { ...defaultPreferences.privacy, ...(profile.preferences.privacy || {}) },
              performance: { ...defaultPreferences.performance, ...(profile.preferences.performance || {}) },
              developer: { ...defaultPreferences.developer, ...(profile.preferences.developer || {}) },
            });
          }
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const updatePref = (category: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let finalAvatarUrl = avatarUrl;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('Avatar').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('Avatar').getPublicUrl(filePath);
        finalAvatarUrl = publicUrl;
      }

      const updates = { data: { full_name: fullName, about_me: aboutMe, avatar_url: finalAvatarUrl } };
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (email && email !== currentUser?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
        setMessage("Silakan cek kotak masuk email baru Anda untuk konfirmasi perubahan email. ");
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      if (currentUser) {
        await supabase.from('profiles').update({
          full_name: fullName,
          avatar_url: finalAvatarUrl,
          is_public: isPublic,
          language_preference: languagePref,
          notification_preference: notificationPref,
          preferences: preferences
        }).eq('id', currentUser.id);
      }

      setAvatarUrl(finalAvatarUrl);
      localStorage.setItem('stt_engine', sttEngine);
      
      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: 'Pengaturan berhasil disimpan.',
        timer: 2000,
        showConfirmButton: false
      });
      setMessage("");
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
      setMessage("Email konfirmasi tidak cocok.");
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err: any) {
      console.error("Delete account error:", err);
      setMessage(`Gagal menghapus akun: ${err.message}`);
      setDeleting(false);
    }
  };

  const handleExportData = async (type: 'vocab' | 'history' | 'translations') => {
    setExporting(type);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      let table = "";
      if (type === 'vocab') table = "vocabulary";
      else if (type === 'history') table = "reading_sessions";
      else if (type === 'translations') table = "translation_submissions";

      const { data, error } = await supabase.from(table).select('*').eq('user_id', user.id);
      if (error) throw error;

      if (!data || data.length === 0) {
        setMessage(`Data ${type} kosong. Tidak ada yang diekspor.`);
        setExporting(null);
        return;
      }

      const keys = Object.keys(data[0]);
      const csvLines = [
        keys.join(','),
        ...data.map(row => keys.map(k => `"${String(row[k]).replace(/"/g, '""')}"`).join(','))
      ];
      const csv = csvLines.join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(`Berhasil mengekspor data ${type}.`);
    } catch (err: any) {
      console.error(`Export ${type} error:`, err);
      setMessage(`Gagal mengekspor: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const deleteAccount = async () => {
    const result = await Swal.fire({
      title: "PERINGATAN BERBAHAYA",
      text: "Aksi ini akan MENGHAPUS SEMUA Vocabulary dan Riwayat Membaca secara permanen. Apakah Anda yakin?",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3f3f46",
      confirmButtonText: "Ya, Hapus Permanen!",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;
    
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error: vError } = await supabase.from('vocabulary').delete().eq('user_id', user.id);
      if (vError) throw vError;
      
      const { error: rError } = await supabase.from('reading_sessions').delete().eq('user_id', user.id);
      if (rError) throw rError;

      setMessage("Berhasil menghapus semua data Vocabulary dan Riwayat Membaca.");
    } catch (err: any) {
      console.error("Delete data error:", err);
      setMessage(`Gagal menghapus data: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      localStorage.clear();
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      setMessage("Cache aplikasi berhasil dibersihkan.");
    } catch (err: any) {
      setMessage(`Gagal membersihkan cache: ${err.message}`);
    } finally {
      setClearingCache(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand" />
            Pengaturan Akun
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Kelola informasi pribadi dan preferensi sistem Anda.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 ${message.includes('Gagal') ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-card border border-foreground/10 p-2 rounded-full overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("profil")} className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === "profil" ? 'bg-brand text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <User className="w-4 h-4" /> Profil
          </button>
          <button onClick={() => setActiveTab("reading")} className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === "reading" ? 'bg-brand text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <BookOpen className="w-4 h-4" /> Membaca & Kamus
          </button>
          <button onClick={() => setActiveTab("learning")} className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === "learning" ? 'bg-brand text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <BrainCircuit className="w-4 h-4" /> Kosakata & Belajar
          </button>
          <button onClick={() => setActiveTab("privacy")} className={`px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all ${activeTab === "privacy" ? 'bg-brand text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            <ShieldAlert className="w-4 h-4" /> Privasi & Sistem
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 bg-card border border-foreground/10 shadow-sm p-8 rounded-3xl">
          
          {/* TAB 1: PROFIL */}
          {activeTab === "profil" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center shrink-0 border-2 border-brand/30">
                  {avatarUrl || (file && URL.createObjectURL(file)) ? (
                    <img src={file ? URL.createObjectURL(file) : avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : <User className="w-10 h-10 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Foto Profil</label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl transition-colors text-sm font-medium">
                    <Upload className="w-4 h-4" /> Pilih Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files && e.target.files[0]) setFile(e.target.files[0]); }} />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">Format JPG, PNG, atau GIF. Maks 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nama Lengkap / Username</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tentang Saya (Biografi Singkat)</label>
                <textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} rows={4} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand resize-none" placeholder="Ceritakan sedikit tentang ketertarikan sastra Anda..." />
              </div>

              <div className="pt-6 border-t border-foreground/10 space-y-4">
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
                    <p className="text-xs text-muted-foreground mt-1">Terima pengingat sistem via email.</p>
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
          )}

          {/* TAB 2: READING & DICTIONARY */}
          {activeTab === "reading" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Text Display</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Font Family</label>
                    <select value={preferences.reading.font_family} onChange={e => updatePref('reading', 'font_family', e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="serif">Serif (Literary)</option>
                      <option value="sans-serif">Sans-Serif (Modern)</option>
                      <option value="dyslexic">OpenDyslexic (Accessible)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Text Width</label>
                    <select value={preferences.reading.text_width} onChange={e => updatePref('reading', 'text_width', e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="narrow">Narrow (Fokus)</option>
                      <option value="medium">Medium (Standar)</option>
                      <option value="wide">Wide (Layar Penuh)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Font Size ({preferences.reading.font_size}px)</label>
                    <input type="range" min="12" max="24" step="1" value={preferences.reading.font_size} onChange={e => updatePref('reading', 'font_size', parseInt(e.target.value))} className="w-full accent-brand" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Line Height</label>
                    <select value={preferences.reading.line_height} onChange={e => updatePref('reading', 'line_height', parseFloat(e.target.value))} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="1.5">Compact (1.5)</option>
                      <option value="1.75">Standard (1.75)</option>
                      <option value="2.0">Relaxed (2.0)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Reading Experience</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Auto-save Progress</span>
                    <input type="checkbox" checked={preferences.reading.auto_save} onChange={e => updatePref('reading', 'auto_save', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Tampilkan Nomor Baris</span>
                    <input type="checkbox" checked={preferences.reading.line_numbers} onChange={e => updatePref('reading', 'line_numbers', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Text-to-Speech (Beta)</span>
                        <input type="checkbox" checked={preferences.reading.tts_enabled} onChange={e => updatePref('reading', 'tts_enabled', e.target.checked)} className="w-4 h-4 accent-brand" />
                      </div>
                    </div>
                    {preferences.reading.tts_enabled && (
                      <select 
                        value={preferences.reading.tts_provider || "browser"} 
                        onChange={e => updatePref('reading', 'tts_provider', e.target.value)} 
                        className="bg-background border border-foreground/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-brand"
                      >
                        <option value="browser">Browser Native (Offline)</option>
                        <option value="groq">Groq AI (High Quality)</option>
                      </select>
                    )}
                  </div>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer border-l-4 border-l-orange-500">
                    <div>
                      <span className="text-sm font-bold flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-orange-500" /> Kuis Pemahaman Otomatis</span>
                      <p className="text-xs text-muted-foreground mt-0.5 font-normal">Tampilkan kuis di akhir setiap bab untuk menguji pemahaman.</p>
                    </div>
                    <input type="checkbox" checked={preferences.reading.enable_quizzes} onChange={e => updatePref('reading', 'enable_quizzes', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <div className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10">
                    <span className="text-sm font-bold">Warna Highlight Teks</span>
                    <input type="color" value={preferences.reading.highlight_color} onChange={e => updatePref('reading', 'highlight_color', e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Dictionary Lookup</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Auto-lookup on Click</span>
                    <input type="checkbox" checked={preferences.dictionary.auto_lookup} onChange={e => updatePref('dictionary', 'auto_lookup', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Tampilkan Register Bahasa (Formal/Slang)</span>
                    <input type="checkbox" checked={preferences.dictionary.show_register} onChange={e => updatePref('dictionary', 'show_register', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Tampilkan Etimologi (Asal Kata)</span>
                    <input type="checkbox" checked={preferences.dictionary.show_etymology} onChange={e => updatePref('dictionary', 'show_etymology', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Bahasa Definisi Kamus</label>
                    <select value={preferences.dictionary.def_language} onChange={e => updatePref('dictionary', 'def_language', e.target.value)} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="id">Indonesia</option>
                      <option value="en">English (Monolingual)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Tampilan & Aksesibilitas</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Tampilkan Estimasi Waktu Baca</span>
                      <span className="text-xs text-muted-foreground">Muncul di header saat membaca teks</span>
                    </div>
                    <input type="checkbox" checked={preferences.display?.show_reading_time ?? true} onChange={e => updatePref('display', 'show_reading_time', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Mode Kontras Tinggi</span>
                      <span className="text-xs text-muted-foreground">Meningkatkan keterbacaan untuk low-vision</span>
                    </div>
                    <input type="checkbox" checked={preferences.display?.high_contrast ?? false} onChange={e => updatePref('display', 'high_contrast', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Kompatibilitas Screen Reader</span>
                      <span className="text-xs text-muted-foreground">Sembunyikan elemen dekoratif dari pembaca layar</span>
                    </div>
                    <input type="checkbox" checked={preferences.display?.screen_reader ?? false} onChange={e => updatePref('display', 'screen_reader', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Pintasan Keyboard (Shortcuts)</span>
                      <span className="text-xs text-muted-foreground">Gunakan tombol angka (1-9) untuk navigasi cepat</span>
                    </div>
                    <input type="checkbox" checked={preferences.display?.keyboard_shortcuts ?? true} onChange={e => updatePref('display', 'keyboard_shortcuts', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEARNING */}
          {activeTab === "learning" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Vocabulary Bank</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Otomatis tambah ke Vocab Bank usai Lookup</span>
                    <input type="checkbox" checked={preferences.learning.auto_add_vocab} onChange={e => updatePref('learning', 'auto_add_vocab', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Level Penguasaan Awal (Default Mastery)</label>
                    <select value={preferences.learning.default_mastery} onChange={e => updatePref('learning', 'default_mastery', parseInt(e.target.value))} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="0">0 - Sama sekali tidak tahu</option>
                      <option value="1">1 - Pernah dengar (Familiar)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Spaced Repetition (SRS)</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Jumlah Kartu per Sesi Reviu</label>
                    <select value={preferences.learning.cards_per_session} onChange={e => updatePref('learning', 'cards_per_session', parseInt(e.target.value))} className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-2 text-sm">
                      <option value="10">10 Kartu (Santai)</option>
                      <option value="20">20 Kartu (Standar)</option>
                      <option value="30">30 Kartu (Intensif)</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <span className="text-sm font-bold">Tampilkan Kalimat Konteks di Flashcard</span>
                    <input type="checkbox" checked={preferences.learning.show_context} onChange={e => updatePref('learning', 'show_context', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <div className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-xs text-muted-foreground mt-2">
                    <p className="font-bold text-brand mb-1">Algoritma Penjadwalan: SM-2 (SuperMemo-2)</p>
                    Algoritma default terbaik yang menghitung kapan Anda akan lupa sebuah kosakata berdasarkan skor memori masa lalu Anda.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACY, DATA & SYSTEM */}
          {activeTab === "privacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Voice & Audio Preferences</h3>
                <div className="space-y-1 p-4 bg-foreground/5 rounded-xl border border-foreground/10">
                  <label className="text-sm font-bold text-foreground">Speech-to-Text Engine</label>
                  <p className="text-xs text-muted-foreground mb-3">Pilih mesin pendeteksi suara untuk dikte dan tes pelafalan.</p>
                  <select value={sttEngine} onChange={e => setSttEngine(e.target.value)} className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand">
                    <option value="browser">Browser Native (Offline, Sangat Cepat)</option>
                    <option value="whisper">Groq Whisper AI (Sangat Akurat)</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Manajemen Data</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <button type="button" onClick={() => handleExportData('vocab')} disabled={exporting === 'vocab'} className="p-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-colors">
                    {exporting === 'vocab' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Ekspor Kosakata (CSV)
                  </button>
                  <button type="button" onClick={() => handleExportData('history')} disabled={exporting === 'history'} className="p-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-colors">
                    {exporting === 'history' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Ekspor Riwayat (CSV)
                  </button>
                  <button type="button" onClick={() => handleExportData('translations')} disabled={exporting === 'translations'} className="p-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-colors">
                    {exporting === 'translations' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Ekspor Terjemahan (CSV)
                  </button>
                </div>
                <button type="button" onClick={deleteAccount} disabled={deleting} className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-500 text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <AlertTriangle className="w-5 h-5" /> {deleting ? "Menghapus..." : "Hapus Semua Data Belajar & Riwayat"}
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Privasi</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Izinkan Analitik</span>
                      <span className="text-xs text-muted-foreground">Bantu kami mengetahui fitur apa yang paling sering digunakan</span>
                    </div>
                    <input type="checkbox" checked={preferences.privacy?.allow_analytics ?? true} onChange={e => updatePref('privacy', 'allow_analytics', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Bagikan Data Anonim</span>
                      <span className="text-xs text-muted-foreground">Bantu tingkatkan kualitas AI (Text-to-Speech & Saran Kosakata)</span>
                    </div>
                    <input type="checkbox" checked={preferences.privacy?.share_anonymous_data ?? true} onChange={e => updatePref('privacy', 'share_anonymous_data', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Tampilkan di Papan Peringkat (Leaderboard)</span>
                      <span className="text-xs text-muted-foreground">Izinkan pengguna lain melihat skor dan statistik publik Anda</span>
                    </div>
                    <input type="checkbox" checked={preferences.privacy?.show_in_leaderboard ?? false} onChange={e => updatePref('privacy', 'show_in_leaderboard', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Performa</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Mode Offline Aktif</span>
                      <span className="text-xs text-muted-foreground">Simpan teks yang dibuka secara lokal untuk dibaca tanpa internet</span>
                    </div>
                    <input type="checkbox" checked={preferences.performance?.offline_mode ?? false} onChange={e => updatePref('performance', 'offline_mode', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-xl border border-foreground/10 cursor-pointer">
                    <div>
                      <span className="text-sm font-bold block">Preload Teks Selanjutnya</span>
                      <span className="text-xs text-muted-foreground">Meningkatkan kecepatan navigasi antar bab buku</span>
                    </div>
                    <input type="checkbox" checked={preferences.performance?.preload_next_text ?? true} onChange={e => updatePref('performance', 'preload_next_text', e.target.checked)} className="w-4 h-4 accent-brand" />
                  </label>
                  <button type="button" onClick={handleClearCache} disabled={clearingCache} className="w-full p-3 bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    {clearingCache ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe2 className="w-4 h-4" />} Bersihkan Cache Aplikasi
                  </button>
                </div>
              </div>

              {userRole === "admin" && (
                <div>
                  <h3 className="text-lg font-bold text-brand mb-4 flex items-center gap-2">Developer Tools (Admin Only)</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-brand/5 border border-brand/20 rounded-xl cursor-pointer">
                      <span className="text-sm font-bold text-brand">Enable Debug Mode</span>
                      <input type="checkbox" checked={preferences.developer?.debug_mode ?? false} onChange={e => updatePref('developer', 'debug_mode', e.target.checked)} className="w-4 h-4 accent-brand" />
                    </label>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-foreground/10 flex justify-end">
            <button type="button" onClick={handleSave} disabled={saving} className="px-6 py-3 bg-brand hover:bg-brand/90 text-brand-foreground rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-md">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>

        {/* Danger Zone only in Profil Tab */}
        {activeTab === "profil" && (
          <div className="mt-8 bg-red-500/5 border border-red-500/20 rounded-3xl p-8 animate-in fade-in">
            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6" /> Danger Zone
            </h3>
            <p className="text-sm text-red-500/80 mb-6">Penghapusan akun bersifat permanen. Semua data kosa kata, riwayat, dan profil Anda akan musnah tanpa bisa dikembalikan.</p>
            <form onSubmit={handleDeleteAccount} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-xs font-medium text-red-500/80">Ketik ulang email Anda untuk konfirmasi</label>
                <input type="email" value={deleteEmail} onChange={e => setDeleteEmail(e.target.value)} placeholder="email@anda.com" className="w-full bg-background border border-red-500/30 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-red-500" required />
              </div>
              <button type="submit" disabled={deleting || deleteEmail !== email} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shrink-0 shadow-md">
                {deleting ? "Menghapus..." : "Hapus Akun Permanen"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
