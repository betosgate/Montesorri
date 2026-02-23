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
