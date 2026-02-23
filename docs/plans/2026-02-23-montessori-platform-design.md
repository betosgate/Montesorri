# Montessori Homeschool Platform — Complete Design Document

**Date:** 2026-02-23
**Status:** Draft — Awaiting Approval

---

## 1. PRODUCT OVERVIEW

### What We're Building
A full-featured, subscription-based ($50/student/month) Montessori homeschool web platform for K-6th grade (ages 5-12) that provides:

- **Complete day-by-day curriculum** for 36 weeks (180 school days) across 3 grade bands
- **Weekly live Zoom classes** with Montessori-trained teachers (groups of ≤20)
- **AI-generated lesson content** with text-to-speech audio narration
- **Interactive student dashboards** with drag-and-drop work plans
- **Montessori-specific progress tracking** with mastery levels and observation journals
- **Parent dashboards** with scheduling, tracking, and compliance reporting
- **Teacher management** with scheduling, substitutes, and class rosters
- **Community forums** for parent support
- **Stripe subscription billing** at $50/student/month

### Tech Stack
- **Frontend/Backend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Database + Auth + Storage:** Supabase (PostgreSQL, Auth, Row Level Security, Storage)
- **Payments:** Stripe Subscriptions + Webhooks
- **Audio Generation:** ElevenLabs TTS API (pre-generated, stored in Supabase Storage)
- **Deployment:** Vercel

### User Roles (4)
1. **Admin** — Platform owner; manages everything
2. **Teacher** — Sets schedule, manages Zoom links, runs weekly classes, can substitute
3. **Parent** — Manages subscription, enrolls students, views progress, tracks observations
4. **Student** — Age-appropriate dashboard, work plans, self-tracking (ages 9+)

---

## 2. CURRICULUM ARCHITECTURE

### 2.1 Grade Bands & Time Allocation

| Grade Band | Ages | Grades | Daily Hours | Weekly Days | Annual Weeks | Total School Days |
|---|---|---|---|---|---|---|
| Primary | 5-6 | K | 2-3 hrs | 5 | 36 | 180 |
| Lower Elementary | 6-9 | 1st-3rd | 3-4 hrs | 5 | 36 | 180 |
| Upper Elementary | 9-12 | 4th-6th | 3-4 hrs | 5 | 36 | 180 |

### 2.2 Subject Areas & Weekly Time Allocation

#### Primary (K) — ~2.5 hours/day

| Subject | Min/Day | Days/Week | Weekly Total |
|---|---|---|---|
| Practical Life | 20-30 | 5 | 125 min |
| Sensorial | 15-20 | 4 | 70 min |
| Language | 30-45 | 5 | 185 min |
| Math/Geometry | 30-40 | 5 | 175 min |
| Culture (Geo/Sci/History) | 20-30 | 4 | 100 min |
| Art/Music/Movement | 15-20 | 5 | 85 min |
| Read-Aloud | 15-20 | 5 | 85 min |

#### Lower Elementary (1-3) — ~3.5 hours/day

| Subject | Min/Day | Days/Week | Weekly Total |
|---|---|---|---|
| Language Arts | 45-60 | 5 | 260 min |
| Mathematics | 45-60 | 5 | 260 min |
| Geometry | 20-30 | 3 | 75 min |
| Geography | 20-30 | 3 | 75 min |
| History/Timeline | 20-30 | 3 | 75 min |
| Science/Botany/Zoology | 20-30 | 3 | 75 min |
| Practical Life | 20-30 | 3 | 75 min |
| Art/Music | 20-30 | 3 | 75 min |
| Research/Project Time | 30-60 | 3 | 120 min |
| Read-Aloud | 20-30 | 5 | 125 min |

#### Upper Elementary (4-6) — ~3.5 hours/day

| Subject | Min/Day | Days/Week | Weekly Total |
|---|---|---|---|
| Language Arts | 45-60 | 5 | 260 min |
| Mathematics | 45-60 | 5 | 260 min |
| Geometry | 20-30 | 3 | 75 min |
| Cultural Studies (Geo/Hist/Sci) | 30-45 | 4 | 150 min |
| Research/Independent Projects | 30-60 | 3 | 135 min |
| Practical Life/Community | 20-30 | 3 | 75 min |
| Art/Music | 20-30 | 3 | 75 min |
| Seminar/Discussion | 20-30 | 2 | 50 min |

