-- =============================================================================
-- 001_core_schema.sql
-- Montessori Homeschool Platform - Core Schema
-- Extensions, ENUMs, core tables, trigger functions, and auth triggers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Custom ENUM Types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'student');

CREATE TYPE enrollment_status AS ENUM ('active', 'paused', 'withdrawn');

CREATE TYPE class_status AS ENUM ('active', 'cancelled', 'completed');

CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');

CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing');

CREATE TYPE payment_status AS ENUM ('paid', 'failed', 'refunded');

CREATE TYPE grade_band AS ENUM ('primary', 'lower_elementary', 'upper_elementary');

-- ---------------------------------------------------------------------------
-- Trigger Function: update_updated_at()
-- Automatically sets updated_at = NOW() on row update.
-- Referenced by triggers in this file and in subsequent migrations.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Table: profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role            user_role NOT NULL DEFAULT 'parent',
    display_name    TEXT,
    avatar_url      TEXT,
    phone           TEXT,
    timezone        TEXT DEFAULT 'America/New_York',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE profiles IS 'Extended user profile linked 1:1 to auth.users';

-- ---------------------------------------------------------------------------
-- Table: students
-- ---------------------------------------------------------------------------
CREATE TABLE students (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    date_of_birth           DATE NOT NULL,
    grade_band              grade_band NOT NULL,
    enrollment_status       enrollment_status NOT NULL DEFAULT 'active',
    stripe_subscription_id  TEXT,
    academic_year           INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
    start_week              INTEGER NOT NULL DEFAULT 1 CHECK (start_week BETWEEN 1 AND 36),
    avatar_url              TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Children enrolled in the platform, owned by a parent profile';

-- ---------------------------------------------------------------------------
-- Table: teachers
-- ---------------------------------------------------------------------------
CREATE TABLE teachers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    bio             TEXT,
    qualifications  TEXT,
    zoom_link       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_substitute   BOOLEAN NOT NULL DEFAULT FALSE,
    max_classes     INTEGER NOT NULL DEFAULT 5,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE teachers IS 'Teacher records linked to a user profile';

-- ---------------------------------------------------------------------------
-- Table: teacher_availability
-- ---------------------------------------------------------------------------
CREATE TABLE teacher_availability (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE teacher_availability IS 'Weekly availability windows for teachers (0=Sun, 6=Sat)';

-- ---------------------------------------------------------------------------
-- Table: classes
-- ---------------------------------------------------------------------------
CREATE TABLE classes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id      UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    grade_band      grade_band NOT NULL,
    title           TEXT NOT NULL,
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    zoom_link       TEXT,
    max_students    INTEGER NOT NULL DEFAULT 20,
    academic_year   INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
    status          class_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE classes IS 'Weekly Zoom class sessions with a teacher and grade band';

-- ---------------------------------------------------------------------------
-- Table: enrollments
-- ---------------------------------------------------------------------------
CREATE TABLE enrollments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          enrollment_status NOT NULL DEFAULT 'active',
    UNIQUE (student_id, class_id)
);

COMMENT ON TABLE enrollments IS 'Links students to their weekly class';

-- ---------------------------------------------------------------------------
-- Table: class_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE class_sessions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id                UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    session_date            DATE NOT NULL,
    session_number          INTEGER NOT NULL CHECK (session_number BETWEEN 1 AND 36),
    substitute_teacher_id   UUID REFERENCES teachers(id) ON DELETE SET NULL,
    zoom_link_override      TEXT,
    status                  session_status NOT NULL DEFAULT 'scheduled',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE class_sessions IS 'Individual occurrences of a weekly class';

-- ---------------------------------------------------------------------------
-- Table: subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE subscriptions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id              UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,
    status                  subscription_status NOT NULL DEFAULT 'trialing',
    current_period_start    TIMESTAMPTZ,
    current_period_end      TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE subscriptions IS 'Stripe subscription records per student';

-- ---------------------------------------------------------------------------
-- Table: payment_history
-- ---------------------------------------------------------------------------
CREATE TABLE payment_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id     UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id   TEXT,
    amount_cents        INTEGER NOT NULL CHECK (amount_cents >= 0),
    status              payment_status NOT NULL DEFAULT 'paid',
    paid_at             TIMESTAMPTZ
);

COMMENT ON TABLE payment_history IS 'Record of each Stripe invoice/payment event';

