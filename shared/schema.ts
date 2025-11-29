import { z } from "zod";

// User Types
export interface User {
  id: string;
  username: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Student Profile Types - Updated with new fields
export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  gpa?: string;
  graduationYear?: string;
  skills?: string[];
  activities?: string;
  financialNeed?: string;
  summary?: string;
  education?: string;
  experience?: string;
  projects?: string;
  createdAt: string;
  updatedAt: string;
}

export const insertStudentProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().min(1),
  educationLevel: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  gpa: z.string().optional(),
  graduationYear: z.string().optional(),
  skills: z.array(z.string()).optional(),
  activities: z.string().optional(),
  financialNeed: z.string().optional(),
  summary: z.string().optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  projects: z.string().optional(),
});

export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;

// Scholarship Types
export interface Scholarship {
  id: string;
  title: string;
  organization: string;
  amount: string;
  deadline: string;
  description: string;
  requirements: string;
  tags: string[];
  type: string;
  eligibilityGpa?: string;
  eligibleFields?: string[];
  eligibleLevels?: string[];
  isActive: boolean;
  createdAt: string;
  notes?: string;
  profileId?: string;
}

// Resume Types
export interface GeneratedResume {
  id: string;
  profileId: string;
  content: string;
  createdAt: string;
}

export const insertScholarshipSchema = z.object({
  title: z.string().min(1),
  organization: z.string().min(1),
  amount: z.string().min(1),
  deadline: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().min(1),
  tags: z.array(z.string()),
  type: z.string(),
  eligibilityGpa: z.string().optional(),
  eligibleFields: z.array(z.string()).optional(),
  eligibleLevels: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export type InsertScholarship = z.infer<typeof insertScholarshipSchema>;

// Scholarship Match Types
export interface ScholarshipMatch {
  id: string;
  profileId: string;
  scholarshipId: string;
  matchScore: number;
  aiReasoning?: string;
  status: string;
  createdAt: string;
}

export const insertScholarshipMatchSchema = z.object({
  profileId: z.string(),
  scholarshipId: z.string(),
  matchScore: z.number().int().min(0).max(100),
  aiReasoning: z.string().optional(),
  status: z.string().default("new"),
});

export type InsertScholarshipMatch = z.infer<typeof insertScholarshipMatchSchema>;

// Application Guidance Types
export interface ApplicationGuidance {
  id: string;
  profileId: string;
  scholarshipId: string;
  essayTips?: string;
  checklist?: string;
  improvementSuggestions?: string;
  createdAt: string;
}

export const insertApplicationGuidanceSchema = z.object({
  profileId: z.string(),
  scholarshipId: z.string(),
  essayTips: z.string().optional(),
  checklist: z.string().optional(),
  improvementSuggestions: z.string().optional(),
});

export type InsertApplicationGuidance = z.infer<typeof insertApplicationGuidanceSchema>;

// Scholarship Application Types
export interface ScholarshipApplication {
  id: string;
  studentProfileId: string;
  scholarshipId: string;
  documents: string[];
  status: string;
  appliedAt: string;
}

export const insertScholarshipApplicationSchema = z.object({
  studentProfileId: z.string(),
  scholarshipId: z.string(),
  documents: z.array(z.string()).min(1, "At least one document is required"),
  status: z.string().default("pending"),
});

export type InsertScholarshipApplication = z.infer<typeof insertScholarshipApplicationSchema>;

// Consultation Booking Types
export interface ConsultationBooking {
  id: string;
  profileId: string;
  counselorId: string;
  counselorName: string;
  amount: number;
  paymentStatus: string;
  bookedAt: string;
  scheduledDate?: string;
}

export const insertConsultationBookingSchema = z.object({
  profileId: z.string(),
  counselorId: z.string(),
  counselorName: z.string(),
  amount: z.number(),
  paymentStatus: z.string().default("completed"),
});

export type InsertConsultationBooking = z.infer<typeof insertConsultationBookingSchema>;
