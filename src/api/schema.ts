/*
 * COPY of pwd-giv-backend/src/contract/schema.ts (the master). Don't edit here first:
 * change the backend copy (both teams must agree), then copy it here.
 */
import { z } from 'zod';

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  ABILITY CONNECT DATA CONTRACT
 *  What a student submits, and what the student portal and the GIV admin
 *  frontend both read. Master copy: pwd-giv-backend/src/contract/schema.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------- Option lists (stored as these stable codes, shown with labels) ----------

export const CONTACT_METHODS = ['call', 'sms', 'whatsapp', 'email', 'in_person'] as const;
export const RESIDENCE_TYPES = ['hall', 'hostel', 'private', 'home'] as const;

/** Washington Group short set functional domains, plus psychosocial. */
export const FUNCTION_AREAS = [
  'seeing',
  'hearing',
  'walking',
  'remembering',
  'self_care',
  'communicating',
  'upper_body',
  'psychosocial',
] as const;

/** Washington Group response scale (we drop "no difficulty": unselected means none). */
export const DIFFICULTY_LEVELS = ['some', 'a_lot', 'cannot'] as const;

export const CONDITIONS = [
  'blind_low_vision',
  'deaf_hard_of_hearing',
  'physical_mobility',
  'albinism',
  'learning_difficulty',
  'autism',
  'adhd',
  'mental_health',
  'epilepsy',
  'sickle_cell',
  'chronic_illness',
  'speech',
  'other',
] as const;

export const DURATIONS = ['permanent', 'long_term', 'temporary', 'not_sure'] as const;
export const DOCUMENTATION = ['yes', 'no', 'in_progress'] as const;

export const ACADEMIC_SUPPORT = [
  'lecture_notes_early',
  'lecture_recordings',
  'note_taker',
  'sign_interpreter',
  'captioning',
  'accessible_venue',
  'front_seating',
  'braille_large_print',
  'assignment_extensions',
  'library_assistance',
] as const;

export const EXAM_SUPPORT = [
  'extra_time',
  'separate_room',
  'scribe',
  'reader',
  'large_print_paper',
  'braille_paper',
  'computer_use',
  'rest_breaks',
  'ground_floor_venue',
] as const;

export const LIVING_SUPPORT = [
  'ground_floor_room',
  'accessible_bathroom',
  'room_near_facilities',
  'room_for_assistant',
  'campus_transport',
  'accessible_route_guidance',
] as const;

export const DEVICES = [
  'wheelchair',
  'crutches_cane',
  'white_cane',
  'prosthesis',
  'hearing_aid',
  'screen_reader',
  'magnifier',
  'braille_device',
  'laptop',
  'smartphone',
  'sunscreen_hat', // common need for students with albinism
] as const;

export const OTHER_SUPPORT = [
  'counselling',
  'health_services',
  'financial_support',
  'mentorship',
  'peer_support',
  'career_support',
  'assistive_tech_training',
] as const;

export const RELATIONSHIPS = ['parent', 'guardian', 'sibling', 'spouse', 'relative', 'friend', 'personal_assistant', 'other'] as const;

// ---------- Student record (from the university, read-only in this app) ----------

export const studentRecordSchema = z.object({
  studentId: z.string(),
  indexNumber: z.string(),
  fullName: z.string(),
  universityEmail: z.string(),
  college: z.string(),
  programme: z.string(),
  level: z.string(),
  campus: z.string(),
});
export type StudentRecord = z.infer<typeof studentRecordSchema>;

// ---------- Registration, step by step ----------

const ghPhone = z
  .string()
  .trim()
  .regex(/^(\+?233|0)\d{9}$/, 'Enter a Ghana phone number, for example 024 123 4567 or +233 24 123 4567');

const optionalText = z.string().trim().max(1000).optional().or(z.literal(''));

export const contactSchema = z
  .object({
    preferredName: optionalText,
    phone: ghPhone,
    whatsappSameAsPhone: z.boolean(),
    whatsapp: z.string().trim().optional(),
    personalEmail: z.email('Enter a valid email address, for example ama@gmail.com').optional().or(z.literal('')),
    contactMethods: z.array(z.enum(CONTACT_METHODS)).min(1, 'Choose at least one way for GIV to reach you'),
    residenceType: z.enum(RESIDENCE_TYPES, { error: 'Tell us where you stay' }),
    residenceName: optionalText,
  })
  .superRefine((v, ctx) => {
    if (!v.whatsappSameAsPhone && v.whatsapp && !/^(\+?233|0)\d{9}$/.test(v.whatsapp.replace(/\s/g, ''))) {
      ctx.addIssue({ code: 'custom', path: ['whatsapp'], message: 'Enter a valid Ghana WhatsApp number' });
    }
  });