-- ---------------------------------------------------------------------------
-- Trigger Function: handle_new_user()
-- Auto-creates a profile row when a new user is inserted into auth.users.
-- Sets role to 'parent' by default.
-- Extracts display_name from raw_user_meta_data->>'display_name',
-- falling back to the email address.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, display_name, created_at, updated_at)
    VALUES (
        NEW.id,
        'parent',
        COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            NEW.email
        ),
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
-- =============================================================================
-- 002_curriculum_schema.sql
-- Montessori Homeschool Platform - Curriculum & Progress Tracking Schema
-- Curriculum ENUMs, curriculum tables (with seed data), tracking tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Curriculum ENUM Types
-- ---------------------------------------------------------------------------
CREATE TYPE lesson_type AS ENUM (
    'guided',
    'independent',
    'project',
    'review',
    'great_lesson',
    'assessment'
);

CREATE TYPE mastery_status AS ENUM (
    'not_introduced',
    'presented',
    'practicing',
    'developing',
    'mastered',
    'applied'
);

CREATE TYPE independence_level AS ENUM (
    'needs_presentation',
    'needs_prompt',
    'independent'
);

CREATE TYPE observation_type AS ENUM (
    'anecdotal',
    'work_log',
    'concentration',
    'social_emotional'
);

CREATE TYPE lesson_progress_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'skipped'
);

CREATE TYPE portfolio_item_type AS ENUM (
    'work_sample',
    'photo',
    'video',
    'writing',
    'project',
    'art'
);

-- ---------------------------------------------------------------------------
-- Table: curriculum_levels
-- ---------------------------------------------------------------------------
CREATE TABLE curriculum_levels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    age_range       TEXT NOT NULL,
    daily_hours     NUMERIC(3, 1) NOT NULL,
    description     TEXT
);

COMMENT ON TABLE curriculum_levels IS 'Grade bands: Primary (K), Lower Elementary (1-3), Upper Elementary (4-6)';

-- Seed data for curriculum levels
INSERT INTO curriculum_levels (id, name, display_name, age_range, daily_hours, description) VALUES
    (uuid_generate_v4(), 'primary',           'Primary',           '5-6',  2.5, 'Kindergarten — ages 5-6, focus on Practical Life, Sensorial, and foundational Language/Math'),
    (uuid_generate_v4(), 'lower_elementary',  'Lower Elementary',  '6-9',  3.5, 'Grades 1-3 — ages 6-9, Great Lessons introduction, deepening of all subject areas'),
    (uuid_generate_v4(), 'upper_elementary',  'Upper Elementary',  '9-12', 3.5, 'Grades 4-6 — ages 9-12, independent research, advanced materials, seminar discussions');

-- ---------------------------------------------------------------------------
-- Table: subjects
-- ---------------------------------------------------------------------------
CREATE TABLE subjects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    icon            TEXT,
    color           TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE subjects IS 'Montessori subject areas across all grade bands';

-- Seed data for 11 subjects
INSERT INTO subjects (id, name, display_name, icon, color, sort_order) VALUES
    (uuid_generate_v4(), 'practical_life',  'Practical Life',                'hand',        '#8B7355', 1),
    (uuid_generate_v4(), 'sensorial',       'Sensorial',                     'eye',         '#C4A882', 2),
    (uuid_generate_v4(), 'language',        'Language Arts',                 'book-open',   '#5B8C5A', 3),
    (uuid_generate_v4(), 'math',            'Mathematics',                   'calculator',  '#4A7C9B', 4),
    (uuid_generate_v4(), 'geometry',        'Geometry',                      'shapes',      '#7B68AE', 5),
    (uuid_generate_v4(), 'geography',       'Geography',                     'globe',       '#D4915E', 6),
    (uuid_generate_v4(), 'history',         'History & Timeline',            'clock',       '#A0522D', 7),
    (uuid_generate_v4(), 'science',         'Science / Botany / Zoology',   'leaf',        '#6B8E23', 8),
    (uuid_generate_v4(), 'art_music',       'Art & Music',                   'palette',     '#CD5C5C', 9),
    (uuid_generate_v4(), 'culture',         'Cultural Studies',              'earth',       '#B8860B', 10),
    (uuid_generate_v4(), 'read_aloud',      'Read-Aloud',                    'book',        '#708090', 11);

