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
