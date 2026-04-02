"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Briefcase,
  Building2,
  CheckCircle2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { useAuth } from "@/hooks/useAuth";

const featureCards = [
  {
    title: "Лента без лишнего шума",
    description: "Публикуйте апдейты, делитесь запуском, собирайте обратную связь и смотрите, что происходит у других команд.",
    icon: Sparkles,
  },
  {
    title: "Вакансии и отклики",
    description: "Бизнес-аккаунты публикуют роли, а специалисты откликаются без прыжков между отдельными сервисами.",
    icon: Briefcase,
  },
  {
    title: "Профили с приватностью",
    description: "Можно управлять видимостью профиля и контактов, а не держать всё в открытом доступе по умолчанию.",
    icon: ShieldCheck,
  },
  {
    title: "Сохранённое под рукой",
    description: "Инсайты, вакансии и сильные посты не теряются в ленте: всё важное можно собрать в отдельный список.",
    icon: Bookmark,
  },
  {
    title: "Для людей и для компаний",
    description: "Один продукт для специалистов, стартапов и бизнес-аккаунтов, которым нужен нетворкинг и найм.",
    icon: Building2,
  },
  {
    title: "Основа для роста",
    description: "Следом идут репосты, аналитика и рекомендательная лента, чтобы контент и профили росли органично.",
    icon: BarChart3,
  },
];

const audienceCards = [
  {
    title: "Фаундерам и стартапам",
    description: "Рассказывайте о продукте, ищите первых сотрудников, партнёров, инвесторский интерес и полезные знакомства.",
  },
  {
    title: "Специалистам",
    description: "Собирайте сильный профиль, делитесь опытом, находите вакансии и выстраивайте профессиональный бренд.",
  },
  {
    title: "Бизнес-аккаунтам",
    description: "Усиливайте employer brand, публикуйте вакансии, продвигайте экспертизу команды и держите контакт с рынком.",
  },
];

const launchSteps = [
  {
    title: "Создайте профиль",
    description: "Укажите, кто вы: специалист, стартап или бизнес. Это сразу формирует релевантную витрину профиля.",
  },
  {
    title: "Публикуйте и сохраняйте",
    description: "Запуски, мысли, вакансии, полезные материалы и опросы собираются в одном рабочем потоке.",
  },
  {
    title: "Растите сеть контактов",
    description: "Находите людей, команды и возможности через контент, вакансии, профили и живой продуктовый контекст.",
  },
];

export function LandingPage() {
  const { openAuthModal } = useAuth();

  return (
    <MarketingShell>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-24 pb-14">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary/80 px-4 py-2 text-sm text-text-secondary">
              <Rocket size={16} className="text-accent" />
              Платформа для стартапов, IT-команд и бизнеса
            </div>

            <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.02] max-w-[11ch]">
              Где стартапы находят команду, а специалисты реальные возможности.
            </h1>

            <p className="mt-5 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
              ConnectHub объединяет ленту, профили, вакансии и деловой нетворкинг в одном месте. Меньше шума, больше смысла,
              контекста и полезных связей.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <button type="button" className="btn-primary" onClick={() => openAuthModal("register")}>
                Создать профиль
                <ArrowRight size={16} />
              </button>
              <Link href="/jobs" className="btn-ghost">
                Смотреть вакансии
              </Link>
              <Link href="/about" className="btn-ghost">
                Узнать о проекте
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mt-8">
              <div className="card p-4">
                <p className="text-sm font-semibold">Посты и апдейты</p>
                <p className="text-sm text-text-secondary mt-2">Запуски, инсайты, обратная связь и рабочий контекст без хаоса.</p>
              </div>
              <div className="card p-4">
                <p className="text-sm font-semibold">Вакансии и найм</p>
                <p className="text-sm text-text-secondary mt-2">Компании публикуют роли, кандидаты откликаются напрямую.</p>
              </div>
              <div className="card p-4">
                <p className="text-sm font-semibold">Нетворкинг по делу</p>
                <p className="text-sm text-text-secondary mt-2">Люди находят друг друга через продуктовый и карьерный сигнал.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-accent/20 via-transparent to-accent2/10 blur-2xl" />
            <div className="relative card p-4 md:p-5 shadow-[0_24px_120px_rgba(99,102,241,0.18)]">
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-border bg-bg-secondary/80 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">Пример ленты</p>
                      <h2 className="mt-2 text-xl font-bold">Запускаем private beta для B2B-платежей</h2>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <Rocket size={20} />
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mt-4 leading-relaxed">
                    Ищем первого growth-аналитика и партнёров для пилотов. Открыты к интро и полезным комментариям от рынка.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="tag">Beta launch</span>
                    <span className="tag-tech">FinTech</span>
                    <span className="tag-tech">Hiring</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-[24px] border border-border bg-bg-secondary/80 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">Вакансия</p>
                    <h3 className="mt-2 text-lg font-bold">Senior Frontend Engineer</h3>
                    <p className="text-sm text-text-secondary mt-2">Стартап на стадии роста, продуктовая команда, удалёнка или гибрид.</p>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-4">
                      <Briefcase size={16} className="text-accent" />
                      React, TypeScript, Product mindset
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-border bg-bg-secondary/80 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-text-tertiary">Что внутри</p>
                    <div className="space-y-3 mt-4">
                      {[
                        "Профессиональные профили",
                        "Лента запусков и идей",
                        "Сохранённые посты и вакансии",
                        "Настройки приватности",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                          <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Возможности</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">То, что помогает расти уже сейчас</h2>
          <p className="mt-4 text-text-secondary text-lg">
            Мы собираем в одном месте ключевые действия, которые обычно раскиданы по нескольким продуктам.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <div key={title} className="card p-5 card-hover">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="audience" className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start">
          <div className="card p-6 md:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent2">Для кого</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Одна сеть для разных ролей, один общий контекст</h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              ConnectHub создаётся не как ещё одна generic social network, а как место, где профессиональные сигналы и деловые контакты
              выглядят естественно.
            </p>
            <div className="mt-6 space-y-3">
              {[
                "Стартапы получают площадку для апдейтов, найма и видимости.",
                "Специалисты формируют живой профиль и карьерный сигнал через контент.",
                "Бизнес-команды строят бренд и поддерживают постоянный контакт с рынком.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle2 size={16} className="text-accent mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {audienceCards.map((card, index) => (
              <div key={card.title} className="card p-5">
                <div className="w-11 h-11 rounded-2xl bg-bg-tertiary text-accent flex items-center justify-center">
                  {index === 0 ? <Rocket size={20} /> : index === 1 ? <Users size={20} /> : <Building2 size={20} />}
                </div>
                <h3 className="mt-4 text-lg font-bold">{card.title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="card p-6 md:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Как начать</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Войти в ритм платформы можно за несколько минут</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {launchSteps.map(({ title, description }, index) => (
              <div key={title} className="rounded-[22px] border border-border bg-bg-secondary/80 p-5">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center font-bold">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="relative overflow-hidden rounded-[30px] border border-border bg-bg-secondary px-6 py-8 md:px-10 md:py-10">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-accent/10 to-transparent pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent2">Следующий шаг</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Займите место в сети, пока она растёт вместе с комьюнити</h2>
              <p className="mt-3 text-text-secondary text-lg">
                Профили, вакансии, сохранённое и настройки уже работают. Дальше добавляем репосты, аналитику и более умную ленту.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => openAuthModal("register")}>
                Присоединиться
                <ArrowRight size={16} />
              </button>
              <Link href="/about" className="btn-ghost">
                Читать о проекте
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