-- ---------------------------------------------------------------------------
-- Table: scope_sequence_items
-- The full scope & sequence: every skill/concept in Montessori K-6
-- ---------------------------------------------------------------------------
CREATE TABLE scope_sequence_items (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id                UUID NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
    subject_id              UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    sub_area                TEXT,
    name                    TEXT NOT NULL,
    description             TEXT,
    prerequisites           JSONB DEFAULT '[]'::JSONB,
    materials_needed        JSONB DEFAULT '[]'::JSONB,
    mastery_criteria        TEXT,
    three_period_applicable BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order              INTEGER NOT NULL DEFAULT 0,
    common_core_alignment   JSONB
);

COMMENT ON TABLE scope_sequence_items IS 'Every skill/concept in the Montessori K-6 scope and sequence';

-- ---------------------------------------------------------------------------
-- Table: lessons
-- The 36-week, day-by-day lesson plan
-- ---------------------------------------------------------------------------
CREATE TABLE lessons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_id            UUID NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
    subject_id          UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    scope_item_id       UUID REFERENCES scope_sequence_items(id) ON DELETE SET NULL,
    week_number         INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 36),
    day_of_week         INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
    quarter             INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    title               TEXT NOT NULL,
    description         TEXT,
    instructions        TEXT,
    duration_minutes    INTEGER NOT NULL DEFAULT 30,
    lesson_type         lesson_type NOT NULL DEFAULT 'guided',
    materials_needed    JSONB DEFAULT '[]'::JSONB,
    slide_content       JSONB,
    audio_url           TEXT,
    parent_notes        TEXT,
    age_adaptations     JSONB,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite index for efficient lookups: "get all lessons for level X, week Y, day Z"
CREATE INDEX idx_lessons_level_week_day
    ON lessons (level_id, week_number, day_of_week);

COMMENT ON TABLE lessons IS 'Day-by-day lesson plan for 36 weeks across all grade bands';

-- ---------------------------------------------------------------------------
-- Table: great_lessons
-- The 5 Great Lessons (Elementary only)
-- ---------------------------------------------------------------------------
CREATE TABLE great_lessons (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_number       INTEGER NOT NULL UNIQUE CHECK (lesson_number BETWEEN 1 AND 5),
    title               TEXT NOT NULL,
    narrative           TEXT,
    demonstrations      JSONB DEFAULT '[]'::JSONB,
    materials_needed    JSONB DEFAULT '[]'::JSONB,
    slide_content       JSONB,
    audio_url           TEXT,
    follow_up_weeks     INTEGER NOT NULL DEFAULT 8,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE great_lessons IS 'The 5 Montessori Great Lessons presented in Weeks 1-3 of each year';

-- ---------------------------------------------------------------------------
-- Table: great_lesson_followups
-- ---------------------------------------------------------------------------
CREATE TABLE great_lesson_followups (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    great_lesson_id     UUID NOT NULL REFERENCES great_lessons(id) ON DELETE CASCADE,
    week_offset         INTEGER NOT NULL CHECK (week_offset BETWEEN 1 AND 8),
    level_id            UUID NOT NULL REFERENCES curriculum_levels(id) ON DELETE CASCADE,
    focus_area          TEXT NOT NULL,
    activities          JSONB DEFAULT '[]'::JSONB,
    materials_needed    JSONB DEFAULT '[]'::JSONB
);

COMMENT ON TABLE great_lesson_followups IS 'Follow-up activities for 8 weeks after each Great Lesson';

-- ---------------------------------------------------------------------------
-- Table: materials_inventory
-- ---------------------------------------------------------------------------
CREATE TABLE materials_inventory (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code                        TEXT NOT NULL UNIQUE,
    name                        TEXT NOT NULL,
    description                 TEXT,
    subject_area                TEXT,
    sub_category                TEXT,
    applicable_levels           JSONB DEFAULT '[]'::JSONB,
    age_range                   TEXT,
    image_url                   TEXT,
    what_it_teaches             TEXT,
    prerequisites               JSONB DEFAULT '[]'::JSONB,
    next_in_sequence            JSONB DEFAULT '[]'::JSONB,
    cross_subject_connections   JSONB DEFAULT '[]'::JSONB,
    supplier_links              JSONB,
    diy_alternative             TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE materials_inventory IS 'Catalog of 250+ Montessori materials with sequencing info';

-- ---------------------------------------------------------------------------
-- Table: student_mastery
-- Per-skill mastery tracking (maps to scope & sequence)
-- ---------------------------------------------------------------------------
CREATE TABLE student_mastery (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    scope_item_id       UUID NOT NULL REFERENCES scope_sequence_items(id) ON DELETE CASCADE,
    status              mastery_status NOT NULL DEFAULT 'not_introduced',
    date_presented      DATE,
    date_mastered       DATE,
    three_period_stage  INTEGER CHECK (three_period_stage IN (1, 2, 3)),
    notes               TEXT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, scope_item_id)
);

CREATE TRIGGER trg_student_mastery_updated_at
    BEFORE UPDATE ON student_mastery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE student_mastery IS 'Per-skill 6-stage mastery tracking for each student';

-- ---------------------------------------------------------------------------
-- Table: student_lesson_progress
-- Per-lesson completion tracking (daily work log)
-- ---------------------------------------------------------------------------
CREATE TABLE student_lesson_progress (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id              UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    lesson_id               UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status                  lesson_progress_status NOT NULL DEFAULT 'not_started',
    completed_at            TIMESTAMPTZ,
    duration_actual         INTEGER,
    parent_notes            TEXT,
    student_self_assessment TEXT,
    UNIQUE (student_id, lesson_id)
);

COMMENT ON TABLE student_lesson_progress IS 'Daily work log: per-lesson completion status';

-- ---------------------------------------------------------------------------
-- Table: observations
-- Observation journal (Montessori-style anecdotal records)
-- ---------------------------------------------------------------------------
CREATE TABLE observations (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id              UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    observer_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    observation_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    observation_type        observation_type NOT NULL DEFAULT 'anecdotal',
    curriculum_area         TEXT,
    content                 TEXT NOT NULL,
    concentration_duration  INTEGER,
    independence_level      independence_level,
    photo_urls              JSONB DEFAULT '[]'::JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE observations IS 'Montessori-style anecdotal observation records by parents/teachers';

-- ---------------------------------------------------------------------------
-- Table: work_plans
-- Weekly work plans (drag-and-drop selections)
-- ---------------------------------------------------------------------------
CREATE TABLE work_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    week_number         INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 36),
    academic_year       INTEGER NOT NULL,
    planned_activities  JSONB DEFAULT '[]'::JSONB,
    must_do             JSONB DEFAULT '[]'::JSONB,
    may_do              JSONB DEFAULT '[]'::JSONB,
    reflection_notes    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, week_number, academic_year)
);

