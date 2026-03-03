import type { ToolDefinition } from './types'

export const agentTools: ToolDefinition[] = [
  {
    name: 'search_faq',
    description: 'Search the local compliance FAQ knowledge base. Use this FIRST before answering any compliance question to check if we have a pre-written answer. Returns top matching FAQ entries with confidence scores.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The user\'s question or keywords to search for',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_user_profile',
    description: 'Fetch the current parent\'s profile from the database, including name, state, address, phone, and compliance settings.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_students',
    description: 'Fetch all enrolled students for the current parent, including names, grade bands, dates of birth, and enrollment status.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_state_requirements',
    description: 'Look up the homeschool compliance requirements for a specific state. Returns tier level, required subjects, attendance rules, filing deadlines, and more.',
    input_schema: {
      type: 'object',
      properties: {
        state_code: {
          type: 'string',
          description: 'Two-letter US state code (e.g., "NY", "CA", "TX")',
        },
      },
      required: ['state_code'],
    },
  },
  {
    name: 'get_attendance_data',
    description: 'Fetch attendance statistics for a specific student, including total days attended, unique school days, and current progress toward state requirements.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'The student\'s UUID',
        },
      },
      required: ['student_id'],
    },
  },
  {
    name: 'get_subject_hours',
    description: 'Fetch a breakdown of instruction hours by subject area for a specific student, showing how Montessori subjects map to state-required categories.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'The student\'s UUID',
        },
      },
      required: ['student_id'],
    },
  },
  {
    name: 'get_lesson_progress',
    description: 'Fetch lesson completion statistics for a specific student: total lessons, completed, in progress, by subject area, and completion percentage.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'The student\'s UUID',
        },
      },
      required: ['student_id'],
    },
  },
  {
    name: 'update_user_profile',
    description: 'Save or update the parent\'s profile fields such as address, phone, email, or state. Use this when the user provides their address or contact info for compliance forms.',
    input_schema: {
      type: 'object',
      properties: {
        address_line1: { type: 'string', description: 'Street address line 1' },
        address_line2: { type: 'string', description: 'Street address line 2 (apt, suite, etc.)' },
        city: { type: 'string', description: 'City name' },
        state_address: { type: 'string', description: 'State for mailing address (2-letter code)' },
        zip_code: { type: 'string', description: 'ZIP code (5 or 9 digit)' },
        phone: { type: 'string', description: 'Phone number' },
        email_override: { type: 'string', description: 'Preferred contact email (if different from login)' },
        state_code: { type: 'string', description: 'Homeschool compliance state code (2-letter)' },
        state_name: { type: 'string', description: 'Full state name for compliance' },
      },
    },
  },
  {
    name: 'generate_notice_of_intent',
    description: 'Generate a complete Notice of Intent to Homeschool letter using the parent\'s profile data and student information. Returns the formatted letter text ready for printing.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'check_compliance_status',
    description: 'Cross-reference the parent\'s data against their state\'s requirements and return a compliance checklist showing what\'s complete and what\'s missing.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_subscription_details',
    description: 'Fetch subscription status, billing dates, payment history, and enrollment date for the parent\'s students. Returns subscription status, cancel_at_period_end, days since enrollment, days into current billing cycle, and recent payments.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'Optional student UUID. If omitted, returns all subscriptions for the parent.',
        },
      },
    },
  },
  {
    name: 'cancel_subscription',
    description: 'Cancel a student\'s subscription at the end of the current billing period. The student retains full access until then. No immediate cancellation — always cancel at period end.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'The student UUID whose subscription to cancel',
        },
        reason: {
          type: 'string',
          description: 'The reason the parent wants to cancel (from conversation)',
        },
      },
      required: ['student_id', 'reason'],
    },
  },
  {
    name: 'request_refund',
    description: 'Process a refund via Stripe for a student\'s enrollment fee or most recent monthly charge. Returns policy eligibility and processes the refund if approved.',
    input_schema: {
      type: 'object',
      properties: {
        student_id: {
          type: 'string',
          description: 'The student UUID for the refund',
        },
        refund_type: {
          type: 'string',
          enum: ['enrollment', 'monthly'],
          description: 'Whether to refund the $150 enrollment fee or the $50 monthly charge',
        },
        reason: {
          type: 'string',
          description: 'The reason for the refund request',
        },
        override_policy: {
          type: 'boolean',
          description: 'Set to true to override the refund policy window (e.g., for aggressive/insistent parents to avoid chargebacks). Default false.',
        },
      },
      required: ['student_id', 'refund_type', 'reason'],
    },
  },
  {
    name: 'escalate_to_support',
    description: 'Create a support ticket and escalate to the human support team. Use when: the parent is still unsatisfied after 3 exchanges, specifically asks for a human, or the issue requires manual investigation.',
    input_schema: {
      type: 'object',
      properties: {
        subject: {
          type: 'string',
          description: 'Brief ticket subject line',
        },
        category: {
          type: 'string',
          enum: ['refund', 'cancellation', 'billing', 'technical', 'other'],
          description: 'Ticket category',
        },
        conversation_summary: {
          type: 'string',
          description: 'Summary of the conversation and what the parent needs',
        },
      },
      required: ['subject', 'category', 'conversation_summary'],
    },
  },
]
