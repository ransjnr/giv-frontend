/*
 * COPY of pwd-frontend/src/content/options.ts: the plain-English labels students see.
 * Staff use the same words. If a label changes in the student portal, copy it here too.
 */
export type Option = { value: string; label: string; hint?: string };
import type {
  ACADEMIC_SUPPORT,
  CONDITIONS,
  CONTACT_METHODS,
  DEVICES,
  DIFFICULTY_LEVELS,
  DOCUMENTATION,
  DURATIONS,
  EXAM_SUPPORT,
  FUNCTION_AREAS,
  LIVING_SUPPORT,
  OTHER_SUPPORT,
  RELATIONSHIPS,
  RESIDENCE_TYPES,
  REQUEST_CATEGORIES,
  RegistrationStatus,
  RequestStatus,
  URGENCY,
} from '@/api/schema';

/*
 * Human labels for every stored code. Wording is plain English, written
 * for students first. GIV and the admin app should reuse these labels.
 */

type Labels<T extends readonly string[]> = Record<T[number], { label: string; hint?: string }>;

const toOptions = <T extends readonly string[]>(l: Labels<T>): Option[] =>
  Object.entries(l).map(([value, v]) => ({ value, ...(v as { label: string; hint?: string }) }));

export const contactMethodLabels: Labels<typeof CONTACT_METHODS> = {
  call: { label: 'Phone call' },
  sms: { label: 'Text message (SMS)' },
  whatsapp: { label: 'WhatsApp' },
  email: { label: 'Email' },
  in_person: { label: 'Meet in person' },
};

export const residenceLabels: Labels<typeof RESIDENCE_TYPES> = {
  hall: { label: 'University hall' },
  hostel: { label: 'Private hostel' },
  private: { label: 'Rented room or apartment' },
  home: { label: 'Family home, off campus' },
};

export const functionLabels: Labels<typeof FUNCTION_AREAS> = {
  seeing: { label: 'Seeing', hint: 'Even when wearing glasses' },
  hearing: { label: 'Hearing', hint: 'Even when using a hearing aid' },
  walking: { label: 'Walking or climbing steps' },
  remembering: { label: 'Remembering or concentrating' },
  self_care: { label: 'Self-care', hint: 'Such as washing or dressing' },
  communicating: { label: 'Communicating', hint: 'Understanding others or being understood' },
  upper_body: { label: 'Using your hands or arms', hint: 'Such as writing or lifting' },
  psychosocial: { label: 'Managing anxiety, low mood or stress' },
};

export const difficultyLabels: Labels<typeof DIFFICULTY_LEVELS> = {
  some: { label: 'Some difficulty' },
  a_lot: { label: 'A lot of difficulty' },
  cannot: { label: 'Cannot do at all' },
};

export const conditionLabels: Labels<typeof CONDITIONS> = {
  blind_low_vision: { label: 'Blind or low vision' },
  deaf_hard_of_hearing: { label: 'Deaf or hard of hearing' },
  physical_mobility: { label: 'Physical or mobility disability' },
  albinism: { label: 'Albinism' },
  learning_difficulty: { label: 'Specific learning difficulty', hint: 'Such as dyslexia' },
  autism: { label: 'Autism' },
  adhd: { label: 'ADHD' },
  mental_health: { label: 'Mental health condition' },
  epilepsy: { label: 'Epilepsy' },
  sickle_cell: { label: 'Sickle cell disease' },
  chronic_illness: { label: 'Other long-term illness' },
  speech: { label: 'Speech impairment' },
  other: { label: 'Something else' },
};

export const durationLabels: Labels<typeof DURATIONS> = {
  permanent: { label: 'Permanent', hint: 'From birth, or it will not change' },
  long_term: { label: 'Long-term', hint: 'More than 12 months' },
  temporary: { label: 'Temporary', hint: 'For example, an injury' },
  not_sure: { label: "I'm not sure" },
};

export const documentationLabels: Labels<typeof DOCUMENTATION> = {
  yes: { label: 'Yes, I have a report or letter' },
  in_progress: { label: "I'm getting one" },
  no: { label: "No, I don't have one" },
};

export const academicLabels: Labels<typeof ACADEMIC_SUPPORT> = {
  lecture_notes_early: { label: 'Lecture slides or notes before class' },
  lecture_recordings: { label: 'Permission to record lectures' },
  note_taker: { label: 'A note-taker' },
  sign_interpreter: { label: 'Sign language interpreter' },
  captioning: { label: 'Captions or transcripts' },
  accessible_venue: { label: 'Lectures in an accessible venue', hint: 'Ramp, lift or ground floor' },
  front_seating: { label: 'A reserved seat near the front' },
  braille_large_print: { label: 'Braille or large-print materials' },
  assignment_extensions: { label: 'Extra time for assignments' },
  library_assistance: { label: 'Help using the library' },
};

