# Montessori Homeschool Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, subscription-based Montessori homeschool platform for K-6th grade with 36-week day-by-day curriculum, live Zoom classes, AI-generated content with TTS audio, progress tracking, and Stripe billing.

**Architecture:** Next.js 14+ App Router with TypeScript and Tailwind CSS for the full-stack application. Supabase provides PostgreSQL database, authentication, row-level security, and file storage. Stripe handles subscription billing with webhook-driven status management.

**Tech Stack:** Next.js 14+, TypeScript, React, Tailwind CSS, Supabase (PostgreSQL, Auth, Storage, RLS), Stripe, ElevenLabs TTS, Vercel

**Design Doc:** `docs/plans/2026-02-23-montessori-platform-design.md`

---

## Prerequisites — What You Need Set Up

Before starting implementation, the developer needs:

1. **Node.js 20+** — `node --version` should show v20+
2. **pnpm** — `npm install -g pnpm` (our package manager)
3. **Git** — initialized in the project root
4. **Supabase account** — Create a project at https://supabase.com
   - You'll need: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Settings → API
   - Also: `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
5. **Stripe account** — Create at https://stripe.com
   - You'll need: `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from Developers → API keys
   - Create a Product with a $50/month recurring Price — note the `price_id`
   - Set up a webhook endpoint (done in Phase 1, Task 7)
6. **ElevenLabs account** (Phase 2) — For TTS audio generation
7. **Vercel account** (Phase 6) — For deployment

---

## PHASE 1: Foundation

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.env.local`, `.gitignore`

**Step 1: Create Next.js app with all defaults**

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

Accept all defaults. This scaffolds the project in the current directory.

**Step 2: Verify it runs**

```bash
pnpm dev
```

Open http://localhost:3000 — should see the Next.js welcome page. Stop the dev server.

**Step 3: Install core dependencies**

```bash
pnpm add @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js zustand date-fns clsx
pnpm add -D supabase @types/node
```

**Step 4: Create `.env.local`**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_PRICE_ID=your_price_id

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 5: Add `.env.local` to `.gitignore`** (should already be there from Next.js scaffold, verify)

**Step 6: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js project with core dependencies"
```

---

### Task 2: Set Up Supabase Client Utilities

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`

**Step 1: Create browser client**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware helper**

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except public pages)
  const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/api/webhooks']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith('/api/webhooks')
  )

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 4: Create middleware.ts at project root**

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 5: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts
git commit -m "feat: add Supabase client utilities and auth middleware"
```

---

### Task 3: Database Schema — Core Tables

**Files:**
- Create: `supabase/migrations/001_core_schema.sql`

**Step 1: Write the full core schema migration**

```sql
-- supabase/migrations/001_core_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'student');
CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'withdrawn');
CREATE TYPE class_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');
CREATE TYPE payment_status AS ENUM ('paid', 'failed', 'refunded');
CREATE TYPE grade_band AS ENUM ('primary', 'lower_elementary', 'upper_elementary');

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'parent',
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  grade_band grade_band NOT NULL,
  enrollment_status enrollment_status DEFAULT 'active',
  stripe_subscription_id TEXT,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  start_week INTEGER DEFAULT 1 CHECK (start_week BETWEEN 1 AND 36),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teachers
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  qualifications TEXT,
  zoom_link TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_substitute BOOLEAN DEFAULT FALSE,
  max_classes INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher availability
CREATE TABLE teacher_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE
);

-- Classes (weekly Zoom sessions)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  grade_band grade_band NOT NULL,
  title TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  zoom_link TEXT,
  max_students INTEGER DEFAULT 20,
  academic_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  status class_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments (student ↔ class)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status enrollment_status DEFAULT 'active',
  UNIQUE(student_id, class_id)
);

-- Class sessions (individual weekly meetings)
CREATE TABLE class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 36),
  substitute_teacher_id UUID REFERENCES teachers(id),
  zoom_link_override TEXT,
  status session_status DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  status payment_status DEFAULT 'paid',
  paid_at TIMESTAMPTZ
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'parent',
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Step 2: Run the migration against Supabase**

Option A (via Supabase CLI):
```bash
pnpm supabase db push
```

Option B (via SQL Editor in Supabase Dashboard):
Copy the SQL and run it in the SQL Editor at https://supabase.com/dashboard

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add core database schema (profiles, students, teachers, classes, payments)"
```

---

### Task 4: Database Schema — Curriculum Tables

**Files:**
- Create: `supabase/migrations/002_curriculum_schema.sql`

**Step 1: Write the curriculum schema migration**

