# ConnectHub — Профессиональная социальная сеть для IT и стартапов

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss)

> LinkedIn + Facebook + VK — объединение для IT-профессионалов и стартапов СНГ

## Фичи

- **Два типа аккаунтов**: Специалист и Бизнес/Стартап
- **Лента постов**: публикации, лайки, комментарии, сохранение, фильтры
- **Опросы**: голосование с визуальными progress-барами
- **Вакансии**: публикация, поиск, отклики, фильтрация
- **Профили**: аватары, навыки, верификация, биография
- **Адаптивный дизайн**: desktop + mobile с bottom-навигацией
- **Авторизация**: email/пароль через Supabase Auth
- **RLS**: Row Level Security — безопасность на уровне базы данных

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 3.4 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| State | Zustand |
| Icons | Lucide React |
| Deploy | Vercel |

---

## Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/connecthub.git
cd connecthub
npm install
```

### 2. Создай проект в Supabase

1. Иди на [supabase.com](https://supabase.com) → **New Project**
2. Выбери регион (EU West для СНГ)
3. Сохрани **URL** и **anon key** из **Settings → API**

### 3. Настрой переменные окружения

```bash
cp .env.local.example .env.local
```

Открой `.env.local` и вставь свои ключи:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. Создай таблицы в базе

1. В Supabase Dashboard → **SQL Editor**
2. Скопируй и выполни `scripts/schema.sql`
3. Если база уже была создана на старой версии проекта, сначала выполни `scripts/migrate-2026-04.sql`
4. Затем выполни `scripts/seed.sql` (демо-данные)

### 5. Запусти локально

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

Дополнительные проверки:

```bash
npm run lint
npm run typecheck
```

---

## Деплой на Vercel

### Вариант A: Через GitHub (рекомендуется)

1. Залей проект на GitHub:
```bash
git init
git add .
git commit -m "Initial commit: ConnectHub MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/connecthub.git
git push -u origin main
```

2. Иди на [vercel.com](https://vercel.com) → **Import Project** → выбери репозиторий

3. В настройках добавь **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Нажми **Deploy** — готово!

### Вариант B: Через CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

При первом запуске Vercel спросит настройки — выбери Next.js framework.

---

## Настройка Supabase Auth

В Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app` (или `http://localhost:3000` для dev)
- **Redirect URLs**: добавь `https://your-app.vercel.app/auth/callback`

---

## Структура проекта

```
connecthub/
├── scripts/
│   ├── schema.sql          # Таблицы и RLS
│   └── seed.sql            # Демо-данные
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home (лента)
│   │   ├── jobs/page.tsx   # Вакансии
│   │   ├── profile/page.tsx # Профиль
│   │   └── auth/callback/  # Supabase auth callback
│   ├── components/
│   │   ├── auth/           # Модалка авторизации
│   │   ├── feed/           # Лента, посты, composer
│   │   ├── jobs/           # Карточки вакансий
│   │   ├── layout/         # Header, Sidebar, MobileNav
│   │   ├── profile/        # Страница профиля
│   │   └── ui/             # Avatar и другие UI-компоненты
│   ├── hooks/              # useAuth
│   ├── lib/
│   │   ├── supabase/       # Supabase clients (browser/server)
│   │   ├── store.ts        # Zustand store
│   │   └── utils.ts        # Утилиты
│   ├── styles/globals.css  # Tailwind + кастомные стили
│   ├── types/index.ts      # TypeScript типы
│   └── middleware.ts       # Auth session refresh
├── tailwind.config.ts
├── next.config.js
├── package.json
└── README.md
```

---

## Монетизация (следующие этапы)

- **Продвижение вакансий**: от 990 ₽/мес за бизнес-аккаунт
- **Продвижение резюме**: от 490 ₽/мес для специалистов
- **Verified-бейдж**: платная верификация для компаний
- **Promoted posts**: рекламные посты в ленте

---

## Лицензия

MIT
