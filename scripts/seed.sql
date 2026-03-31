-- ═══════════════════════════════════════════
-- ConnectHub — Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- NOTE: These use fixed UUIDs for demo.
-- Real users come from auth.users → trigger → profiles
-- ═══════════════════════════════════════════

-- ── Demo Profiles (inserted directly for demo, bypassing auth) ──
INSERT INTO profiles (id, email, name, account_type, role, company, location, skills, followers_count, is_verified, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'techflow@demo.com', 'TechFlow', 'business', NULL, 'AI / ML', 'Москва', '{}', 2840, TRUE, 'AI-powered workflow automation for modern teams.'),
  ('00000000-0000-0000-0000-000000000002', 'pixelforge@demo.com', 'PixelForge', 'business', NULL, 'GameDev', 'Санкт-Петербург', '{}', 1203, FALSE, 'Next-gen game engine for indie developers.'),
  ('00000000-0000-0000-0000-000000000003', 'cloudnest@demo.com', 'CloudNest', 'business', NULL, 'DevOps / Cloud', 'Алматы', '{}', 5612, TRUE, 'Cloud infrastructure built for the CIS market.'),
  ('00000000-0000-0000-0000-000000000004', 'datapulse@demo.com', 'DataPulse', 'business', NULL, 'Data / Analytics', 'Минск', '{}', 892, FALSE, 'Real-time analytics dashboard for startups.'),
  ('00000000-0000-0000-0000-000000000011', 'alexey@demo.com', 'Алексей Кузнецов', 'user', 'Senior Frontend Developer', 'TechFlow', 'Москва', ARRAY['React','TypeScript','Next.js'], 847, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000012', 'maria@demo.com', 'Мария Иванова', 'user', 'Product Manager', 'CloudNest', 'Алматы', ARRAY['Agile','Analytics','Strategy'], 1243, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000013', 'dmitry@demo.com', 'Дмитрий Соколов', 'user', 'DevOps Engineer', 'Freelance', 'Тбилиси', ARRAY['Kubernetes','AWS','Terraform'], 562, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000014', 'anna@demo.com', 'Анна Петрова', 'user', 'UX/UI Designer', 'PixelForge', 'Санкт-Петербург', ARRAY['Figma','Research','Prototyping'], 923, FALSE, NULL),
  ('00000000-0000-0000-0000-000000000015', 'ibragim@demo.com', 'Ибрагим Хасанов', 'user', 'Backend Developer', 'DataPulse', 'Минск', ARRAY['Python','Go','PostgreSQL'], 415, FALSE, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Demo Posts ──
INSERT INTO posts (id, author_id, content, tags, likes_count, comments_count, shares_count, views_count, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   E'Мы только что закрыли раунд Series A на $5M! 🚀\n\nСпасибо всем, кто верил в нас с самого начала. Теперь наша команда вырастет x3, и мы запустим новый AI-модуль для автоматизации бизнес-процессов.\n\nОткрываем 12 новых позиций — ссылки в вакансиях!',
   ARRAY['startup','fundraising','AI'], 284, 47, 23, 3420, NOW() - INTERVAL '2 hours'),

  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011',
   E'Сегодня выступал на митапе React Moscow 🎤\n\nРассказал про паттерны оптимизации рендеринга в крупных SPA. 400+ слушателей онлайн!\n\nСлайды скину в комменты. Кто был — какие впечатления?',
   ARRAY['react','frontend','meetup'], 156, 32, 18, 2100, NOW() - INTERVAL '4 hours'),

  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002',
   'Запускаем опрос для комьюнити! Какую фичу добавить в движок первой?',
   ARRAY['gamedev','community'], 89, 15, 5, 1340, NOW() - INTERVAL '6 hours'),

  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000014',
   E'Провела UX-исследование для 3 продуктов за месяц. Главный инсайт: пользователи не читают онбординг. Никогда. Совсем. 😅\n\nДелюсь топ-5 паттернов, которые реально работают:\n\n1. Progressive disclosure — показываем функции по мере использования\n2. Empty states как обучение\n3. Интерактивные тултипы вместо модалок\n4. Чеклисты прогресса\n5. Контекстные подсказки в момент действия',
   ARRAY['UX','design','research'], 312, 56, 41, 4780, NOW() - INTERVAL '8 hours'),

  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000013',
   E'Мигрировал кластер из 47 микросервисов с Docker Swarm на Kubernetes за выходные. Без даунтайма. AMA! 🐳➡️☸️',
   ARRAY['devops','kubernetes','migration'], 198, 87, 12, 2890, NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- ── Demo Poll ──
INSERT INTO polls (id, post_id, question, ends_at) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Какую фичу добавить в движок первой?', NOW() + INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO poll_options (id, poll_id, text, votes_count) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '🎨 Визуальный редактор шейдеров', 142),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '🌐 Мультиплеер из коробки', 203),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '📱 Экспорт в мобильные платформы', 178),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '🤖 Встроенный AI для NPC', 95)
ON CONFLICT (id) DO NOTHING;

-- ── Demo Jobs ──
INSERT INTO jobs (id, company_id, title, location, salary_min, salary_max, salary_currency, employment_type, experience_level, tags, is_hot, applicants_count, created_at) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Senior React Developer', 'Москва (гибрид)', 350000, 500000, '₽', 'full-time', '3+ лет', ARRAY['React','TypeScript','GraphQL'], TRUE, 23, NOW() - INTERVAL '1 day'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'DevOps Engineer', 'Алматы / Удалённо', 4000, 6000, '$', 'full-time', '2+ лет', ARRAY['Kubernetes','AWS','CI/CD'], FALSE, 15, NOW() - INTERVAL '3 days'),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 'Game Developer (Godot)', 'Удалённо', 200000, 350000, '₽', 'full-time', '1+ год', ARRAY['Godot','GDScript','C#'], TRUE, 41, NOW() - INTERVAL '5 days'),
  ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Python Backend Developer', 'Минск / Удалённо', 3000, 5000, '$', 'full-time', '2+ лет', ARRAY['Python','FastAPI','PostgreSQL'], FALSE, 8, NOW() - INTERVAL '7 days'),
  ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Product Manager', 'Москва', 400000, 600000, '₽', 'full-time', '3+ лет', ARRAY['Agile','B2B','SaaS'], FALSE, 19, NOW() - INTERVAL '2 days'),
  ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'Frontend Developer (Vue.js)', 'Алматы', 2500, 4000, '$', 'full-time', '1+ год', ARRAY['Vue.js','Nuxt','TypeScript'], FALSE, 27, NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;