```sql
-- supabase/migrations/002_curriculum_schema.sql

-- Custom types for curriculum
CREATE TYPE lesson_type AS ENUM ('guided', 'independent', 'project', 'review', 'great_lesson', 'assessment');
CREATE TYPE mastery_status AS ENUM ('not_introduced', 'presented', 'practicing', 'developing', 'mastered', 'applied');
CREATE TYPE independence_level AS ENUM ('needs_presentation', 'needs_prompt', 'independent');
CREATE TYPE observation_type AS ENUM ('anecdotal', 'work_log', 'concentration', 'social_emotional');
CREATE TYPE lesson_progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE portfolio_item_type AS ENUM ('work_sample', 'photo', 'video', 'writing', 'project', 'art');

-- Curriculum levels
CREATE TABLE curriculum_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  age_range TEXT NOT NULL,
  daily_hours NUMERIC NOT NULL,
  description TEXT
);

-- Seed curriculum levels
INSERT INTO curriculum_levels (name, display_name, age_range, daily_hours, description) VALUES
  ('primary', 'Primary (K)', '5-6', 2.5, 'Kindergarten — focus on practical life, sensorial, and foundational academics'),
  ('lower_elementary', 'Lower Elementary (1-3)', '6-9', 3.5, 'First through Third grade — Great Lessons, research projects, growing independence'),
  ('upper_elementary', 'Upper Elementary (4-6)', '9-12', 3.5, 'Fourth through Sixth grade — deep research, seminars, cosmic education');

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER NOT NULL
);

-- Seed subjects
INSERT INTO subjects (name, display_name, icon, color, sort_order) VALUES
  ('practical_life', 'Practical Life', 'hand', '#8B7355', 1),
  ('sensorial', 'Sensorial', 'eye', '#9B8EC4', 2),
  ('language', 'Language Arts', 'book-open', '#5B8C5A', 3),
  ('math', 'Mathematics', 'calculator', '#C4785B', 4),
  ('geometry', 'Geometry', 'shapes', '#5B8CC4', 5),
  ('culture', 'Cultural Studies', 'globe', '#C4A35B', 6),
  ('science', 'Science', 'flask', '#5BC4A3', 7),
  ('history', 'History & Timeline', 'clock', '#C45B8C', 8),
  ('geography', 'Geography', 'map', '#7BC45B', 9),
  ('art_music', 'Art & Music', 'palette', '#C45B5B', 10),
  ('read_aloud', 'Read-Aloud', 'headphones', '#5B5BC4', 11);

-- Scope & sequence items (every skill/concept in the Montessori K-6 curriculum)
CREATE TABLE scope_sequence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  sub_area TEXT,
  name TEXT NOT NULL,
  description TEXT,
  prerequisites JSONB DEFAULT '[]',
  materials_needed JSONB DEFAULT '[]',
  mastery_criteria TEXT,
  three_period_applicable BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  common_core_alignment JSONB
);

-- Lessons (the 36-week, day-by-day plan)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  scope_item_id UUID REFERENCES scope_sequence_items(id),
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 36),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  duration_minutes INTEGER NOT NULL,
  lesson_type lesson_type NOT NULL DEFAULT 'guided',
  materials_needed JSONB DEFAULT '[]',
  slide_content JSONB,
  audio_url TEXT,
  parent_notes TEXT,
  age_adaptations JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lesson lookups
CREATE INDEX idx_lessons_level_week_day ON lessons(level_id, week_number, day_of_week);
CREATE INDEX idx_lessons_subject ON lessons(subject_id);

-- Great Lessons
CREATE TABLE great_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_number INTEGER UNIQUE NOT NULL CHECK (lesson_number BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  narrative TEXT NOT NULL,
  demonstrations JSONB DEFAULT '[]',
  materials_needed JSONB DEFAULT '[]',
  slide_content JSONB,
  audio_url TEXT,
  follow_up_weeks INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Great Lesson follow-up activities
CREATE TABLE great_lesson_followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  great_lesson_id UUID NOT NULL REFERENCES great_lessons(id) ON DELETE CASCADE,
  week_offset INTEGER NOT NULL CHECK (week_offset BETWEEN 1 AND 12),
  level_id UUID NOT NULL REFERENCES curriculum_levels(id),
  focus_area TEXT NOT NULL,
  activities JSONB NOT NULL DEFAULT '[]',
  materials_needed JSONB DEFAULT '[]'
);

-- Materials inventory (250+ Montessori materials)
CREATE TABLE materials_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject_area TEXT NOT NULL,
  sub_category TEXT,
  applicable_levels JSONB DEFAULT '[]',
  age_range TEXT,
  image_url TEXT,
  what_it_teaches TEXT,
  prerequisites JSONB DEFAULT '[]',
  next_in_sequence JSONB DEFAULT '[]',
  cross_subject_connections JSONB DEFAULT '[]',
  supplier_links JSONB DEFAULT '[]',
  diy_alternative TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student mastery tracking (per scope & sequence item)
CREATE TABLE student_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  scope_item_id UUID NOT NULL REFERENCES scope_sequence_items(id),
  status mastery_status DEFAULT 'not_introduced',
  date_presented DATE,
  date_mastered DATE,
  three_period_stage INTEGER CHECK (three_period_stage BETWEEN 1 AND 3),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, scope_item_id)
);

-- Student lesson progress (daily work log)
CREATE TABLE student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  status lesson_progress_status DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  duration_actual INTEGER,
  parent_notes TEXT,
  student_self_assessment TEXT,
  UNIQUE(student_id, lesson_id)
);

-- Observations (Montessori-style anecdotal records)
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  observer_id UUID NOT NULL REFERENCES profiles(id),
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  observation_type observation_type DEFAULT 'anecdotal',
  curriculum_area TEXT,
  content TEXT NOT NULL,
  concentration_duration INTEGER,
  independence_level independence_level,
  photo_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work plans
CREATE TABLE work_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  academic_year INTEGER NOT NULL,
  planned_activities JSONB DEFAULT '[]',
  must_do JSONB DEFAULT '[]',
  may_do JSONB DEFAULT '[]',
  reflection_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, week_number, academic_year)
);

-- Quarterly assessments
CREATE TABLE quarterly_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  academic_year INTEGER NOT NULL,
  assessor_id UUID NOT NULL REFERENCES profiles(id),
  practical_life JSONB,
  sensorial JSONB,
  language JSONB,
  math JSONB,
  geometry JSONB,
  culture JSONB,
  social_emotional JSONB,
  normalization_indicators JSONB,
  narrative_summary TEXT,
  goals_next_quarter TEXT,
  portfolio_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, quarter, academic_year)
);

-- Portfolio items
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  item_type portfolio_item_type NOT NULL,
  curriculum_area TEXT,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  date_created DATE DEFAULT CURRENT_DATE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Normalization snapshots
CREATE TABLE normalization_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  love_of_order INTEGER CHECK (love_of_order BETWEEN 1 AND 5),
  love_of_work INTEGER CHECK (love_of_work BETWEEN 1 AND 5),
  spontaneous_concentration INTEGER CHECK (spontaneous_concentration BETWEEN 1 AND 5),
  attachment_to_reality INTEGER CHECK (attachment_to_reality BETWEEN 1 AND 5),
  independence INTEGER CHECK (independence BETWEEN 1 AND 5),
  spontaneous_self_discipline INTEGER CHECK (spontaneous_self_discipline BETWEEN 1 AND 5),
  joy INTEGER CHECK (joy BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers
CREATE TRIGGER work_plans_updated_at BEFORE UPDATE ON work_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER student_mastery_updated_at BEFORE UPDATE ON student_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Step 2: Run migration**

```bash
pnpm supabase db push
```

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add curriculum, tracking, and materials database schema"
```

