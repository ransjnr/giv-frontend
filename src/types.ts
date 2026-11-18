export type RegistrationStatus = 'draft' | 'submitted' | 'in_review' | 'contacted' | 'support_active';
export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'withdrawn';
export type Staff = { id: string; email: string; fullName: string; role: 'officer' | 'admin' };
export type Student = { studentId: string; indexNumber: string; fullName: string; universityEmail: string; college: string; programme: string; level: string; campus: string };
export type RegistrationSummary = { studentId: string; fullName: string; programme: string; college: string; level: string; status: RegistrationStatus; submittedAt: string; updatedAt: string; confirmedAt?: string };
export type Registration = { studentId: string; status: RegistrationStatus; data?: Record<string, unknown>; history: { status: RegistrationStatus; at: string; note?: string }[]; submittedAt?: string; updatedAt: string; confirmedAt?: string };
export type RequestMessage = { id: string; from: 'student' | 'giv'; author?: string; body: string; at: string };
export type SupportRequest = { id: string; studentId: string; category: string; title: string; details: string; urgency: string; neededBy?: string; status: RequestStatus; createdAt: string; updatedAt: string; messages: RequestMessage[] };