### 2.3 Annual Calendar (36 Weeks)

**Quarter 1 — Weeks 1-9 (Sep-Nov)**
- Weeks 1-3: Great Lessons presentations (Elementary only) + routine establishment
- Weeks 4-9: Follow-up studies, introduce core materials, establish work cycle
- Assessment window: End of Week 9

**Quarter 2 — Weeks 10-18 (Nov-Jan)**
- Deepen Great Lessons follow-up
- Holiday/cultural celebrations integrated
- More complex materials as readiness shows
- Assessment window: End of Week 18

**Quarter 3 — Weeks 19-27 (Feb-Apr)**
- Most productive quarter — routines established
- Major research projects
- Increased independence
- Assessment window: End of Week 27

**Quarter 4 — Weeks 28-36 (Apr-Jun)**
- Review and consolidation
- Final research projects and presentations
- Year-end portfolio compilation
- Assessment window: End of Week 36

**Built-in Breaks:**
- Fall break: After Week 9 (1 week)
- Winter break: After Week 16-17 (2 weeks)
- Mid-winter break: After Week 22-23 (1 week)
- Spring break: After Week 30-31 (1 week)

### 2.4 Daily Schedule Templates

#### Primary Daily Template
```
8:30-8:45  Circle Time (calendar, song, grace & courtesy, day preview)
8:45-9:00  Guided Lesson 1 (Language)
9:00-9:30  Independent Work
9:30-9:45  Guided Lesson 2 (Math)
9:45-10:15 Independent Work
10:15-10:30 Snack / Movement Break
10:30-10:45 Guided Lesson 3 (Sensorial/Geometry/Culture)
10:45-11:15 Deep Work Period
11:15-11:30 Tidy Up / Reflection
11:30-12:00 Outdoor Time / Nature
12:00-12:30 Practical Life (Lunch Prep) + Lunch
12:30-1:00  Read-Aloud / Rest
1:00-1:30   Afternoon Work (Culture/Art/Music) — optional
```

#### Lower Elementary Daily Template
```
8:30-8:45  Morning Meeting (review work plan, daily goals)
8:45-9:00  Guided Lesson 1 (Math)
9:00-9:30  Independent Math Work
9:30-9:45  Guided Lesson 2 (Language)
9:45-10:15 Independent Language Work
10:15-10:30 Snack / Movement Break
10:30-10:45 Guided Lesson 3 (Culture/Science/History)
10:45-11:30 Deep Work / Research Time
11:30-11:45 Tidy Up / Journal
11:45-12:30 Outdoor Time / PE
12:30-1:00  Lunch
1:00-1:20   Read-Aloud
1:20-2:00   Afternoon Work (Art/Music/Continued Research)
2:00-2:15   End-of-Day Review
```

#### Upper Elementary Daily Template
```
8:30-8:45  Planning Meeting (child reviews work journal, sets goals)
8:45-9:00  Guided Lesson (Math or Language)
9:00-10:30 Independent Work Block 1 (self-paced from work plan)
10:30-10:45 Break / Snack
10:45-11:00 Guided Lesson 2 (if needed)
11:00-12:00 Independent Work Block 2 / Research
12:00-12:45 Lunch (child prepares independently)
12:45-1:15  Independent Reading
1:15-1:45   Seminar / Discussion / Zoom Class
1:45-2:30   Afternoon Work (Art/Music/Science/Going Out)
2:30-2:45   End-of-Day Reflection / Journal
```

### 2.5 Five Great Lessons Integration (Elementary Only)

Presented during Weeks 1-3 of each academic year:

| Week | Lesson | Follow-Up Subjects |
|---|---|---|
| 1 | Coming of the Universe | Physics, chemistry, astronomy, geology, geography |
| 1-2 | Coming of Life | Biology, botany, zoology, ecology, classification |
| 2 | Coming of Humans | History, social studies, inventions, fundamental needs |
| 2-3 | Story of Writing | Language arts, grammar, etymology, literature |
| 3 | Story of Numbers | Mathematics, geometry, measurement, number systems |