---

### Task 5: Database Schema — Community & RLS Policies

**Files:**
- Create: `supabase/migrations/003_community_and_rls.sql`

**Step 1: Write community tables + all RLS policies**

```sql
-- supabase/migrations/003_community_and_rls.sql

-- Forum categories
CREATE TABLE forum_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Seed forum categories
INSERT INTO forum_categories (name, description, sort_order) VALUES
  ('General Discussion', 'Open conversations about Montessori homeschooling', 1),
  ('Primary (K)', 'Topics for Primary / Kindergarten families', 2),
  ('Lower Elementary (1-3)', 'Topics for grades 1-3 families', 3),
  ('Upper Elementary (4-6)', 'Topics for grades 4-6 families', 4),
  ('Subject Help', 'Questions about specific subjects and materials', 5),
  ('Materials & DIY', 'Share material ideas and DIY alternatives', 6),
  ('Special Needs & Adaptations', 'Supporting diverse learners', 7),
  ('Introductions', 'Welcome! Introduce yourself and your family', 8);

-- Forum posts
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum replies
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER forum_posts_updated_at BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER forum_replies_updated_at BEFORE UPDATE ON forum_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Helper function: get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE USING (is_admin());

-- ---- STUDENTS ----
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own students"
  ON students FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert their own students"
  ON students FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update their own students"
  ON students FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "Teachers can view enrolled students"
  ON students FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      JOIN teachers t ON c.teacher_id = t.id
      WHERE e.student_id = students.id AND t.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage all students"
  ON students FOR ALL USING (is_admin());

-- ---- TEACHERS ----
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view and update their own record"
  ON teachers FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Public can view active teachers"
  ON teachers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage all teachers"
  ON teachers FOR ALL USING (is_admin());

-- ---- CLASSES ----
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active classes"
  ON classes FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage all classes"
  ON classes FOR ALL USING (is_admin());

-- ---- ENROLLMENTS ----
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their students' enrollments"
  ON enrollments FOR SELECT USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = enrollments.student_id AND s.parent_id = auth.uid())
  );
CREATE POLICY "Parents can insert enrollments for their students"
  ON enrollments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = enrollments.student_id AND s.parent_id = auth.uid())
  );
CREATE POLICY "Admins can manage all enrollments"
  ON enrollments FOR ALL USING (is_admin());

-- ---- CURRICULUM (read-only for non-admins) ----
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_sequence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE great_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE great_lesson_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_inventory ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read curriculum data
CREATE POLICY "Authenticated users can read curriculum levels" ON curriculum_levels FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read subjects" ON subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read scope items" ON scope_sequence_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read lessons" ON lessons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read great lessons" ON great_lessons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read followups" ON great_lesson_followups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can read materials" ON materials_inventory FOR SELECT USING (auth.uid() IS NOT NULL);

-- Admins can manage curriculum
CREATE POLICY "Admins can manage curriculum levels" ON curriculum_levels FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage scope items" ON scope_sequence_items FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage great lessons" ON great_lessons FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage followups" ON great_lesson_followups FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage materials" ON materials_inventory FOR ALL USING (is_admin());

-- ---- TRACKING DATA ----
ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalization_snapshots ENABLE ROW LEVEL SECURITY;

-- Parents own their students' tracking data
CREATE POLICY "Parents can manage their students' mastery" ON student_mastery FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = student_mastery.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' lesson progress" ON student_lesson_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = student_lesson_progress.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' observations" ON observations FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = observations.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' work plans" ON work_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = work_plans.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' assessments" ON quarterly_assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = quarterly_assessments.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' portfolio" ON portfolio_items FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = portfolio_items.student_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Parents can manage their students' normalization" ON normalization_snapshots FOR ALL USING (
  EXISTS (SELECT 1 FROM students s WHERE s.id = normalization_snapshots.student_id AND s.parent_id = auth.uid())
);

-- Teachers can view (not edit) enrolled students' tracking
CREATE POLICY "Teachers can view enrolled students' mastery" ON student_mastery FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON e.class_id = c.id JOIN teachers t ON c.teacher_id = t.id
    WHERE e.student_id = student_mastery.student_id AND t.user_id = auth.uid()
  )
);
CREATE POLICY "Teachers can view enrolled students' progress" ON student_lesson_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON e.class_id = c.id JOIN teachers t ON c.teacher_id = t.id
    WHERE e.student_id = student_lesson_progress.student_id AND t.user_id = auth.uid()
  )
);
-- Teachers can write observations for their enrolled students
CREATE POLICY "Teachers can add observations for enrolled students" ON observations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM enrollments e JOIN classes c ON e.class_id = c.id JOIN teachers t ON c.teacher_id = t.id
    WHERE e.student_id = observations.student_id AND t.user_id = auth.uid()
  )
);

-- Admin full access on all tracking tables
CREATE POLICY "Admins can manage all mastery" ON student_mastery FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all progress" ON student_lesson_progress FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all observations" ON observations FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all work plans" ON work_plans FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all assessments" ON quarterly_assessments FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all portfolio items" ON portfolio_items FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all normalization" ON normalization_snapshots FOR ALL USING (is_admin());

-- ---- SUBSCRIPTIONS ----
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their own subscriptions" ON subscriptions FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can view their payment history" ON payment_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = payment_history.subscription_id AND s.parent_id = auth.uid())
);
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Admins can manage all payments" ON payment_history FOR ALL USING (is_admin());

-- ---- FORUMS ----
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read forum categories" ON forum_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage forum categories" ON forum_categories FOR ALL USING (is_admin());

CREATE POLICY "Anyone authenticated can read forum posts" ON forum_posts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY "Authors can update their own posts" ON forum_posts FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all posts" ON forum_posts FOR ALL USING (is_admin());

CREATE POLICY "Anyone authenticated can read replies" ON forum_replies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());
CREATE POLICY "Authors can update their own replies" ON forum_replies FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all replies" ON forum_replies FOR ALL USING (is_admin());

-- ---- CLASS SESSIONS ----
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view class sessions" ON class_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage class sessions" ON class_sessions FOR ALL USING (is_admin());

CREATE POLICY "Teachers can manage their own availability" ON teacher_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM teachers t WHERE t.id = teacher_availability.teacher_id AND t.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all availability" ON teacher_availability FOR ALL USING (is_admin());
```

