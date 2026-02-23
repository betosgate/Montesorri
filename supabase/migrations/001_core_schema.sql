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