export const examLabels: Labels<typeof EXAM_SUPPORT> = {
  extra_time: { label: 'Extra time' },
  separate_room: { label: 'A separate, quiet room' },
  scribe: { label: 'A scribe to write for me' },
  reader: { label: 'A reader to read questions to me' },
  large_print_paper: { label: 'Large-print question paper' },
  braille_paper: { label: 'Braille question paper' },
  computer_use: { label: 'Use of a computer' },
  rest_breaks: { label: 'Rest breaks' },
  ground_floor_venue: { label: 'Ground-floor exam venue' },
};

export const livingLabels: Labels<typeof LIVING_SUPPORT> = {
  ground_floor_room: { label: 'A ground-floor room' },
  accessible_bathroom: { label: 'An accessible bathroom' },
  room_near_facilities: { label: 'A room close to lecture halls or the clinic' },
  room_for_assistant: { label: 'Space for a personal assistant' },
  campus_transport: { label: 'Transport around campus' },
  accessible_route_guidance: { label: 'Help finding accessible routes' },
};

export const deviceLabels: Labels<typeof DEVICES> = {
  wheelchair: { label: 'Wheelchair' },
  crutches_cane: { label: 'Crutches or walking stick' },
  white_cane: { label: 'White cane' },
  prosthesis: { label: 'Prosthesis' },
  hearing_aid: { label: 'Hearing aid' },
  screen_reader: { label: 'Screen reader software' },
  magnifier: { label: 'Magnifier' },
  braille_device: { label: 'Braille device' },
  laptop: { label: 'Laptop' },
  smartphone: { label: 'Smartphone' },
  sunscreen_hat: { label: 'Sunscreen and sun protection' },
};

export const otherSupportLabels: Labels<typeof OTHER_SUPPORT> = {
  counselling: { label: 'Counselling' },
  health_services: { label: 'Health services' },
  financial_support: { label: 'Financial support or bursaries' },
  mentorship: { label: 'A mentor' },
  peer_support: { label: 'Meeting other students with disabilities' },
  career_support: { label: 'Internship and career support' },
  assistive_tech_training: { label: 'Training on assistive technology' },
};

export const relationshipLabels: Labels<typeof RELATIONSHIPS> = {
  parent: { label: 'Parent' },
  guardian: { label: 'Guardian' },
  sibling: { label: 'Brother or sister' },
  spouse: { label: 'Husband or wife' },
  relative: { label: 'Other relative' },
  friend: { label: 'Friend' },
  personal_assistant: { label: 'Personal assistant or carer' },
  other: { label: 'Other' },
};

export const statusLabels: Record<RegistrationStatus, { label: string; description: string }> = {
  draft: { label: 'Not submitted', description: 'Your details are saved but GIV cannot see them yet.' },
  submitted: { label: 'Submitted', description: 'GIV has received your details.' },
  in_review: { label: 'Being reviewed', description: 'A GIV officer is reading your details.' },
  contacted: { label: 'GIV contacted you', description: 'An officer has reached out to plan your support.' },
  support_active: { label: 'Support in place', description: 'Your support has been arranged.' },
};

export const requestCategoryLabels: Labels<typeof REQUEST_CATEGORIES> = {
  exam_arrangement: { label: 'Exam arrangements', hint: 'Extra time, a separate room, a scribe' },
  lecture_access: { label: 'Lectures and coursework', hint: 'Notes, interpreters, venue changes' },
  accommodation: { label: 'My room or hall', hint: 'Moving rooms, accessible facilities' },
  assistive_device: { label: 'Devices and technology', hint: 'Getting or repairing a device' },
  mobility_transport: { label: 'Getting around campus', hint: 'Transport, routes, ramps' },
  counselling: { label: 'Counselling and wellbeing' },
  financial: { label: 'Financial support' },
  other: { label: 'Something else' },
};

export const urgencyLabels: Labels<typeof URGENCY> = {
  normal: { label: 'No rush', hint: 'In the next few weeks' },
  soon: { label: 'Soon', hint: 'Within a week' },
  urgent: { label: 'Urgent', hint: 'In the next day or two' },
};

export const requestStatusLabels: Record<RequestStatus, { label: string; tone: 'neutral' | 'progress' | 'done' | 'muted' }> = {
  open: { label: 'Sent', tone: 'neutral' },
  in_progress: { label: 'GIV is working on it', tone: 'progress' },
  resolved: { label: 'Done', tone: 'done' },
  withdrawn: { label: 'Withdrawn', tone: 'muted' },
};

export const options = {
  requestCategories: toOptions(requestCategoryLabels),
  urgency: toOptions(urgencyLabels),
  contactMethods: toOptions(contactMethodLabels),
  residence: toOptions(residenceLabels),
  difficulty: toOptions(difficultyLabels),
  conditions: toOptions(conditionLabels),
  duration: toOptions(durationLabels),
  documentation: toOptions(documentationLabels),
  academic: toOptions(academicLabels),
  exams: toOptions(examLabels),
  living: toOptions(livingLabels),
  devices: toOptions(deviceLabels),
  other: toOptions(otherSupportLabels),
  relationships: toOptions(relationshipLabels),
};

/** Look up a label for any stored code. */
export function labelOf(map: Record<string, { label: string }>, code: string | undefined) {
  return code ? (map[code]?.label ?? code) : '';
}