**Step 2: Run migration**

```bash
pnpm supabase db push
```

**Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add community tables and row-level security policies"
```

---

### Task 6: TypeScript Database Types

**Files:**
- Create: `src/lib/types/database.ts`

**Step 1: Generate types from Supabase**

```bash
pnpm supabase gen types typescript --project-id your-project-id > src/lib/types/database.ts
```

If the CLI isn't linked yet, manually create the type file:

```typescript
// src/lib/types/database.ts
export type UserRole = 'admin' | 'teacher' | 'parent' | 'student'
export type GradeBand = 'primary' | 'lower_elementary' | 'upper_elementary'
export type EnrollmentStatus = 'active' | 'paused' | 'withdrawn'
export type ClassStatus = 'active' | 'cancelled' | 'completed'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'
export type PaymentStatus = 'paid' | 'failed' | 'refunded'
export type LessonType = 'guided' | 'independent' | 'project' | 'review' | 'great_lesson' | 'assessment'
export type MasteryStatus = 'not_introduced' | 'presented' | 'practicing' | 'developing' | 'mastered' | 'applied'
export type IndependenceLevel = 'needs_presentation' | 'needs_prompt' | 'independent'
export type ObservationType = 'anecdotal' | 'work_log' | 'concentration' | 'social_emotional'
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped'
export type PortfolioItemType = 'work_sample' | 'photo' | 'video' | 'writing' | 'project' | 'art'

export interface Profile {
  id: string
  role: UserRole
  display_name: string
  avatar_url: string | null
  phone: string | null
  timezone: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  parent_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  grade_band: GradeBand
  enrollment_status: EnrollmentStatus
  stripe_subscription_id: string | null
  academic_year: number
  start_week: number
  avatar_url: string | null
  created_at: string
}

export interface Teacher {
  id: string
  user_id: string
  bio: string | null
  qualifications: string | null
  zoom_link: string | null
  is_active: boolean
  is_substitute: boolean
  max_classes: number
  created_at: string
}

export interface Class {
  id: string
  teacher_id: string
  grade_band: GradeBand
  title: string
  day_of_week: number
  start_time: string
  duration_minutes: number
  zoom_link: string | null
  max_students: number
  academic_year: number
  status: ClassStatus
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  class_id: string
  enrolled_at: string
  status: EnrollmentStatus
}

export interface CurriculumLevel {
  id: string
  name: string
  display_name: string
  age_range: string
  daily_hours: number
  description: string | null
}

export interface Subject {
  id: string
  name: string
  display_name: string
  icon: string | null
  color: string | null
  sort_order: number
}

export interface ScopeSequenceItem {
  id: string
  level_id: string
  subject_id: string
  sub_area: string | null
  name: string
  description: string | null
  prerequisites: string[]
  materials_needed: string[]
  mastery_criteria: string | null
  three_period_applicable: boolean
  sort_order: number
  common_core_alignment: Record<string, string> | null
}

export interface Lesson {
  id: string
  level_id: string
  subject_id: string
  scope_item_id: string | null
  week_number: number
  day_of_week: number
  quarter: number
  title: string
  description: string | null
  instructions: string | null
  duration_minutes: number
  lesson_type: LessonType
  materials_needed: string[]
  slide_content: SlideContent | null
  audio_url: string | null
  parent_notes: string | null
  age_adaptations: Record<string, string> | null
  sort_order: number
  created_at: string
}

export interface SlideContent {
  slides: Slide[]
}

export type Slide =
  | { type: 'title'; heading: string; subheading?: string; image_url?: string }
  | { type: 'materials'; items: string[]; setup_instructions?: string }
  | { type: 'instruction'; step: number; text: string; image_url?: string; audio_segment?: string }
  | { type: 'activity'; prompt: string; duration_minutes: number }
  | { type: 'check_understanding'; questions: { q: string; type: 'free_response' | 'yes_no' }[] }
  | { type: 'wrap_up'; text: string; mastery_check?: string }

export interface GreatLesson {
  id: string
  lesson_number: number
  title: string
  narrative: string
  demonstrations: string[]
  materials_needed: string[]
  slide_content: SlideContent | null
  audio_url: string | null
  follow_up_weeks: number
  created_at: string
}