export const disabilitySchema = z
  .object({
    functions: z.partialRecord(z.enum(FUNCTION_AREAS), z.enum(DIFFICULTY_LEVELS)),
    conditions: z.array(z.enum(CONDITIONS)),
    otherCondition: optionalText,
    duration: z.enum(DURATIONS, { error: 'Choose how long this has affected you' }),
    description: optionalText,
    documentation: z.enum(DOCUMENTATION, { error: 'Choose one option' }),
    documentName: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (Object.keys(v.functions).length === 0 && v.conditions.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['functions'],
        message: 'Choose at least one area of difficulty or one condition, so GIV knows how to help',
      });
    }
    if (v.conditions.includes('other') && !v.otherCondition?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['otherCondition'], message: 'Tell us the other condition, in your own words' });
    }
  });

export const supportSchema = z.object({
  academic: z.array(z.enum(ACADEMIC_SUPPORT)),
  exams: z.array(z.enum(EXAM_SUPPORT)),
  living: z.array(z.enum(LIVING_SUPPORT)),
  devicesUsed: z.array(z.enum(DEVICES)),
  devicesNeeded: z.array(z.enum(DEVICES)),
  other: z.array(z.enum(OTHER_SUPPORT)),
  notes: optionalText,
});

export const emergencySchema = z.object({
  name: z.string().trim().min(2, 'Enter the name of your emergency contact'),
  relationship: z.enum(RELATIONSHIPS, { error: 'Choose how this person is related to you' }),
  phone: ghPhone,
  hasPersonalAssistant: z.boolean(),
  assistantName: optionalText,
});

export const consentSchema = z.object({
  // Must be true to submit; typed as boolean so the form can start unticked.
  shareWithGiv: z.boolean().refine((v) => v, 'You need to agree to this so the GIV Office can see your details'),
  shareWithFaculty: z.boolean(),
  shareWithHall: z.boolean(),
  contactForEvents: z.boolean(),
  declaration: z.boolean().refine((v) => v, 'Please confirm that your details are correct'),
});

export const registrationSchema = z.object({
  contact: contactSchema,
  disability: disabilitySchema,
  support: supportSchema,
  emergency: emergencySchema,
  consent: consentSchema,
});

export type ContactInfo = z.infer<typeof contactSchema>;
export type DisabilityInfo = z.infer<typeof disabilitySchema>;
export type SupportInfo = z.infer<typeof supportSchema>;
export type EmergencyInfo = z.infer<typeof emergencySchema>;
export type ConsentInfo = z.infer<typeof consentSchema>;
export type RegistrationData = z.infer<typeof registrationSchema>;

/** A draft may be partly filled. */
export type RegistrationDraft = {
  [K in keyof RegistrationData]?: Partial<RegistrationData[K]>;
};

// ---------- Status lifecycle (GIV admin moves a record through these) ----------

export const STATUSES = ['draft', 'submitted', 'in_review', 'contacted', 'support_active'] as const;
export type RegistrationStatus = (typeof STATUSES)[number];

export type StatusEvent = {
  status: RegistrationStatus;
  at: string; // ISO date
  note?: string; // optional message from GIV shown to the student
};

/** What the server stores for one student. */
export type RegistrationRecord = {
  studentId: string;
  status: RegistrationStatus;
  draft: RegistrationDraft;
  data?: RegistrationData; // present once submitted
  history: StatusEvent[];
  updatedAt: string;
  submittedAt?: string;
  /** Last time the student confirmed their needs are still correct (asked once per semester). */
  confirmedAt?: string;
};

// ---------- Support requests (Phase 2) ----------
// A specific, time-bound ask, e.g. "exam arrangements for this semester's finals".

export const REQUEST_CATEGORIES = [
  'exam_arrangement',
  'lecture_access',
  'accommodation',
  'assistive_device',
  'mobility_transport',
  'counselling',
  'financial',
  'other',
] as const;

export const URGENCY = ['normal', 'soon', 'urgent'] as const;
export const REQUEST_STATUSES = ['open', 'in_progress', 'resolved', 'withdrawn'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const newRequestSchema = z.object({
  category: z.enum(REQUEST_CATEGORIES, { error: 'Choose what your request is about' }),
  title: z.string().trim().min(5, 'Give your request a short title, for example "Extra time for end of semester exams"').max(120),
  details: z.string().trim().min(15, 'Tell us a little more, so GIV knows what you need').max(3000),
  urgency: z.enum(URGENCY, { error: 'Choose how soon you need this' }),
  neededBy: z.string().optional().or(z.literal('')),
});
export type NewRequest = z.infer<typeof newRequestSchema>;

export type RequestMessage = {
  id: string;
  from: 'student' | 'giv';
  author?: string; // GIV officer's name
  body: string;
  at: string;
};

export type SupportRequest = NewRequest & {
  id: string; // e.g. "REQ-0007"
  studentId: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  messages: RequestMessage[];
};

// ---------- Saved accessibility preferences (follow the student across devices) ----------
export type SavedPreferences = Record<string, string>;