CREATE TRIGGER trg_work_plans_updated_at
    BEFORE UPDATE ON work_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE work_plans IS 'Weekly work plans with must-do and may-do lesson selections';

-- ---------------------------------------------------------------------------
-- Table: quarterly_assessments
-- ---------------------------------------------------------------------------
CREATE TABLE quarterly_assessments (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id                  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quarter                     INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    academic_year               INTEGER NOT NULL,
    assessor_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    practical_life              JSONB,
    sensorial                   JSONB,
    language                    JSONB,
    math                        JSONB,
    geometry                    JSONB,
    culture                     JSONB,
    social_emotional            JSONB,
    normalization_indicators    JSONB,
    narrative_summary           TEXT,
    goals_next_quarter          TEXT,
    portfolio_items             JSONB DEFAULT '[]'::JSONB,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE quarterly_assessments IS 'End-of-quarter mastery summary assessments';

-- ---------------------------------------------------------------------------
-- Table: portfolio_items
-- ---------------------------------------------------------------------------
CREATE TABLE portfolio_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_type       portfolio_item_type NOT NULL,
    curriculum_area TEXT,
    title           TEXT NOT NULL,
    description     TEXT,
    file_url        TEXT NOT NULL,
    date_created    DATE NOT NULL DEFAULT CURRENT_DATE,
    featured        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE portfolio_items IS 'Student work samples, photos, projects for portfolio compilation';

-- ---------------------------------------------------------------------------
-- Table: normalization_snapshots
-- Periodic snapshots of Montessori normalization indicators (1-5 scale)
-- ---------------------------------------------------------------------------
CREATE TABLE normalization_snapshots (
    id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id                      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    snapshot_date                   DATE NOT NULL DEFAULT CURRENT_DATE,
    love_of_order                   INTEGER NOT NULL CHECK (love_of_order BETWEEN 1 AND 5),
    love_of_work                    INTEGER NOT NULL CHECK (love_of_work BETWEEN 1 AND 5),
    spontaneous_concentration       INTEGER NOT NULL CHECK (spontaneous_concentration BETWEEN 1 AND 5),
    attachment_to_reality           INTEGER NOT NULL CHECK (attachment_to_reality BETWEEN 1 AND 5),
    independence                    INTEGER NOT NULL CHECK (independence BETWEEN 1 AND 5),
    spontaneous_self_discipline     INTEGER NOT NULL CHECK (spontaneous_self_discipline BETWEEN 1 AND 5),
    joy                             INTEGER NOT NULL CHECK (joy BETWEEN 1 AND 5),
    notes                           TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE normalization_snapshots IS 'Periodic Montessori normalization indicator snapshots (1-5 scale)';
-- =============================================================================
-- 003_community_and_rls.sql
-- Montessori Homeschool Platform - Community Tables & Row Level Security
-- Forum tables (with seed data), helper functions, and all RLS policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: forum_categories
-- ---------------------------------------------------------------------------
CREATE TABLE forum_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE forum_categories IS 'Top-level forum categories for community discussions';

-- Seed data: 8 categories
INSERT INTO forum_categories (id, name, description, sort_order) VALUES
    (uuid_generate_v4(), 'General Discussion',        'Open conversation about Montessori homeschooling',                       1),
    (uuid_generate_v4(), 'Primary (K)',               'Topics specific to the Primary / Kindergarten grade band (ages 5-6)',    2),
    (uuid_generate_v4(), 'Lower Elementary (1-3)',    'Topics specific to Lower Elementary grades 1-3 (ages 6-9)',             3),
    (uuid_generate_v4(), 'Upper Elementary (4-6)',    'Topics specific to Upper Elementary grades 4-6 (ages 9-12)',            4),
    (uuid_generate_v4(), 'Subject Help',              'Get help with specific subjects: Math, Language, Science, etc.',         5),
    (uuid_generate_v4(), 'Materials & DIY',           'Discuss Montessori materials, DIY alternatives, and suppliers',          6),
    (uuid_generate_v4(), 'Special Needs / Adaptations', 'Adapting the Montessori curriculum for diverse learners',             7),
    (uuid_generate_v4(), 'Off-Topic / Introductions', 'Introduce yourself and chat about anything off-topic',                  8);

-- ---------------------------------------------------------------------------
-- Table: forum_posts
-- ---------------------------------------------------------------------------
CREATE TABLE forum_posts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL,
    pinned      BOOLEAN NOT NULL DEFAULT FALSE,
    locked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_forum_posts_updated_at
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE forum_posts IS 'Community forum posts within categories';

-- ---------------------------------------------------------------------------
-- Table: forum_replies
-- ---------------------------------------------------------------------------
CREATE TABLE forum_replies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_forum_replies_updated_at
    BEFORE UPDATE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE forum_replies IS 'Threaded replies to forum posts';

-- ===========================================================================
-- HELPER FUNCTIONS FOR RLS
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Function: get_user_role()
-- Returns the role of the currently authenticated user from the profiles table.
-- Returns NULL if no profile exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Function: is_admin()
-- Returns TRUE if the current user has the 'admin' role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ===========================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===========================================================================

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- profiles: users see own, admins see all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY profiles_insert_self ON profiles
    FOR INSERT WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY profiles_delete_admin ON profiles
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- students: parents see own, teachers see enrolled, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY students_select ON students
    FOR SELECT USING (
        parent_id = auth.uid()
        OR is_admin()
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = students.id
              AND t.user_id = auth.uid()
        )
    );

CREATE POLICY students_insert_parent ON students
    FOR INSERT WITH CHECK (parent_id = auth.uid() OR is_admin());

CREATE POLICY students_update ON students
    FOR UPDATE USING (parent_id = auth.uid() OR is_admin());

CREATE POLICY students_delete_admin ON students
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- teachers: own record + public view active, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY teachers_select ON teachers
    FOR SELECT USING (
        user_id = auth.uid()
        OR is_active = TRUE
        OR is_admin()
    );

CREATE POLICY teachers_insert_admin ON teachers
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY teachers_update ON teachers
    FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY teachers_delete_admin ON teachers
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- classes: authenticated see active, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY classes_select ON classes
    FOR SELECT USING (
        status = 'active' AND auth.uid() IS NOT NULL
        OR is_admin()
    );

CREATE POLICY classes_insert_admin ON classes
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY classes_update_admin ON classes
    FOR UPDATE USING (is_admin());

CREATE POLICY classes_delete_admin ON classes
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- enrollments: parents see own students', admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY enrollments_select ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = enrollments.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY enrollments_insert ON enrollments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY enrollments_update ON enrollments
    FOR UPDATE USING (is_admin());

CREATE POLICY enrollments_delete ON enrollments
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- class_sessions: authenticated read, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY class_sessions_select ON class_sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY class_sessions_insert_admin ON class_sessions
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY class_sessions_update_admin ON class_sessions
    FOR UPDATE USING (is_admin());

CREATE POLICY class_sessions_delete_admin ON class_sessions
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- teacher_availability: teachers manage own, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY teacher_availability_select ON teacher_availability
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = teacher_availability.teacher_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY teacher_availability_insert ON teacher_availability
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = teacher_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY teacher_availability_update ON teacher_availability
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = teacher_availability.teacher_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY teacher_availability_delete ON teacher_availability
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM teachers t
            WHERE t.id = teacher_availability.teacher_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- CURRICULUM TABLES: authenticated read, admins manage
-- (curriculum_levels, subjects, scope_sequence_items, lessons,
--  great_lessons, great_lesson_followups, materials_inventory)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- curriculum_levels
ALTER TABLE curriculum_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY curriculum_levels_select ON curriculum_levels
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY curriculum_levels_insert_admin ON curriculum_levels
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY curriculum_levels_update_admin ON curriculum_levels
    FOR UPDATE USING (is_admin());

CREATE POLICY curriculum_levels_delete_admin ON curriculum_levels
    FOR DELETE USING (is_admin());

-- subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY subjects_select ON subjects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY subjects_insert_admin ON subjects
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY subjects_update_admin ON subjects
    FOR UPDATE USING (is_admin());

CREATE POLICY subjects_delete_admin ON subjects
    FOR DELETE USING (is_admin());

-- scope_sequence_items
ALTER TABLE scope_sequence_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY scope_sequence_items_select ON scope_sequence_items
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY scope_sequence_items_insert_admin ON scope_sequence_items
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY scope_sequence_items_update_admin ON scope_sequence_items
    FOR UPDATE USING (is_admin());

CREATE POLICY scope_sequence_items_delete_admin ON scope_sequence_items
    FOR DELETE USING (is_admin());

-- lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lessons_select ON lessons
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY lessons_insert_admin ON lessons
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY lessons_update_admin ON lessons
    FOR UPDATE USING (is_admin());

CREATE POLICY lessons_delete_admin ON lessons
    FOR DELETE USING (is_admin());

-- great_lessons
ALTER TABLE great_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY great_lessons_select ON great_lessons
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY great_lessons_insert_admin ON great_lessons
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY great_lessons_update_admin ON great_lessons
    FOR UPDATE USING (is_admin());

CREATE POLICY great_lessons_delete_admin ON great_lessons
    FOR DELETE USING (is_admin());

-- great_lesson_followups
ALTER TABLE great_lesson_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY great_lesson_followups_select ON great_lesson_followups
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY great_lesson_followups_insert_admin ON great_lesson_followups
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY great_lesson_followups_update_admin ON great_lesson_followups
    FOR UPDATE USING (is_admin());

CREATE POLICY great_lesson_followups_delete_admin ON great_lesson_followups
    FOR DELETE USING (is_admin());

-- materials_inventory
ALTER TABLE materials_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY materials_inventory_select ON materials_inventory
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY materials_inventory_insert_admin ON materials_inventory
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY materials_inventory_update_admin ON materials_inventory
    FOR UPDATE USING (is_admin());

CREATE POLICY materials_inventory_delete_admin ON materials_inventory
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- TRACKING TABLES: parents manage own students', teachers read enrolled, admins all
-- (student_mastery, student_lesson_progress, observations, work_plans,
--  quarterly_assessments, portfolio_items, normalization_snapshots)
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- student_mastery
ALTER TABLE student_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_mastery_select ON student_mastery
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_mastery.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = student_mastery.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_mastery_insert ON student_mastery
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_mastery_update ON student_mastery
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_mastery.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_mastery_delete ON student_mastery
    FOR DELETE USING (is_admin());

-- student_lesson_progress
ALTER TABLE student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY student_lesson_progress_select ON student_lesson_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_lesson_progress.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = student_lesson_progress.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_lesson_progress_insert ON student_lesson_progress
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_lesson_progress_update ON student_lesson_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_lesson_progress.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY student_lesson_progress_delete ON student_lesson_progress
    FOR DELETE USING (is_admin());

-- observations
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY observations_select ON observations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = observations.student_id AND s.parent_id = auth.uid()
        )
        OR observer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = observations.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY observations_insert ON observations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = observations.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY observations_update ON observations
    FOR UPDATE USING (
        observer_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY observations_delete ON observations
    FOR DELETE USING (is_admin());

-- work_plans
ALTER TABLE work_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_plans_select ON work_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = work_plans.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = work_plans.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY work_plans_insert ON work_plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY work_plans_update ON work_plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = work_plans.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY work_plans_delete ON work_plans
    FOR DELETE USING (is_admin());

-- quarterly_assessments
ALTER TABLE quarterly_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY quarterly_assessments_select ON quarterly_assessments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = quarterly_assessments.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = quarterly_assessments.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY quarterly_assessments_insert ON quarterly_assessments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY quarterly_assessments_update ON quarterly_assessments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = quarterly_assessments.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY quarterly_assessments_delete ON quarterly_assessments
    FOR DELETE USING (is_admin());

-- portfolio_items
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_items_select ON portfolio_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = portfolio_items.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = portfolio_items.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY portfolio_items_insert ON portfolio_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY portfolio_items_update ON portfolio_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = portfolio_items.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY portfolio_items_delete ON portfolio_items
    FOR DELETE USING (is_admin());

-- normalization_snapshots
ALTER TABLE normalization_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY normalization_snapshots_select ON normalization_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = normalization_snapshots.student_id AND s.parent_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM enrollments e
            JOIN classes c ON c.id = e.class_id
            JOIN teachers t ON t.id = c.teacher_id
            WHERE e.student_id = normalization_snapshots.student_id AND t.user_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY normalization_snapshots_insert ON normalization_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY normalization_snapshots_update ON normalization_snapshots
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM students s WHERE s.id = normalization_snapshots.student_id AND s.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY normalization_snapshots_delete ON normalization_snapshots
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- subscriptions: parents see own, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select ON subscriptions
    FOR SELECT USING (parent_id = auth.uid() OR is_admin());

CREATE POLICY subscriptions_insert ON subscriptions
    FOR INSERT WITH CHECK (parent_id = auth.uid() OR is_admin());

CREATE POLICY subscriptions_update ON subscriptions
    FOR UPDATE USING (parent_id = auth.uid() OR is_admin());

CREATE POLICY subscriptions_delete ON subscriptions
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- payment_history: parents see own (via subscription), admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_history_select ON payment_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM subscriptions sub
            WHERE sub.id = payment_history.subscription_id AND sub.parent_id = auth.uid()
        )
        OR is_admin()
    );