export interface MaterialsInventory {
  id: string
  code: string
  name: string
  description: string | null
  subject_area: string
  sub_category: string | null
  applicable_levels: string[]
  age_range: string | null
  image_url: string | null
  what_it_teaches: string | null
  prerequisites: string[]
  next_in_sequence: string[]
  cross_subject_connections: string[]
  supplier_links: string[]
  diy_alternative: string | null
  created_at: string
}

export interface StudentMastery {
  id: string
  student_id: string
  scope_item_id: string
  status: MasteryStatus
  date_presented: string | null
  date_mastered: string | null
  three_period_stage: number | null
  notes: string | null
  updated_at: string
}

export interface StudentLessonProgress {
  id: string
  student_id: string
  lesson_id: string
  status: LessonProgressStatus
  completed_at: string | null
  duration_actual: number | null
  parent_notes: string | null
  student_self_assessment: string | null
}

export interface Observation {
  id: string
  student_id: string
  observer_id: string
  observation_date: string
  observation_type: ObservationType
  curriculum_area: string | null
  content: string
  concentration_duration: number | null
  independence_level: IndependenceLevel | null
  photo_urls: string[]
  created_at: string
}

export interface WorkPlan {
  id: string
  student_id: string
  week_number: number
  academic_year: number
  planned_activities: string[]
  must_do: string[]
  may_do: string[]
  reflection_notes: string | null
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  parent_id: string
  student_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface ForumPost {
  id: string
  category_id: string
  author_id: string
  title: string
  content: string
  pinned: boolean
  locked: boolean
  created_at: string
  updated_at: string
}

export interface ForumReply {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}
```

**Step 2: Commit**

```bash
git add src/lib/types/
git commit -m "feat: add TypeScript database types"
```

---

### Task 7: Auth Pages (Login/Signup)

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/components/auth/auth-form.tsx`

**Step 1: Create shared auth form component**

```typescript
// src/components/auth/auth-form.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        })
        if (error) throw error
        router.push('/dashboard')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {mode === 'signup' && (
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-stone-700">
            Full Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            placeholder="Your name"
          />
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-green-700 px-4 py-2 text-white font-medium hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
      </button>
    </form>
  )
}
```

**Step 2: Create login page**

```typescript
// src/app/login/page.tsx
import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-stone-800">Welcome Back</h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to your Montessori Homeschool account
          </p>
        </div>
        <AuthForm mode="login" />
        <p className="text-center text-sm text-stone-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-green-700 hover:text-green-800">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Create signup page**

```typescript
// src/app/signup/page.tsx
import { AuthForm } from '@/components/auth/auth-form'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-stone-800">Create Your Account</h1>
          <p className="mt-2 text-sm text-stone-600">
            Start your Montessori homeschool journey
          </p>
        </div>
        <AuthForm mode="signup" />
        <p className="text-center text-sm text-stone-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-green-700 hover:text-green-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

**Step 4: Create auth callback route**

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

**Step 5: Commit**

```bash
git add src/app/login/ src/app/signup/ src/app/auth/ src/components/auth/
git commit -m "feat: add login, signup pages and auth callback"
```

---

### Task 8: Stripe Integration

**Files:**
- Create: `src/lib/stripe/client.ts`
- Create: `src/lib/stripe/server.ts`
- Create: `src/app/api/webhooks/stripe/route.ts`
- Create: `src/app/api/checkout/route.ts`

**Step 1: Create Stripe utilities**

```typescript
// src/lib/stripe/client.ts
import { loadStripe } from '@stripe/stripe-js'

let stripePromise: ReturnType<typeof loadStripe> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}
```

```typescript
// src/lib/stripe/server.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

**Step 2: Create checkout API route**

```typescript
// src/app/api/checkout/route.ts
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { studentId } = await request.json()

  // Get or create Stripe customer
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('parent_id', user.id)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .single()

