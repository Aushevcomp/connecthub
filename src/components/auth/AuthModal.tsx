"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { AccountType } from "@/types";

export function AuthModal() {
  const { authModalOpen, closeAuthModal } = useAppStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  if (!authModalOpen) return null;

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password) {
      setError("Заполните email и пароль");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        if (!form.name) {
          setError("Укажите имя");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              name: form.name,
              account_type: accountType,
              company: form.company || null,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: data.user.id,
            email: form.email,
            name: form.name,
            account_type: accountType,
            company: accountType === "business" ? form.company : null,
            skills: [],
            followers_count: 0,
            following_count: 0,
            is_verified: false,
          });
          if (profileError) console.error("Profile error:", profileError);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) throw signInError;
      }

      closeAuthModal();
      setForm({ name: "", email: "", password: "", company: "" });
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-up"
      onClick={closeAuthModal}>
      <div className="bg-bg-secondary border border-border rounded-2xl p-8 w-full max-w-[420px] shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-extrabold">
              {mode === "login" ? "Вход" : "Регистрация"}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {mode === "login" ? "С возвращением!" : "Создайте аккаунт ConnectHub"}
            </p>
          </div>
          <button onClick={closeAuthModal}
            className="w-9 h-9 rounded-[10px] bg-bg-tertiary text-text-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Account Type (register only) */}
        {mode === "register" && (
          <>
            <label className="text-sm font-semibold text-text-secondary mb-2 block">Тип аккаунта</label>
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                className={`p-4 rounded-button border text-center transition-all ${
                  accountType === "user"
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:border-accent"
                }`}
                onClick={() => setAccountType("user")}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-semibold">Специалист</div>
                <div className="text-[11px] text-text-secondary mt-1">Ищу работу, делюсь опытом</div>
              </button>
              <button
                className={`p-4 rounded-button border text-center transition-all ${
                  accountType === "business"
                    ? "border-accent bg-accent-soft"
                    : "border-border hover:border-accent"
                }`}
                onClick={() => setAccountType("business")}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="text-sm font-semibold">Бизнес / Стартап</div>
                <div className="text-[11px] text-text-secondary mt-1">Публикую вакансии, развиваю бренд</div>
              </button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-semibold text-text-secondary mb-1.5 block">
                {accountType === "business" ? "Название компании" : "Имя и фамилия"}
              </label>
              <input
                className="input-field"
                placeholder={accountType === "business" ? "Моя компания" : "Иван Иванов"}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {accountType === "business" && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Индустрия</label>
                <input
                  className="input-field"
                  placeholder="IT / FinTech / EdTech..."
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            )}
          </>
        )}

        {/* Email & Password */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Email</label>
          <input
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-semibold text-text-secondary mb-1.5 block">Пароль</label>
          <input
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-button px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary w-full justify-center h-11 text-[15px] mt-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
        </button>

        {mode === "register" && (
          <p className="text-[11px] text-text-tertiary text-center mt-3">
            Регистрация бесплатна. Для бизнес-аккаунтов — публикация вакансий от 990 ₽/мес
          </p>
        )}

        {/* Toggle */}
        <p className="text-sm text-text-secondary text-center mt-4">
          {mode === "login" ? (
            <>Нет аккаунта?{" "}
              <button className="text-accent font-semibold hover:underline" onClick={() => { setMode("register"); setError(""); }}>
                Зарегистрироваться
              </button>
            </>
          ) : (
            <>Уже есть аккаунт?{" "}
              <button className="text-accent font-semibold hover:underline" onClick={() => { setMode("login"); setError(""); }}>
                Войти
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