Each Great Lesson includes:
- Interactive slide presentation with AI narration
- Demonstration/experiment instructions for parent
- 8-week follow-up activity sequence
- Materials needed from inventory
- Cross-subject connection map

### 2.6 Content Volume Estimate

| Grade Band | Weeks | Days | Activities/Day | Total Activities |
|---|---|---|---|---|
| Primary (K) | 36 | 180 | 5 | ~900 |
| Lower Elementary (1-3) | 36 | 180 | 6 | ~1,080 |
| Upper Elementary (4-6) | 36 | 180 | 6 | ~1,080 |
| **Total** | | | | **~3,060** |

Each activity record contains:
- Title, description, detailed instructions
- Duration (minutes)
- Subject area + sub-area
- Materials needed (linked to inventory)
- Slide content (JSON structure for custom slide player)
- Audio narration URL (TTS-generated)
- Mastery criteria / tracking checkpoints
- Parent guide notes
- Age adaptations (for multi-age households)

---

## 3. DATA MODEL (Expanded)

### 3.1 Authentication & Users

```sql
-- Managed by Supabase Auth
auth.users (id, email, created_at, ...)

-- Extended profile
profiles
  id UUID PK → auth.users
  role ENUM (admin, teacher, parent, student)
  display_name TEXT
  avatar_url TEXT
  phone TEXT
  timezone TEXT
  onboarding_completed BOOLEAN
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
```

### 3.2 Students & Enrollment

```sql
students
  id UUID PK
  parent_id UUID → profiles
  first_name TEXT
  last_name TEXT
  date_of_birth DATE
  grade_band ENUM (primary, lower_elementary, upper_elementary)
  enrollment_status ENUM (active, paused, withdrawn)
  stripe_subscription_id TEXT
  academic_year INTEGER (e.g., 2026)
  start_week INTEGER (1-36, for mid-year enrollments)
  avatar_url TEXT
  created_at TIMESTAMPTZ

teachers
  id UUID PK
  user_id UUID → profiles
  bio TEXT
  qualifications TEXT
  zoom_link TEXT
  is_active BOOLEAN
  is_substitute BOOLEAN
  max_classes INTEGER
  created_at TIMESTAMPTZ

teacher_availability
  id UUID PK
  teacher_id UUID → teachers
  day_of_week INTEGER (0=Sun, 6=Sat)
  start_time TIME
  end_time TIME
  is_available BOOLEAN

classes
  id UUID PK
  teacher_id UUID → teachers
  grade_band ENUM (primary, lower_elementary, upper_elementary)
  title TEXT (e.g., "Primary Monday 10am")
  day_of_week INTEGER
  start_time TIME
  duration_minutes INTEGER (default 60)
  zoom_link TEXT
  max_students INTEGER (default 20)
  academic_year INTEGER
  status ENUM (active, cancelled, completed)
  created_at TIMESTAMPTZ

enrollments
  id UUID PK
  student_id UUID → students
  class_id UUID → classes
  enrolled_at TIMESTAMPTZ
  status ENUM (active, withdrawn)

class_sessions
  id UUID PK
  class_id UUID → classes
  session_date DATE
  session_number INTEGER (1-36)
  substitute_teacher_id UUID → teachers (nullable)
  zoom_link_override TEXT (nullable)
  status ENUM (scheduled, completed, cancelled)
  notes TEXT
  created_at TIMESTAMPTZ
```

### 3.3 Curriculum