  let customerId = existingSub?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=cancelled`,
    metadata: {
      supabase_user_id: user.id,
      student_id: studentId,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        student_id: studentId,
      },
    },
  })

  return NextResponse.json({ url: session.url })
}
```

**Step 3: Create webhook handler**

```typescript
// src/app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use service role client for webhooks (no user context)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.supabase_user_id
      const studentId = session.metadata?.student_id
      const subscriptionId = session.subscription as string
      const customerId = session.customer as string

      if (userId && studentId) {
        await supabaseAdmin.from('subscriptions').insert({
          parent_id: userId,
          student_id: studentId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          current_period_start: new Date().toISOString(),
        })

        await supabaseAdmin
          .from('students')
          .update({
            enrollment_status: 'active',
            stripe_subscription_id: subscriptionId,
          })
          .eq('id', studentId)
      }
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object
      const subscriptionId = invoice.subscription as string

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('stripe_subscription_id', subscriptionId)

      await supabaseAdmin.from('payment_history').insert({
        subscription_id: (
          await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()
        ).data?.id,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_paid,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const subscriptionId = invoice.subscription as string

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', subscriptionId)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object

      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('stripe_subscription_id', subscription.id)

      await supabaseAdmin
        .from('students')
        .update({ enrollment_status: 'withdrawn' })
        .eq('stripe_subscription_id', subscription.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

**Step 4: Commit**

```bash
git add src/lib/stripe/ src/app/api/
git commit -m "feat: add Stripe checkout and webhook integration"
```

---

### Task 9: App Layout & Navigation Shell

**Files:**
- Create: `src/app/layout.tsx` (modify existing)
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/lib/hooks/use-profile.ts`

**Step 1: Create profile hook**

```typescript
// src/lib/hooks/use-profile.ts
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/lib/types/database'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [supabase])

  return { profile, loading }
}
```

**Step 2: Create sidebar**

```typescript
// src/components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'
import { clsx } from 'clsx'

const parentLinks = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: '📅' },
  { href: '/dashboard/students', label: 'My Students', icon: '👧' },
  { href: '/dashboard/progress', label: 'Progress', icon: '📊' },
  { href: '/dashboard/classes', label: 'Classes', icon: '🎥' },
  { href: '/dashboard/community', label: 'Community', icon: '💬' },
  { href: '/dashboard/account', label: 'Account', icon: '⚙️' },
]

const teacherLinks = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/schedule', label: 'My Schedule', icon: '📅' },
  { href: '/dashboard/classes', label: 'My Classes', icon: '🎥' },
  { href: '/dashboard/students', label: 'Students', icon: '👧' },
  { href: '/dashboard/profile', label: 'Profile', icon: '⚙️' },
]

const adminLinks = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/dashboard/teachers', label: 'Teachers', icon: '👩‍🏫' },
  { href: '/dashboard/classes', label: 'Classes', icon: '🎥' },
  { href: '/dashboard/students', label: 'Students', icon: '👧' },
  { href: '/dashboard/curriculum', label: 'Curriculum', icon: '📚' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { profile, loading } = useProfile()

  if (loading) return null

  const links = profile?.role === 'admin'
    ? adminLinks
    : profile?.role === 'teacher'
    ? teacherLinks
    : parentLinks

  return (
    <aside className="flex h-full w-64 flex-col border-r border-stone-200 bg-white">
      <div className="px-6 py-5 border-b border-stone-200">
        <h1 className="text-lg font-semibold text-stone-800">Montessori Home</h1>
        <p className="text-xs text-stone-500 mt-0.5 capitalize">{profile?.role} Dashboard</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname === link.href
                ? 'bg-green-50 text-green-800'
                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
            )}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

**Step 3: Create header**

```typescript
// src/components/layout/header.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/lib/hooks/use-profile'

export function Header() {
  const { profile } = useProfile()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-stone-600">{profile?.display_name}</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
```

**Step 4: Create dashboard layout**

```typescript
// src/app/dashboard/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Step 5: Create dashboard home page**

```typescript
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h2 className="text-xl font-semibold text-stone-800">
        Welcome back, {profile?.display_name}
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Here&apos;s what&apos;s happening today.
      </p>

      {/* TODO: Phase 3 — role-specific dashboard content */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-medium text-stone-500">Today&apos;s Lessons</h3>
          <p className="mt-2 text-2xl font-semibold text-stone-800">Coming soon</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-medium text-stone-500">Next Zoom Class</h3>
          <p className="mt-2 text-2xl font-semibold text-stone-800">Coming soon</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6">
          <h3 className="text-sm font-medium text-stone-500">Progress</h3>
          <p className="mt-2 text-2xl font-semibold text-stone-800">Coming soon</p>
        </div>
      </div>
    </div>
  )
}
```

**Step 6: Update root layout with Montessori styling**

Modify `src/app/layout.tsx` to set the base font and page styling:

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Montessori Homeschool',
  description: 'Complete K-6 Montessori homeschool curriculum platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
```

**Step 7: Commit**

```bash
git add src/
git commit -m "feat: add dashboard layout with role-based sidebar navigation"
```

---

### Task 10: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Build the public landing page**

```typescript
// src/app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold text-stone-800">Montessori Homeschool</h1>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-800">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-stone-900 sm:text-5xl">
          Complete Montessori Curriculum,
          <br />
          <span className="text-green-700">Delivered to Your Home</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
          A full K-6th grade Montessori program with day-by-day lessons, live weekly classes,
          progress tracking, and everything you need for a successful homeschool year.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-green-700 px-6 py-3 text-base font-medium text-white hover:bg-green-800"
          >
            Start Your Journey — $50/mo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h3 className="text-center text-2xl font-semibold text-stone-800">Everything You Need</h3>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                title: '180 Days of Curriculum',
                desc: 'Complete day-by-day lesson plans covering all Montessori subject areas for 36 weeks across Primary, Lower Elementary, and Upper Elementary.',
              },
              {
                title: 'Weekly Live Classes',
                desc: 'Small-group Zoom sessions (max 20 students) with Montessori-trained teachers. Guided lessons, discussions, and community building.',
              },
              {
                title: 'Progress Tracking',
                desc: 'Montessori-specific mastery tracking with 6 stages, observation journals, work plans, and state compliance reporting.',
              },
              {
                title: 'Interactive Lessons',
                desc: 'Engaging slide-based lessons with audio narration, materials checklists, and guided activities your child can follow independently.',
              },
              {
                title: 'Five Great Lessons',
                desc: 'The cornerstone of Montessori elementary — cosmic education through the five great stories, with 8-week follow-up sequences.',
              },
              {
                title: 'Parent Community',
                desc: 'Connect with other Montessori families in our forums. Share ideas, ask questions, and support each other.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border border-stone-200 p-6">
                <h4 className="font-semibold text-stone-800">{feature.title}</h4>
                <p className="mt-2 text-sm text-stone-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-md px-6 text-center">
          <h3 className="text-2xl font-semibold text-stone-800">Simple Pricing</h3>
          <div className="mt-8 rounded-lg border border-stone-200 bg-white p-8">
            <p className="text-4xl font-bold text-stone-900">$50</p>
            <p className="text-stone-500">per student / month</p>
            <ul className="mt-6 space-y-3 text-left text-sm text-stone-600">
              <li>Full 36-week K-6 Montessori curriculum</li>
              <li>Weekly live Zoom class with teacher</li>
              <li>Interactive lesson player with audio</li>
              <li>Progress tracking & observation tools</li>
              <li>State compliance reports</li>
              <li>Parent community forums</li>
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-md bg-green-700 px-4 py-2 text-center font-medium text-white hover:bg-green-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-stone-500">
          &copy; {new Date().getFullYear()} Montessori Homeschool. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add public landing page with features and pricing"
```

---

## PHASE 2: Curriculum Engine

### Task 11: Seed Materials Inventory

**Files:**
- Create: `scripts/seed-materials.ts`
- Create: `scripts/data/materials.json`

**Step 1:** Generate JSON file with 250+ materials from the research (see `docs/research/materials-catalog.md`). Each entry follows the `materials_inventory` schema.

**Step 2:** Write seeding script that reads the JSON and inserts into Supabase using the service role key.

```typescript
// scripts/seed-materials.ts
import { createClient } from '@supabase/supabase-js'
import materials from './data/materials.json'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log(`Seeding ${materials.length} materials...`)
  const { error } = await supabase.from('materials_inventory').upsert(materials, { onConflict: 'code' })
  if (error) throw error
  console.log('Done!')
}

seed().catch(console.error)
```

**Step 3: Run:** `pnpm tsx scripts/seed-materials.ts`

**Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: seed 250+ Montessori materials into inventory"
```

---

### Task 12: Seed Scope & Sequence

**Files:**
- Create: `scripts/seed-scope-sequence.ts`
- Create: `scripts/data/scope-sequence.json`

Generate 500+ scope & sequence items from `docs/research/curriculum-scope-sequence.md` organized by level and subject. Each links to materials by code. Run seeding script.

**Commit:** `"feat: seed 500+ scope & sequence items"`

---

### Task 13: Generate Primary (K) Curriculum — 36 Weeks

**Files:**
- Create: `scripts/generate-primary-curriculum.ts`
- Create: `scripts/data/primary-lessons/` (JSON files per week)

Generate ~900 lesson records (5 activities/day × 180 days). Each lesson includes title, description, instructions, duration, materials, slide_content JSON, and parent_notes. Organized week-by-week following the Primary daily template and scope & sequence.

**Commit:** `"feat: generate and seed Primary (K) 36-week curriculum"`

---

### Task 14: Generate Lower Elementary Curriculum — 36 Weeks

Same as Task 13 but for Lower Elementary (~1,080 lessons, 6 activities/day). Includes Great Lesson integration in weeks 1-3.

**Commit:** `"feat: generate and seed Lower Elementary 36-week curriculum"`

---

### Task 15: Generate Upper Elementary Curriculum — 36 Weeks

Same as Task 13 but for Upper Elementary (~1,080 lessons, 6 activities/day).

**Commit:** `"feat: generate and seed Upper Elementary 36-week curriculum"`

---

### Task 16: Generate Five Great Lessons

**Files:**
- Create: `scripts/seed-great-lessons.ts`
- Create: `scripts/data/great-lessons.json`

Seed 5 Great Lessons with full narratives, demonstrations, slide content, and 40 follow-up activity sets (8 per lesson × 2 levels) from `docs/research/five-great-lessons.md`.

**Commit:** `"feat: seed Five Great Lessons with follow-up sequences"`

---

### Task 17: Build Lesson Slide Player Component

**Files:**
- Create: `src/components/lessons/slide-player.tsx`
- Create: `src/components/lessons/slides/title-slide.tsx`
- Create: `src/components/lessons/slides/materials-slide.tsx`
- Create: `src/components/lessons/slides/instruction-slide.tsx`
- Create: `src/components/lessons/slides/activity-slide.tsx`
- Create: `src/components/lessons/slides/check-understanding-slide.tsx`
- Create: `src/components/lessons/slides/wrap-up-slide.tsx`

Build the React component that renders the `slide_content` JSON structure. Supports navigation (prev/next/swipe), audio playback, fullscreen, timer for activities, and completion tracking.

**Commit:** `"feat: build interactive lesson slide player component"`

---

### Task 18: Today's Lessons Page

**Files:**
- Create: `src/app/dashboard/lessons/page.tsx`
- Create: `src/app/dashboard/lessons/[lessonId]/page.tsx`

Page that shows all lessons for today (based on current week and day of week), with links to open each in the slide player. The `[lessonId]` page renders the full slide player for a specific lesson.

**Commit:** `"feat: add today's lessons page with slide player integration"`

---

### Task 19: TTS Audio Generation

**Files:**
- Create: `scripts/generate-audio.ts`

Batch script that iterates through all lessons, extracts narration text from slide_content, calls ElevenLabs TTS API, and uploads MP3 files to Supabase Storage. Updates lesson records with audio_url.

**Commit:** `"feat: TTS audio generation script for all lessons"`

---

## PHASE 3: Core Dashboards

### Task 20: Parent Dashboard — Today View

**Files:**
- Modify: `src/app/dashboard/page.tsx` (parent-specific content)

Shows today's lessons for each student with completion status, upcoming Zoom class with join link, quick-add observation button, and weekly progress summary.

**Commit:** `"feat: parent dashboard today view with lessons and class info"`

---

### Task 21: Parent Dashboard — Calendar View

**Files:**
- Create: `src/app/dashboard/calendar/page.tsx`
- Create: `src/components/calendar/month-view.tsx`

Month/week/day views. Lessons color-coded by subject. Zoom dates highlighted. Holiday breaks shown. Click any day to see full lesson plan.

**Commit:** `"feat: parent dashboard calendar view"`

---

### Task 22: Parent Dashboard — Student Progress

**Files:**
- Create: `src/app/dashboard/students/[studentId]/page.tsx`
- Create: `src/components/progress/skill-tree.tsx`
- Create: `src/components/progress/mastery-map.tsx`

Visual skill tree per subject with color-coded mastery, progress bars, observations timeline, work log history.

**Commit:** `"feat: parent student progress view with skill tree"`

---

### Task 23: Student Dashboard (Ages 9+)

**Files:**
- Create: `src/app/student/page.tsx`
- Create: `src/app/student/layout.tsx`
- Create: `src/app/student/lessons/page.tsx`
- Create: `src/app/student/progress/page.tsx`

Age-appropriate dashboard with work plan, today's lessons, progress visualization, and Zoom class countdown.

**Commit:** `"feat: student dashboard for ages 9+"`

---

### Task 24: Teacher Dashboard

**Files:**
- Create: `src/app/dashboard/schedule/page.tsx`
- Create: `src/app/dashboard/classes/[classId]/page.tsx`

Schedule view, student rosters, attendance marking, session notes, substitute request.

**Commit:** `"feat: teacher dashboard with schedule and class management"`

---

### Task 25: Admin Dashboard

**Files:**
- Create: `src/app/dashboard/teachers/page.tsx`
- Create: `src/app/dashboard/analytics/page.tsx`
- Create: `src/app/dashboard/curriculum/page.tsx`

Teacher management, class management, student/parent overview, curriculum editor, analytics (enrollment, revenue, engagement).

**Commit:** `"feat: admin dashboard with management and analytics"`

---

## PHASE 4: Tracking & Assessment

### Task 26: Mastery Tracking System

**Files:**
- Create: `src/components/tracking/mastery-input.tsx`
- Create: `src/app/api/mastery/route.ts`

Quick-entry mastery tracking after lesson completion. 6-stage selector with optional notes/photos. Updates student_mastery table.

**Commit:** `"feat: 6-stage mastery tracking with quick entry"`

---

### Task 27: Observation Journal

**Files:**
- Create: `src/app/dashboard/observations/page.tsx`
- Create: `src/components/tracking/observation-form.tsx`

Quick observation logging (<10 seconds). Support for anecdotal, work_log, concentration, and social_emotional types. Photo upload to Supabase Storage.

**Commit:** `"feat: observation journal with quick entry and photo upload"`

---

### Task 28: Work Plan Builder

**Files:**
- Create: `src/app/dashboard/work-plans/page.tsx`
- Create: `src/components/work-plan/builder.tsx`

Drag-and-drop weekly planning. Grid of days × time blocks. Auto-populated from curriculum. Must-do vs may-do. Print-friendly.

**Commit:** `"feat: drag-and-drop work plan builder"`

---

### Task 29: Quarterly Assessments & Portfolio

**Files:**
- Create: `src/app/dashboard/assessments/page.tsx`
- Create: `src/app/dashboard/portfolio/page.tsx`

Quarterly assessment templates with per-subject checklists. Portfolio gallery with file upload, featured items, and date filtering.

**Commit:** `"feat: quarterly assessments and portfolio system"`

---

### Task 30: Normalization Tracking

**Files:**
- Create: `src/components/tracking/normalization-form.tsx`

Periodic snapshots of 7 normalization indicators on 1-5 scale. Trend visualization over time.

**Commit:** `"feat: normalization indicator tracking with trends"`

---

## PHASE 5: Social & Community

### Task 31: Class Scheduling & Enrollment

**Files:**
- Create: `src/app/dashboard/classes/page.tsx`
- Create: `src/components/classes/enrollment-picker.tsx`

Browse available Zoom classes by grade band. Show teacher, time, capacity. Enroll student into a class.

**Commit:** `"feat: class browsing and enrollment system"`

---

### Task 32: Zoom Integration

**Files:**
- Modify class/session components

Display Zoom links in class cards. Join button appears 5 minutes before class. Attendance auto-tracked from session check-in.

**Commit:** `"feat: Zoom link display with timed join button"`

---

### Task 33: Community Forums

**Files:**
- Create: `src/app/dashboard/community/page.tsx`
- Create: `src/app/dashboard/community/[postId]/page.tsx`
- Create: `src/components/forum/post-form.tsx`
- Create: `src/components/forum/reply-form.tsx`

Threaded discussions, category browsing, pin/lock (admin), rich text, search.

**Commit:** `"feat: community forums with threads and categories"`

---

## PHASE 6: Polish & Compliance

### Task 34: Onboarding Flow & Placement

**Files:**
- Create: `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding/steps/`

Multi-step: add student → optional placement quiz → select class → payment. Guided dashboard tour on first visit.

**Commit:** `"feat: onboarding flow with student creation and class selection"`

---

### Task 35: State Compliance Reports

**Files:**
- Create: `src/app/dashboard/reports/page.tsx`
- Create: `src/lib/reports/`

Auto-generated attendance log, subject coverage report, progress report (narrative), portfolio PDF export, Common Core crosswalk, annual summary.

**Commit:** `"feat: state compliance report generation and export"`

---

### Task 36: Email Notifications

**Files:**
- Create: `src/lib/email/`
- Create: `src/app/api/cron/` (or Supabase Edge Functions)

Weekly summary email, class reminders, payment failures, new observation notifications.

**Commit:** `"feat: email notification system"`

---

### Task 37: Mobile Responsiveness & Accessibility

Polish responsive design for all pages. WCAG 2.1 AA compliance. Keyboard navigation. Screen reader testing.

**Commit:** `"feat: responsive design and accessibility improvements"`

---

### Task 38: Deployment to Vercel

**Files:**
- Create: `vercel.json` (if needed)

Connect to Vercel, configure environment variables, set up custom domain, configure Stripe webhook URL to production endpoint.

**Commit:** `"chore: production deployment configuration"`

---

## Execution Notes

- **Phase 1** (Tasks 1-10) is the foundation — must complete before other phases
- **Phase 2** (Tasks 11-19) is the content engine — highest value, can start as soon as Phase 1 is done
- **Phases 3-4** (Tasks 20-30) are the user-facing features — most are independent of each other
- **Phase 5** (Tasks 31-33) can run in parallel with Phase 4
- **Phase 6** (Tasks 34-38) is polish and should come last

Total: **38 tasks** across **6 phases**

---

Plan complete and saved to `docs/plans/2026-02-23-montessori-implementation-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
