"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Globe2,
  MessageSquareMore,
  Repeat2,
  Rocket,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { useAuth } from "@/hooks/useAuth";

const principles = [
  {
    title: "Профессиональный сигнал без лишнего шума",
    description: "Мы хотим, чтобы контент, связи и вакансии работали на карьеру и бизнес, а не растворялись в случайном охвате.",
    icon: Sparkles,
  },
  {
    title: "Стартаповый контекст по умолчанию",
    description: "Продукт создаётся вокруг запусков, роста, найма, фидбэка и деловых знакомств, а не вокруг абстрактного social feed.",
    icon: Rocket,
  },
  {
    title: "Один профиль, несколько сценариев роста",
    description: "Специалисты, компании и стартапы используют одну экосистему, но видят для себя разную ценность внутри неё.",
    icon: Users,
  },
];

const currentModules = [
  "Лента постов, запусков и идей",
  "Профили специалистов и бизнес-аккаунтов",
  "Вакансии и отклики внутри платформы",
  "Сохранённые посты и быстрый доступ к ним",
  "Настройки приватности и управление аккаунтом",
  "Светлая и тёмная тема интерфейса",
];

const roadmapCards = [
  {
    title: "Репосты",
    description: "Больше вторичного распространения сильного контента и больше поводов для повторного вовлечения.",
    icon: Repeat2,
  },
  {
    title: "Рекомендательная лента",
    description: "Лента станет умнее и начнёт лучше подбирать релевантные посты, команды и карьерные сигналы.",
    icon: BarChart3,
  },
  {
    title: "Аналитика профиля",
    description: "Особенно полезно для бизнес-аккаунтов, которым важно понимать охваты, просмотры и интерес к профилю.",
    icon: Briefcase,
  },
  {
    title: "Мессенджер",
    description: "Следующий большой шаг в сторону живых коммуникаций между специалистами, стартапами и компаниями.",
    icon: MessageSquareMore,
  },
  {
    title: "Резюме-конструктор",
    description: "Уникальный инструмент, который поможет превращать профиль в понятный карьерный артефакт.",
    icon: ScrollText,
  },
  {
    title: "Мультиязычность",
    description: "Основа для выхода за пределы одной языковой аудитории и более широкого роста платформы.",
    icon: Globe2,
  },
];

export function AboutPage() {
  const { openAuthModal } = useAuth();

  return (
    <MarketingShell>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-14">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">О проекте</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-3xl">
              ConnectHub строится как профессиональная сеть нового типа для стартапов, IT и бизнеса.
            </h1>
            <p className="mt-5 text-lg text-text-secondary max-w-2xl leading-relaxed">
              Наша идея проста: дать людям и командам пространство, где запуск продукта, поиск работы, найм, личный бренд и деловые
              знакомства связаны между собой естественно, а не через набор разрозненных сервисов.
            </p>
          </div>

          <div className="card p-6 md:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent2">Зачем мы это делаем</p>
            <div className="space-y-4 mt-5 text-text-secondary leading-relaxed">
              <p>
                Вокруг стартапов и бизнеса много общения, но мало среды, где профессиональный контекст сам помогает строить доверие и
                находить нужных людей.
              </p>
              <p>
                ConnectHub нужен для того, чтобы профиль, контент и возможности не жили отдельно друг от друга. Когда человек видит
                ваш путь, экспертизу и текущие задачи в одном месте, ценность контакта становится выше.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {principles.map(({ title, description, icon: Icon }) => (
            <div key={title} className="card p-5">
              <div className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
          <div className="card p-6 md:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Что уже доступно</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Основа продукта уже собрана</h2>
            <p className="mt-4 text-text-secondary leading-relaxed">
              ConnectHub уже можно использовать как рабочую площадку для контента, вакансий, профилей и базового нетворкинга.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {currentModules.map((item) => (
              <div key={item} className="rounded-[22px] border border-border bg-bg-secondary/80 p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-bg-tertiary text-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles size={18} />
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent2">Roadmap</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-black tracking-tight">Следующий слой роста уже намечен</h2>
          <p className="mt-4 text-lg text-text-secondary">
            Мы развиваем платформу постепенно: сначала усиливаем ежедневную пользу, затем engagement, а после этого монетизацию и
            масштабирование.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
          {roadmapCards.map(({ title, description, icon: Icon }) => (
            <div key={title} className="card p-5 card-hover">
              <div className="w-11 h-11 rounded-2xl bg-accent2/10 text-accent2 flex items-center justify-center">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12 md:pb-16">
        <div className="rounded-[30px] border border-border bg-bg-secondary px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Присоединиться</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Если тебе близка эта идея, заходи в продукт уже сейчас</h2>
              <p className="mt-3 text-lg text-text-secondary">
                Можно сразу посмотреть вакансии, зарегистрировать профиль и занять своё место в растущем профессиональном графе.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => openAuthModal("register")}>
                Создать аккаунт
                <ArrowRight size={16} />
              </button>
              <Link href="/jobs" className="btn-ghost">
                Смотреть вакансии
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