```sql
curriculum_levels
  id UUID PK
  name TEXT (primary, lower_elementary, upper_elementary)
  display_name TEXT
  age_range TEXT
  daily_hours NUMERIC
  description TEXT

subjects
  id UUID PK
  name TEXT (practical_life, sensorial, language, math, geometry, culture, art_music)
  display_name TEXT
  icon TEXT
  color TEXT
  sort_order INTEGER

-- The full scope & sequence: every skill/concept in Montessori K-6
scope_sequence_items
  id UUID PK
  level_id UUID → curriculum_levels
  subject_id UUID → subjects
  sub_area TEXT (e.g., "grammar", "fractions", "botany")
  name TEXT (e.g., "Addition Snake Game", "Sandpaper Letters")
  description TEXT
  prerequisites JSONB (array of scope_sequence_item IDs)
  materials_needed JSONB (array of material codes)
  mastery_criteria TEXT
  three_period_applicable BOOLEAN
  sort_order INTEGER
  common_core_alignment JSONB (optional mapping)

-- The 36-week, day-by-day lesson plan
lessons
  id UUID PK
  level_id UUID → curriculum_levels
  subject_id UUID → subjects
  scope_item_id UUID → scope_sequence_items (nullable, links to what skill this teaches)
  week_number INTEGER (1-36)
  day_of_week INTEGER (1=Mon, 5=Fri)
  quarter INTEGER (1-4)
  title TEXT
  description TEXT
  instructions TEXT (detailed parent/guide instructions)
  duration_minutes INTEGER
  lesson_type ENUM (guided, independent, project, review, great_lesson, assessment)
  materials_needed JSONB (array of inventory codes)
  slide_content JSONB (structured content for slide player)
  audio_url TEXT (Supabase Storage path)
  parent_notes TEXT
  age_adaptations JSONB
  sort_order INTEGER
  created_at TIMESTAMPTZ

-- Great Lessons as special curriculum entries
great_lessons
  id UUID PK
  lesson_number INTEGER (1-5)
  title TEXT
  narrative TEXT (full story text)
  demonstrations JSONB (array of experiment descriptions)
  materials_needed JSONB
  slide_content JSONB
  audio_url TEXT
  follow_up_weeks INTEGER (typically 8)
  created_at TIMESTAMPTZ

great_lesson_followups
  id UUID PK
  great_lesson_id UUID → great_lessons
  week_offset INTEGER (1-8, weeks after presentation)
  level_id UUID → curriculum_levels
  focus_area TEXT
  activities JSONB (array of activity descriptions)
  materials_needed JSONB
```

### 3.4 Materials Inventory

```sql
materials_inventory
  id UUID PK
  code TEXT UNIQUE (e.g., "C010", "L032", "G010")
  name TEXT (e.g., "Number Rods", "Large Movable Alphabet")
  description TEXT
  subject_area TEXT
  sub_category TEXT (e.g., "Care of Self", "Decimal System")
  applicable_levels JSONB (array: ["primary", "lower_elementary"])
  age_range TEXT (e.g., "3-6", "6-9")
  image_url TEXT
  what_it_teaches TEXT
  prerequisites JSONB (material codes that should come before)
  next_in_sequence JSONB (material codes that follow)
  cross_subject_connections JSONB
  supplier_links JSONB (optional)
  purchase_url TEXT (link to Adena Montessori product page)
  diy_alternative TEXT (optional instructions for homemade version)
  created_at TIMESTAMPTZ
```

