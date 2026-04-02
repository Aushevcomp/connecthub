"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Shield, Trash2, Eye, EyeOff, Loader2, Check, AlertTriangle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type SettingsTab = "account" | "privacy" | "danger";

const TABS: { key: SettingsTab; label: string; icon: any }[] = [
  { key: "account", label: "Аккаунт", icon: Lock },
  { key: "privacy", label: "Приватность", icon: Shield },
  { key: "danger", label: "Удаление", icon: Trash2 },
];

export function SettingsPage() {
  const { user, signOut, openAuthModal } = useAuth();
  const { setUser } = useAppStore();
  const router = useRouter();
  const [tab, setTab] = useState<SettingsTab>("account");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaved, setPrivacySaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfilePublic(user.profile_public);
    setShowEmail(user.show_email);
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3 opacity-30">⚙️</div>
        <p className="text-text-secondary mb-4">Войдите, чтобы открыть настройки</p>
        <button className="btn-primary" onClick={openAuthModal}>Войти</button>
      </div>
    );
  }

  const handlePasswordChange = async () => {
    setPasswordMsg(null);
    if (newPassword.length < 6) { setPasswordMsg({ type: "error", text: "Пароль должен быть не менее 6 символов" }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: "error", text: "Пароли не совпадают" }); return; }
    setPasswordLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: "success", text: "Пароль успешно изменён" });
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { setPasswordMsg({ type: "error", text: err.message || "Ошибка" }); }
    finally { setPasswordLoading(false); }
  };

  const handleEmailChange = async () => {
    setEmailMsg(null);
    if (!newEmail.includes("@")) { setEmailMsg({ type: "error", text: "Введите корректный email" }); return; }
    setEmailLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMsg({ type: "success", text: "Ссылка для подтверждения отправлена на новый email" });
      setNewEmail("");
    } catch (err: any) { setEmailMsg({ type: "error", text: err.message || "Ошибка" }); }
    finally { setEmailLoading(false); }
  };

  const handleSavePrivacy = async () => {
    setPrivacyLoading(true);
    try {
      const supabase = createClient();
      const updatedAt = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          profile_public: profilePublic,
          show_email: showEmail,
          updated_at: updatedAt,
        })
        .eq("id", user.id);
      if (error) throw error;
      setUser({
        ...user,
        profile_public: profilePublic,
        show_email: showEmail,
        updated_at: updatedAt,
      });
      setPrivacySaved(true);
      setTimeout(() => setPrivacySaved(false), 2000);
    } catch (err) { console.error(err); }
    finally { setPrivacyLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "УДАЛИТЬ") return;
    setDeleteLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("comments").delete().eq("author_id", user.id);
      await supabase.from("post_likes").delete().eq("user_id", user.id);
      await supabase.from("post_saves").delete().eq("user_id", user.id);
      await supabase.from("follows").delete().eq("follower_id", user.id);
      await supabase.from("follows").delete().eq("following_id", user.id);
      await supabase.from("notifications").delete().eq("user_id", user.id);
      await supabase.from("job_applications").delete().eq("user_id", user.id);
      await supabase.from("posts").delete().eq("author_id", user.id);
      await supabase.from("jobs").delete().eq("company_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
      await signOut();
      router.push("/");
    } catch (err) { console.error("Delete account error:", err); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-text-secondary" />
        <h2 className="text-xl font-extrabold">Настройки</h2>
      </div>

      <div className="flex gap-1 bg-bg-card border border-border rounded-card p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-button text-sm font-medium transition-all",
              tab === key ? "bg-accent-soft text-accent font-semibold" : "text-text-secondary hover:text-text-primary",
              key === "danger" && tab === key && "!bg-red-500/10 !text-red-400")}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "account" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold mb-1 flex items-center gap-2"><Lock size={18} /> Сменить пароль</h3>
            <p className="text-sm text-text-secondary mb-4">Рекомендуем надёжный пароль из 8+ символов</p>
            <div className="space-y-3 max-w-md">
              <div className="relative">
                <input className="input-field !pr-10" type={showPasswords ? "text" : "password"}
                  placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <button onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors">
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input className="input-field" type={showPasswords ? "text" : "password"}
                placeholder="Подтвердите пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {passwordMsg && (
                <div className={`text-sm px-3 py-2 rounded-button ${passwordMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {passwordMsg.text}
                </div>
              )}
              <button className="btn-primary text-sm" onClick={handlePasswordChange} disabled={passwordLoading || !newPassword || !confirmPassword}>
                {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Сменить пароль
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold mb-1 flex items-center gap-2"><Mail size={18} /> Сменить email</h3>
            <p className="text-sm text-text-secondary mb-4">Текущий: <span className="text-text-primary font-medium">{user.email}</span></p>
            <div className="space-y-3 max-w-md">
              <input className="input-field" type="email" placeholder="Новый email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              {emailMsg && (
                <div className={`text-sm px-3 py-2 rounded-button ${emailMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                  {emailMsg.text}
                </div>
              )}
              <button className="btn-primary text-sm" onClick={handleEmailChange} disabled={emailLoading || !newEmail}>
                {emailLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Сменить email
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "privacy" && (
        <div className="card p-6">
          <h3 className="font-bold mb-1 flex items-center gap-2"><Shield size={18} /> Приватность</h3>
          <p className="text-sm text-text-secondary mb-6">Управляйте видимостью профиля</p>
          <div className="space-y-5 max-w-md">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Публичный профиль</p>
                <p className="text-xs text-text-tertiary mt-0.5">Ваш профиль виден всем</p>
              </div>
              <div className={cn("w-11 h-6 rounded-full transition-all relative", profilePublic ? "bg-accent" : "bg-bg-tertiary")}
                onClick={() => setProfilePublic(!profilePublic)}>
                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", profilePublic ? "left-[22px]" : "left-0.5")} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium">Показывать email</p>
                <p className="text-xs text-text-tertiary mt-0.5">Другие смогут видеть ваш email</p>
              </div>
              <div className={cn("w-11 h-6 rounded-full transition-all relative", showEmail ? "bg-accent" : "bg-bg-tertiary")}
                onClick={() => setShowEmail(!showEmail)}>
                <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", showEmail ? "left-[22px]" : "left-0.5")} />
              </div>
            </label>
            <button className="btn-primary text-sm" onClick={handleSavePrivacy} disabled={privacyLoading}>
              {privacySaved ? <><Check size={14} /> Сохранено!</> : privacyLoading ? <Loader2 size={14} className="animate-spin" /> : "Сохранить"}
            </button>
          </div>
        </div>
      )}

      {tab === "danger" && (
        <div className="card p-6 border-red-500/20">
          <h3 className="font-bold mb-1 flex items-center gap-2 text-red-400"><AlertTriangle size={18} /> Удаление аккаунта</h3>
          <p className="text-sm text-text-secondary mb-6">Это действие необратимо. Все данные будут удалены навсегда.</p>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
            <p className="text-sm text-text-secondary mb-3">Для подтверждения введите <span className="font-bold text-red-400">УДАЛИТЬ</span></p>
            <input className="input-field max-w-xs !border-red-500/30 focus:!border-red-500"
              placeholder="УДАЛИТЬ" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
          </div>
          <button className="px-5 py-2 rounded-button font-semibold text-sm text-white cursor-pointer transition-all duration-200 inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDeleteAccount} disabled={deleteLoading || deleteConfirm !== "УДАЛИТЬ"}>
            {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Удалить аккаунт навсегда
          </button>
        </div>
      )}
    </div>
  );
}
