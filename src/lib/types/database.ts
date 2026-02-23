// ============================================================================
// Enums (string union types)
// ============================================================================

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export type GradeBand = 'primary' | 'lower_elementary' | 'upper_elementary';

export type EnrollmentStatus = 'active' | 'paused' | 'withdrawn';

export type ClassStatus = 'active' | 'cancelled' | 'completed';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing';

export type PaymentStatus = 'paid' | 'failed' | 'refunded';

export type LessonType =
  | 'guided'
  | 'independent'
  | 'project'
  | 'review'
  | 'great_lesson'
  | 'assessment';

export type MasteryStatus =
  | 'not_introduced'
  | 'presented'
  | 'practicing'
  | 'developing'
  | 'mastered'
  | 'applied';

export type IndependenceLevel =
  | 'needs_presentation'
  | 'needs_prompt'
  | 'independent';

export type ObservationType =
  | 'anecdotal'
  | 'work_log'
  | 'concentration'
  | 'social_emotional';

export type LessonProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped';

export type PortfolioItemType =
  | 'work_sample'
  | 'photo'
  | 'video'
  | 'writing'
  | 'project'
  | 'art';

// ============================================================================
// Slide types (discriminated union)
// ============================================================================

export interface TitleSlide {
  type: 'title';
  title: string;
  subtitle: string | null;
  image_url: string | null;
}

export interface MaterialsSlide {
  type: 'materials';
  title: string;
  materials: string[];
  image_url: string | null;
}

export interface InstructionSlide {
  type: 'instruction';
  title: string;
  content: string;
  image_url: string | null;
  demonstration_notes: string | null;
}

export interface ActivitySlide {
  type: 'activity';
  title: string;
  instructions: string;
  duration_minutes: number | null;
  image_url: string | null;
}

export interface CheckUnderstandingSlide {
  type: 'check_understanding';
  title: string;
  questions: string[];
  expected_responses: string[];
}

export interface WrapUpSlide {
  type: 'wrap_up';
  title: string;
  summary: string;
  next_steps: string | null;
  extension_activities: string[];
}

export type Slide =
  | TitleSlide
  | MaterialsSlide
  | InstructionSlide
  | ActivitySlide
  | CheckUnderstandingSlide
  | WrapUpSlide;

export interface SlideContent {
  slides: Slide[];
}

// ============================================================================
// Database table interfaces
// ============================================================================

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  grade_band: GradeBand;
  enrollment_status: EnrollmentStatus;
  stripe_subscription_id: string | null;
  academic_year: string;
  start_week: number;
  avatar_url: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  bio: string | null;
  qualifications: string | null;
  zoom_link: string | null;
  is_active: boolean;
  is_substitute: boolean;
  max_classes: number;
  created_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  grade_band: GradeBand;
  title: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  zoom_link: string | null;
  max_students: number;
  academic_year: string;
  status: ClassStatus;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface CurriculumLevel {
  id: string;
  name: string;
  display_name: string;
  age_range: string;
  daily_hours: number;
  description: string | null;
}

export interface Subject {
  id: string;
  name: string;
  display_name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

export interface ScopeSequenceItem {
  id: string;
  level_id: string;
  subject_id: string;
  sub_area: string | null;
  name: string;
  description: string | null;
  prerequisites: string[];
  materials_needed: string[];
  mastery_criteria: string | null;
  three_period_applicable: boolean;
  sort_order: number;
  common_core_alignment: string | null;
}

export interface Lesson {
  id: string;
  level_id: string;
  subject_id: string;
  scope_item_id: string | null;
  week_number: number;
  day_of_week: number;
  quarter: number;
  title: string;
  description: string | null;
  instructions: string | null;
  duration_minutes: number;
  lesson_type: LessonType;
  materials_needed: string[];
  slide_content: SlideContent | null;
  audio_url: string | null;
  parent_notes: string | null;
  age_adaptations: string | null;
  sort_order: number;
  created_at: string;
}

export interface GreatLesson {
  id: string;
  lesson_number: number;
  title: string;
  narrative: string;
  demonstrations: string[];
  materials_needed: string[];
  slide_content: SlideContent | null;
  audio_url: string | null;
  follow_up_weeks: number;
  created_at: string;
}

export interface MaterialsInventory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  subject_area: string;
  sub_category: string | null;
  applicable_levels: string[];
  age_range: string | null;
  image_url: string | null;
  what_it_teaches: string | null;
  prerequisites: string[];
  next_in_sequence: string[];
  cross_subject_connections: string[];
  supplier_links: string[];
  purchase_url: string | null;
  diy_alternative: string | null;
  created_at: string;
}

export interface StudentMastery {
  id: string;
  student_id: string;
  scope_item_id: string;
  status: MasteryStatus;
  date_presented: string | null;
  date_mastered: string | null;
  three_period_stage: number | null;
  notes: string | null;
  updated_at: string;
}

export interface StudentLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  completed_at: string | null;
  duration_actual: number | null;
  parent_notes: string | null;
  student_self_assessment: number | null;
}

export interface Observation {
  id: string;
  student_id: string;
  observer_id: string;
  observation_date: string;
  observation_type: ObservationType;
  curriculum_area: string | null;
  content: string;
  concentration_duration: number | null;
  independence_level: IndependenceLevel | null;
  photo_urls: string[];
  created_at: string;
}

export interface WorkPlan {
  id: string;
  student_id: string;
  week_number: number;
  academic_year: string;
  planned_activities: string[];
  must_do: string[];
  may_do: string[];
  reflection_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  parent_id: string;
  student_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  category_id: string;
  author_id: string;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ForumReply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}