**Materials Supplier Integration:** Parents will have access to the full materials inventory with direct purchase links to [Adena Montessori](https://adenamontessori.com). Adena sells complete Montessori material packages:
- **Elementary Package (6-12):** 118 items, ~$3,499 (product codes match our inventory: C010, L032, G010, etc.)
- Individual items also available for purchase
- The parent dashboard "Materials" section will show what's needed for upcoming lessons with direct links to purchase from Adena.

### 3.5 Progress Tracking

```sql
-- Per-skill mastery tracking (maps to scope & sequence)
student_mastery
  id UUID PK
  student_id UUID → students
  scope_item_id UUID → scope_sequence_items
  status ENUM (not_introduced, presented, practicing, developing, mastered, applied)
  date_presented DATE
  date_mastered DATE (nullable)
  three_period_stage INTEGER (1, 2, or 3; nullable)
  notes TEXT
  updated_at TIMESTAMPTZ

-- Per-lesson completion tracking (daily work log)
student_lesson_progress
  id UUID PK
  student_id UUID → students
  lesson_id UUID → lessons
  status ENUM (not_started, in_progress, completed, skipped)
  completed_at TIMESTAMPTZ
  duration_actual INTEGER (minutes)
  parent_notes TEXT
  student_self_assessment TEXT (for ages 9+)

-- Observation journal (Montessori-style anecdotal records)
observations
  id UUID PK
  student_id UUID → students
  observer_id UUID → profiles (parent or teacher)
  observation_date DATE
  observation_type ENUM (anecdotal, work_log, concentration, social_emotional)
  curriculum_area TEXT (nullable)
  content TEXT
  concentration_duration INTEGER (minutes, nullable)
  independence_level ENUM (needs_presentation, needs_prompt, independent; nullable)
  photo_urls JSONB (array of Supabase Storage paths)
  created_at TIMESTAMPTZ

-- Weekly work plans (drag-and-drop selections)
work_plans
  id UUID PK
  student_id UUID → students
  week_number INTEGER
  academic_year INTEGER
  planned_activities JSONB (array of lesson IDs + optional custom activities)
  must_do JSONB (required lesson IDs for the week)
  may_do JSONB (optional/choice lesson IDs)
  reflection_notes TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

-- Quarterly assessments
quarterly_assessments
  id UUID PK
  student_id UUID → students
  quarter INTEGER (1-4)
  academic_year INTEGER
  assessor_id UUID → profiles
  -- Per-subject mastery summaries
  practical_life JSONB (checklist items with status)
  sensorial JSONB
  language JSONB
  math JSONB
  geometry JSONB
  culture JSONB
  social_emotional JSONB
  normalization_indicators JSONB
  narrative_summary TEXT
  goals_next_quarter TEXT
  portfolio_items JSONB (array of URLs)
  created_at TIMESTAMPTZ

-- Portfolio items
portfolio_items
  id UUID PK
  student_id UUID → students
  item_type ENUM (work_sample, photo, video, writing, project, art)
  curriculum_area TEXT
  title TEXT
  description TEXT
  file_url TEXT
  date_created DATE
  featured BOOLEAN
  created_at TIMESTAMPTZ

-- Normalization tracking (periodic snapshots)
normalization_snapshots
  id UUID PK
  student_id UUID → students
  snapshot_date DATE
  love_of_order INTEGER (1-5 scale)
  love_of_work INTEGER
  spontaneous_concentration INTEGER
  attachment_to_reality INTEGER
  independence INTEGER
  spontaneous_self_discipline INTEGER
  joy INTEGER
  notes TEXT
  created_at TIMESTAMPTZ
```

### 3.6 Community

```sql
forum_categories
  id UUID PK
  name TEXT
  description TEXT
  sort_order INTEGER

forum_posts
  id UUID PK
  category_id UUID → forum_categories
  author_id UUID → profiles
  title TEXT
  content TEXT
  pinned BOOLEAN
  locked BOOLEAN
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

forum_replies
  id UUID PK
  post_id UUID → forum_posts
  author_id UUID → profiles
  content TEXT
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ
```

### 3.7 Payments

```sql
subscriptions
  id UUID PK
  parent_id UUID → profiles
  student_id UUID → students
  stripe_customer_id TEXT
  stripe_subscription_id TEXT
  status ENUM (active, past_due, cancelled, trialing)
  current_period_start TIMESTAMPTZ
  current_period_end TIMESTAMPTZ
  cancel_at_period_end BOOLEAN
  created_at TIMESTAMPTZ
  updated_at TIMESTAMPTZ

payment_history
  id UUID PK
  subscription_id UUID → subscriptions
  stripe_invoice_id TEXT
  amount_cents INTEGER
  status ENUM (paid, failed, refunded)
  paid_at TIMESTAMPTZ
```

---

## 4. FEATURE SPECIFICATIONS

### 4.1 Landing Page & Onboarding

**Public pages:**
- Marketing landing page with program overview
- Pricing page ($50/student/month)
- Teacher bios
- FAQ / How it works

**Signup flow:**
1. Parent creates account (email/password via Supabase Auth)
2. Add student(s): name, DOB, grade band
3. Placement quiz (optional): quick assessment to place student in correct starting point within scope & sequence
4. Select class time: browse available weekly Zoom sessions by grade band, pick one
5. Payment: Stripe Checkout for $50/student/month subscription
6. Dashboard tour: guided walkthrough of parent + student dashboards

### 4.2 Parent Dashboard

**Home view:**
- Today's lessons for each enrolled student (with status)
- Upcoming Zoom class (day, time, join link)
- Quick-add observation button
- Weekly progress summary

**Calendar view:**
- Month/week/day views
- Lessons color-coded by subject
- Zoom class dates highlighted
- Holiday/break dates shown
- Click any day to see full lesson plan

**Student progress:**
- Visual "Montessori Map" — skill tree per subject area with color-coded mastery status
- Progress bars by subject (% of scope items mastered)
- Recent observations timeline
- Work log history
- Quarterly assessment reports
- Portfolio gallery

**Class management:**
- Current class enrollment details
- Teacher info + Zoom link
- Class schedule / upcoming sessions
- Attendance history

**Account/billing:**
- Subscription management (via Stripe Customer Portal)
- Add/remove students
- Update payment method
- Invoice history

### 4.3 Student Dashboard (Ages 9+)

**My Work Plan (this week):**
- Drag-and-drop interface showing weekly activities
- "Must Do" (required) vs "May Do" (choice) sections
- Check off completed activities
- Self-assessment after each activity ("How did it feel?")

**Today's Lessons:**
- Slide viewer with audio narration for each lesson
- Materials checklist ("You'll need: Number Rods, Golden Beads")
- Timer for work periods
- "I'm done!" completion button

**My Progress:**
- Age-appropriate skill tree visualization
- Badges/achievements for milestones
- "What I've mastered" showcase
- Journal/reflection entries

**My Zoom Class:**
- Next class countdown timer
- Join button (appears 5 min before class)
- Classmates list

### 4.4 Teacher Dashboard

**My Schedule:**
- Calendar of all assigned weekly classes
- Student rosters per class
- Session history with notes

**Class Management:**
- View enrolled students per class
- Mark attendance
- Add session notes
- Request substitute (notifies admin)

**Profile Management:**
- Update Zoom link
- Set availability windows
- Update bio/qualifications

### 4.5 Admin Dashboard

**Teacher Management:**
- Add/edit/deactivate teachers
- View all classes and assignments
- Assign substitutes
- Coverage overview (all time slots filled?)

**Class Management:**
- Create/edit/cancel classes
- Set academic year calendar
- Manage enrollment caps
- Reassign teachers

**Student/Parent Management:**
- View all enrolled families
- Subscription status overview
- Support tools (password reset, account issues)

**Content Management:**
- Curriculum editor (add/edit lessons, materials)
- Audio regeneration (re-run TTS for updated lessons)
- Announcement system

**Analytics:**
- Total enrolled students
- Revenue metrics (from Stripe)
- Class fill rates
- Engagement metrics (lesson completion rates)

### 4.6 Interactive Lesson Slide Player

Custom React component that renders lesson content:

**Slide structure (JSON):**
```json
{
  "slides": [
    {
      "type": "title",
      "heading": "Addition Snake Game",
      "subheading": "Week 5, Day 2 — Mathematics",
      "image_url": "/lessons/math/snake-game-hero.jpg"
    },
    {
      "type": "materials",
      "items": ["C204 Addition Snake Game", "C010 Number Rods"],
      "setup_instructions": "Place the snake game mat on the table..."
    },
    {
      "type": "instruction",
      "step": 1,
      "text": "Lay out the colored bead bars end to end to form a 'snake'...",
      "image_url": "/lessons/math/snake-step1.jpg",
      "audio_segment": "0:00-0:45"
    },
    {
      "type": "activity",
      "prompt": "Now it's your turn! Build your own snake and count...",
      "duration_minutes": 20
    },
    {
      "type": "check_understanding",
      "questions": [
        {"q": "How many beads are in your snake?", "type": "free_response"},
        {"q": "Did you need to exchange any tens?", "type": "yes_no"}
      ]
    },
    {
      "type": "wrap_up",
      "text": "Great work! Return the beads to the tray...",
      "mastery_check": "Can your child build and count a snake independently?"
    }
  ]
}
```

**Features:**
- Auto-playing audio narration (with pause/replay)
- Swipe/click navigation between slides
- Materials checklist with checkboxes
- Timer for work periods
- Completion tracking (marks lesson as done)
- Fullscreen mode
- Responsive (tablet-friendly for ages 9+)

### 4.7 Work Plan Builder

**Weekly planning interface:**
- Grid: days (Mon-Fri) × time blocks
- Left sidebar: available lessons for this week (auto-populated from curriculum)
- Drag lessons onto the grid
- "Must Do" items are pre-placed and locked
- "May Do" items are in a pool for student/parent to place
- Save/load work plans
- Print-friendly version

### 4.8 Progress Tracking System

**Mastery levels (6-stage):**
1. **Not Introduced** (gray) — Not yet presented
2. **Presented** (yellow) — Initial lesson given
3. **Practicing** (orange) — Actively working, not yet consistent
4. **Developing** (blue) — Growing competence
5. **Mastered** (green) — Independent, accurate, consistent
6. **Applied** (purple) — Uses in new contexts

**Skill Tree Visualization:**
- Per-subject interactive tree showing all scope & sequence items
- Color-coded by mastery level
- Click any node to see history: dates, notes, linked observations
- Filter by status ("Show me everything that's Practicing")
- Prerequisites shown as connections between nodes

**Quick Entry (for daily use):**
- After completing a lesson, parent taps mastery level
- Optional: add a quick note or photo
- Takes <10 seconds per lesson

**Automated suggestions:**
- "Ready for next presentation" — flags when prerequisites are mastered
- "Review needed" — flags items not practiced in 30+ days
- "Curriculum gap" — highlights subjects being underserved

### 4.9 Community Forums

**Categories:**
- General Discussion
- Grade-Specific (Primary, Lower Elem, Upper Elem)
- Subject Help (Math, Language, etc.)
- Materials & DIY
- Special Needs / Adaptations
- Off-Topic / Introductions

**Features:**
- Threaded discussions
- Pin/lock posts (admin)
- Rich text with image uploads
- Notification preferences
- Search

### 4.10 Stripe Integration

**Subscription flow:**
1. Parent selects student(s) to enroll
2. Redirect to Stripe Checkout ($50/student/month)
3. Webhook confirms payment → activate enrollment
4. Monthly recurring billing
5. Stripe Customer Portal for self-service (cancel, update card, view invoices)

**Webhooks handled:**
- `checkout.session.completed` → create subscription record, activate student
- `invoice.paid` → update subscription status
- `invoice.payment_failed` → mark past_due, send warning
- `customer.subscription.deleted` → deactivate student access

---

## 5. CONTENT GENERATION STRATEGY

### 5.1 Curriculum Data Seeding

The ~3,060 lesson activities will be generated as structured data and seeded into the database. Content generation approach:

1. **Scope & Sequence first** — Seed all ~500+ scope_sequence_items from the research (skills/concepts per subject per level)
2. **Materials inventory** — Seed 250+ materials from the catalog research
3. **36-week lesson plans** — Generate day-by-day lessons mapped to scope & sequence, referencing materials
4. **Great Lessons** — Seed 5 Great Lessons with full narratives, demonstrations, 8-week follow-up sequences
5. **Slide content** — Generate JSON slide structures for each lesson
6. **Audio** — Generate TTS audio via ElevenLabs for each lesson's narration

### 5.2 Content Generation Order

| Phase | Content | Records | Method |
|---|---|---|---|
| 1 | Materials inventory | ~250 | Seed from research catalog |
| 2 | Scope & sequence items | ~500+ | Seed from research, organized by level/subject |
| 3 | Primary (K) lessons | ~900 | AI-generated, week-by-week, 36 weeks |
| 4 | Lower Elementary lessons | ~1,080 | AI-generated, week-by-week, 36 weeks |
| 5 | Upper Elementary lessons | ~1,080 | AI-generated, week-by-week, 36 weeks |
| 6 | Great Lessons | 5 + 40 follow-ups | AI-generated from research narratives |
| 7 | Quarterly assessments | 12 templates (4 per level) | AI-generated checklists from scope |
| 8 | TTS audio | ~3,060 files | ElevenLabs API batch generation |

### 5.3 Holiday Calendar (Built-In)

Standard US school calendar with configurable overrides:

| Break | After Week | Duration |
|---|---|---|
| Labor Day | Week 1 | 1 day (Mon) |
| Columbus Day | Week 6 | 1 day (Mon) |
| Veterans Day | Week 10 | 1 day |
| Thanksgiving | Week 12 | Wed-Fri |
| Winter Break | Week 16-17 | 2 weeks |
| MLK Day | Week 19 | 1 day (Mon) |
| Presidents Day | Week 21 | 1 day (Mon) |
| Spring Break | Week 30-31 | 1 week |
| Memorial Day | Week 35 | 1 day (Mon) |

---

## 6. STATE COMPLIANCE & REPORTING

### Auto-Generated Reports

1. **Attendance Log** — Auto-tracked from lesson completions (days with ≥1 completed lesson = school day)
2. **Subject Coverage Report** — Hours per subject per quarter, mapped to state requirements
3. **Progress Report (Narrative)** — Template-driven with auto-populated mastery data
4. **Portfolio Export** — PDF compilation of work samples, photos, observations
5. **Standards Crosswalk** — Montessori skills mapped to Common Core (for states that require it)
6. **Annual Summary** — Exportable PDF with full year's progress

---

## 7. UI/UX PRINCIPLES

Based on competitive research and Montessori philosophy:

- **Calm, natural aesthetic** — Muted earth tones, clean typography, lots of white space. No bright gamification, no cartoon characters.
- **Responsive** — Desktop-first for parents, tablet-friendly for student dashboard
- **Minimal clicks** — Daily workflow (view lessons → complete → track) in ≤3 clicks
- **Quick entry** — Observation logging in <10 seconds
- **Parent view vs Student view** — Separate dashboards, age-appropriate
- **Offline-capable** — Service worker caching for lesson content (stretch goal)
- **Accessible** — WCAG 2.1 AA compliance

---

## 8. SECURITY & ROW-LEVEL SECURITY

Supabase RLS policies ensure:

- Parents can only see their own students' data
- Teachers can only see students enrolled in their classes
- Students can only see their own progress and their class info
- Admin has full access
- Subscription status gates access to curriculum content
- File storage (audio, images) uses signed URLs with expiry

---

## 9. DEPLOYMENT & INFRASTRUCTURE

- **Vercel** — Next.js hosting with edge functions
- **Supabase** — Managed PostgreSQL, Auth, Storage, Edge Functions
- **Stripe** — Payment processing (webhook endpoint on Vercel)
- **ElevenLabs** — TTS generation (batch, pre-deployment; not real-time)
- **Domain** — TBD (e.g., montessorihomeschool.com)
- **CDN** — Vercel Edge Network for static assets + Supabase CDN for audio files

---

## 10. IMPLEMENTATION PHASES (High Level)

### Phase 1: Foundation (MVP)
- Next.js project setup + Supabase + Auth
- Database schema + RLS policies
- Parent/Teacher/Student/Admin role system
- Stripe subscription integration
- Landing page + signup flow

### Phase 2: Curriculum Engine
- Seed materials inventory (250+ items)
- Seed scope & sequence (500+ items)
- Generate + seed Primary (K) curriculum (36 weeks, 900 lessons)
- Generate + seed Elementary curriculum (36 weeks × 2 levels)
- Custom slide player component
- TTS audio generation + storage

### Phase 3: Core Dashboards
- Parent dashboard (today's lessons, calendar, progress)
- Student dashboard (work plan, lessons, my progress)
- Teacher dashboard (schedule, rosters, session notes)
- Admin dashboard (teacher/class/student management)

### Phase 4: Tracking & Assessment
- Mastery tracking system (6-stage)
- Observation journal
- Work plan builder (drag-and-drop)
- Quarterly assessment templates
- Skill tree visualization
- Portfolio system

### Phase 5: Social & Community
- Zoom integration (link storage + display)
- Class scheduling + enrollment
- Substitute teacher assignment
- Community forums

### Phase 6: Polish & Compliance
- State compliance reports (attendance, coverage, portfolio export)
- Standards crosswalk (Common Core mapping)
- Onboarding flow + placement quiz
- Email notifications
- Mobile responsiveness polish
- Analytics dashboard (admin)

---

*This design document covers the complete Montessori Homeschool Platform as specified, with full 36-week curriculum coverage across all grade bands, all subject areas meeting their time allocation targets for a complete 9-month academic year.*