CREATE POLICY payment_history_insert_admin ON payment_history
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY payment_history_update_admin ON payment_history
    FOR UPDATE USING (is_admin());

CREATE POLICY payment_history_delete_admin ON payment_history
    FOR DELETE USING (is_admin());

-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
-- FORUM TABLES: authenticated read/create, authors update own, admins all
-- ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-- forum_categories
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_categories_select ON forum_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY forum_categories_insert_admin ON forum_categories
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY forum_categories_update_admin ON forum_categories
    FOR UPDATE USING (is_admin());

CREATE POLICY forum_categories_delete_admin ON forum_categories
    FOR DELETE USING (is_admin());

-- forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_posts_select ON forum_posts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY forum_posts_insert ON forum_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY forum_posts_update ON forum_posts
    FOR UPDATE USING (author_id = auth.uid() OR is_admin());

CREATE POLICY forum_posts_delete ON forum_posts
    FOR DELETE USING (author_id = auth.uid() OR is_admin());

-- forum_replies
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY forum_replies_select ON forum_replies
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY forum_replies_insert ON forum_replies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY forum_replies_update ON forum_replies
    FOR UPDATE USING (author_id = auth.uid() OR is_admin());

CREATE POLICY forum_replies_delete ON forum_replies
    FOR DELETE USING (author_id = auth.uid() OR is_admin());
