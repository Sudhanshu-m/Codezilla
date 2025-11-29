import {
  type User,
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type Scholarship,
  type InsertScholarship,
  type ScholarshipMatch,
  type InsertScholarshipMatch,
  type ApplicationGuidance,
  type InsertApplicationGuidance,
  type ScholarshipApplication,
  type InsertScholarshipApplication,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { base, tables } from "./db";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student profile methods
  getStudentProfileById(profileId: string): Promise<StudentProfile | undefined>;
  createStudentProfile(
    profile: InsertStudentProfile
  ): Promise<StudentProfile>;
  updateStudentProfile(
    id: string,
    profile: Partial<InsertStudentProfile>
  ): Promise<StudentProfile>;

  // Scholarship methods
  getAllScholarships(): Promise<Scholarship[]>;
  getScholarshipById(id: string): Promise<Scholarship | undefined>;
  createScholarship(scholarship: InsertScholarship): Promise<Scholarship>;
  searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]>;

  // Scholarship match methods
  getScholarshipMatches(
    profileId: string
  ): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]>;
  createScholarshipMatch(match: InsertScholarshipMatch): Promise<ScholarshipMatch>;
  updateMatchStatus(matchId: string, status: string): Promise<ScholarshipMatch>;

  // Application guidance methods
  getApplicationGuidance(
    profileId: string,
    scholarshipId: string
  ): Promise<ApplicationGuidance | undefined>;
  createApplicationGuidance(
    guidance: InsertApplicationGuidance
  ): Promise<ApplicationGuidance>;

  // Scholarship application methods
  createScholarshipApplication(
    application: InsertScholarshipApplication
  ): Promise<ScholarshipApplication>;
  getApplications(profileId: string): Promise<ScholarshipApplication[]>;

  // Sample data seeding
  seedSampleData(): Promise<void>;
  
  // Clear all scholarships
  clearAllScholarships(): Promise<void>;

  // Resume methods
  getResumeByProfileId(profileId: string): Promise<Scholarship | undefined>;
}

// In-memory storage for profiles, matches, and applications
const profileStorage = new Map<string, StudentProfile>();
const matchStorage = new Map<string, ScholarshipMatch[]>();
const applicationStorage = new Map<string, ScholarshipApplication[]>();

// Airtable Storage Implementation
export class AirtableStorage implements IStorage {
  private useAirtable = !!base;

  constructor() {
    if (this.useAirtable) {
      console.log("✓ Using Airtable for scholarships and profiles");
    } else {
      console.log("⚠️  Airtable not configured - using in-memory storage");
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!this.useAirtable) return undefined;
    try {
      const records = await base!(tables.users).find(id);
      if (!records) return undefined;
      return {
        id: records.id,
        username: (records.fields.username as string) || "",
        password: (records.fields.password as string) || "",
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.useAirtable) return undefined;
    try {
      const records = await base!(tables.users).select({
        filterByFormula: `{email} = "${username}"`,
      }).firstPage();
      if (!records || records.length === 0) return undefined;
      const record = records[0];
      return {
        id: record.id,
        username: (record.fields.email as string) || "",
        password: "",
      };
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    if (!this.useAirtable) {
      return { id, ...user };
    }
    try {
      const records = await base!(tables.users).create([
        {
          fields: {
            email: user.username,
          },
        },
      ]);
      const record = records[0];
      return {
        id: record.id,
        username: (record.fields.email as string) || "",
        password: "",
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async getStudentProfileById(profileId: string): Promise<StudentProfile | undefined> {
    // Try in-memory first for quick access
    const memoryProfile = profileStorage.get(profileId);
    if (memoryProfile) {
      return memoryProfile;
    }
    
    // Then try Airtable
    if (!this.useAirtable) return undefined;
    try {
      const record = await base!(tables.studentProfiles).find(profileId);
      if (!record) return undefined;
      const profile = this.mapToStudentProfile(record);
      // Cache in memory
      profileStorage.set(profileId, profile);
      return profile;
    } catch (error) {
      console.error("Error fetching profile from Airtable:", error);
      return undefined;
    }
  }

  async createStudentProfile(
    profile: InsertStudentProfile
  ): Promise<StudentProfile> {
    const now = new Date().toISOString();
    
    // Try to save to Airtable first
    if (this.useAirtable) {
      try {
        const airtableFields: any = {
          Name: profile.name,
          Email: profile.email,
          Location: profile.location || "",
          EducationLevel: profile.educationLevel || "",
          FieldOfStudy: profile.fieldOfStudy || "",
          GPA: profile.gpa || "",
          GraduationYear: profile.graduationYear || "",
          Skills: profile.skills ? profile.skills.join(", ") : "",
          Activities: profile.activities || "",
          FinancialNeed: profile.financialNeed || "",
          CreatedAt: now,
          UpdatedAt: now,
        };
        
        console.log("Saving profile to Airtable with fields:", Object.keys(airtableFields));
        
        const records = await base!(tables.studentProfiles).create([
          { fields: airtableFields },
        ]);
        
        const record = records[0];
        const result: StudentProfile = {
          id: record.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          educationLevel: profile.educationLevel,
          fieldOfStudy: profile.fieldOfStudy,
          gpa: profile.gpa,
          graduationYear: profile.graduationYear,
          skills: profile.skills,
          activities: profile.activities,
          financialNeed: profile.financialNeed,
          summary: profile.summary,
          education: profile.education,
          experience: profile.experience,
          projects: profile.projects,
          createdAt: now,
          updatedAt: now,
        };
        
        // Also cache in memory
        profileStorage.set(record.id, result);
        console.log("✓ Profile saved to Airtable with ID:", record.id);
        
        return result;
      } catch (error: any) {
        console.error("Error saving profile to Airtable:", error?.message || error);
        // Fall back to in-memory storage
      }
    }
    
    // Fallback: Create profile in in-memory storage
    const id = randomUUID();
    const result: StudentProfile = {
      id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      educationLevel: profile.educationLevel,
      fieldOfStudy: profile.fieldOfStudy,
      gpa: profile.gpa,
      graduationYear: profile.graduationYear,
      skills: profile.skills,
      activities: profile.activities,
      financialNeed: profile.financialNeed,
      summary: profile.summary,
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      createdAt: now,
      updatedAt: now,
    };
    
    profileStorage.set(id, result);
    console.log("✓ Profile stored in memory with ID:", id);
    
    return result;
  }

  async updateStudentProfile(
    id: string,
    profile: Partial<InsertStudentProfile>
  ): Promise<StudentProfile> {
    const now = new Date().toISOString();
    
    // Get existing profile
    let existingProfile = profileStorage.get(id);
    if (!existingProfile) {
      existingProfile = {
        id,
        name: "",
        email: "",
        location: "",
        createdAt: now,
        updatedAt: now,
      };
    }
    
    const updated: StudentProfile = {
      ...existingProfile,
      ...profile,
      updatedAt: now,
    };
    
    // Update in Airtable if available
    if (this.useAirtable) {
      try {
        const airtableFields: any = {};
        if (profile.name) airtableFields.Name = profile.name;
        if (profile.email) airtableFields.Email = profile.email;
        if (profile.location) airtableFields.Location = profile.location;
        if (profile.educationLevel) airtableFields.EducationLevel = profile.educationLevel;
        if (profile.fieldOfStudy) airtableFields.FieldOfStudy = profile.fieldOfStudy;
        if (profile.gpa) airtableFields.GPA = profile.gpa;
        if (profile.graduationYear) airtableFields.GraduationYear = profile.graduationYear;
        if (profile.skills) airtableFields.Skills = profile.skills.join(", ");
        if (profile.activities) airtableFields.Activities = profile.activities;
        if (profile.financialNeed) airtableFields.FinancialNeed = profile.financialNeed;
        airtableFields.UpdatedAt = now;
        
        await base!(tables.studentProfiles).update([
          { id, fields: airtableFields },
        ]);
        console.log("✓ Profile updated in Airtable with ID:", id);
      } catch (error: any) {
        console.error("Error updating profile in Airtable:", error?.message);
      }
    }
    
    // Update in memory
    profileStorage.set(id, updated);
    console.log("✓ Profile updated with ID:", id);
    return updated;
  }

  async getAllScholarships(): Promise<Scholarship[]> {
    if (!this.useAirtable) return this.getFallbackScholarships();
    try {
      const records = await base!(tables.scholarships).select().all();
      
      if (records.length > 0) {
        const firstRecord = records[0];
        const hasProperData = firstRecord.fields.Title || firstRecord.fields.title || 
                              firstRecord.fields.Organization || firstRecord.fields.organization;
        
        if (!hasProperData) {
          console.log("Airtable scholarships lack proper fields, using fallback data");
          return this.getFallbackScholarships();
        }
      }
      
      const scholarships = records.map((r) => this.mapToScholarship(r));
      
      const hasValidData = scholarships.some(s => 
        s.title !== "Untitled Scholarship" && s.organization !== "Unknown Organization"
      );
      
      if (!hasValidData && scholarships.length > 0) {
        console.log("No valid scholarship data found, using fallback data");
        return this.getFallbackScholarships();
      }
      
      return scholarships.length > 0 ? scholarships : this.getFallbackScholarships();
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      return this.getFallbackScholarships();
    }
  }

  private getFallbackScholarships(): Scholarship[] {
    const now = new Date().toISOString();
    return [
      {
        id: "fallback-1",
        title: "National Merit STEM Scholarship",
        organization: "Future Scientists Foundation",
        amount: "₹12,50,000",
        deadline: "2025-03-15",
        description: "Supporting outstanding students pursuing STEM degrees with demonstrated academic excellence and research potential.",
        requirements: "Minimum 3.7 GPA, STEM major, research experience preferred",
        tags: ["STEM", "Merit-Based", "Undergraduate", "Research"],
        type: "merit-based",
        eligibilityGpa: "3.7",
        eligibleFields: ["Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry", "Biology"],
        eligibleLevels: ["undergraduate"],
        isActive: true,
        createdAt: now,
      },
      {
        id: "fallback-2",
        title: "Tech Diversity Excellence Award",
        organization: "TechForward Initiative",
        amount: "₹7,00,000",
        deadline: "2025-04-01",
        description: "Promoting diversity in technology fields by supporting underrepresented students with financial aid and mentorship.",
        requirements: "Technology-related major, demonstrate financial need, minimum 3.0 GPA",
        tags: ["Technology", "Diversity", "Need-Based", "Mentorship"],
        type: "need-based",
        eligibilityGpa: "3.0",
        eligibleFields: ["Computer Science", "Information Technology", "Software Engineering", "AIML"],
        eligibleLevels: ["undergraduate", "graduate"],
        isActive: true,
        createdAt: now,
      },
      {
        id: "fallback-3",
        title: "Community Leadership Grant",
        organization: "Local Community Foundation",
        amount: "₹2,50,000",
        deadline: "2025-05-15",
        description: "Recognizing students who demonstrate exceptional leadership and community service commitment.",
        requirements: "Minimum 100 hours community service, leadership role in organization, any major, 3.2+ GPA",
        tags: ["Leadership", "Community Service", "Local"],
        type: "merit-based",
        eligibilityGpa: "3.2",
        eligibleFields: [],
        eligibleLevels: ["undergraduate"],
        isActive: true,
        createdAt: now,
      },
      {
        id: "fallback-4",
        title: "Environmental Innovation Award",
        organization: "Green Future Initiative",
        amount: "₹10,00,000",
        deadline: "2025-06-30",
        description: "Supporting students developing innovative solutions for environmental challenges and sustainability.",
        requirements: "Environmental science or related field, research project focused on sustainability, minimum 3.5 GPA",
        tags: ["Environmental Science", "Innovation", "Research-Based", "Sustainability"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Environmental Science", "Environmental Engineering", "Renewable Energy", "Biology"],
        eligibleLevels: ["undergraduate", "graduate"],
        isActive: true,
        createdAt: now,
      },
      {
        id: "fallback-5",
        title: "First Generation College Student Support",
        organization: "Educational Equity Foundation",
        amount: "₹4,00,000",
        deadline: "2025-04-30",
        description: "Supporting first-generation college students with financial aid and academic support services.",
        requirements: "First-generation college student status, demonstrate financial need, minimum 2.8 GPA",
        tags: ["First-Generation", "Need-Based", "Academic Support"],
        type: "need-based",
        eligibilityGpa: "2.8",
        eligibleFields: [],
        eligibleLevels: ["undergraduate"],
        isActive: true,
        createdAt: now,
      },
      {
        id: "fallback-6",
        title: "Women in Engineering Scholarship",
        organization: "Society of Women Engineers",
        amount: "₹8,00,000",
        deadline: "2025-05-01",
        description: "Empowering women pursuing engineering degrees with financial support and networking opportunities.",
        requirements: "Female students in engineering programs, minimum 3.3 GPA",
        tags: ["Women", "Engineering", "STEM", "Diversity"],
        type: "merit-based",
        eligibilityGpa: "3.3",
        eligibleFields: ["Engineering", "Computer Science", "Electronics", "Mechanical Engineering"],
        eligibleLevels: ["undergraduate", "graduate"],
        isActive: true,
        createdAt: now,
      },
    ];
  }

  async getScholarshipById(id: string): Promise<Scholarship | undefined> {
    if (id.startsWith("fallback-")) {
      const fallbackScholarships = this.getFallbackScholarships();
      return fallbackScholarships.find(s => s.id === id);
    }
    
    if (!this.useAirtable) {
      const fallbackScholarships = this.getFallbackScholarships();
      return fallbackScholarships.find(s => s.id === id);
    }
    
    try {
      const record = await base!(tables.scholarships).find(id);
      if (!record) return undefined;
      
      const scholarship = this.mapToScholarship(record);
      if (scholarship.title === "Untitled Scholarship") {
        const fallbackScholarships = this.getFallbackScholarships();
        return fallbackScholarships[0];
      }
      
      return scholarship;
    } catch (error) {
      console.error("Error fetching scholarship:", error);
      const fallbackScholarships = this.getFallbackScholarships();
      return fallbackScholarships.find(s => s.id === id);
    }
  }

  async createScholarship(scholarship: InsertScholarship): Promise<Scholarship> {
    const id = randomUUID();
    const now = new Date().toISOString();
    if (!this.useAirtable) {
      return {
        id,
        ...scholarship,
        createdAt: now,
      };
    }
    try {
      const records = await base!(tables.scholarships).create([
        {
          fields: {
            Title: scholarship.title,
            Organization: scholarship.organization,
            Amount: scholarship.amount,
            Deadline: scholarship.deadline,
            Description: scholarship.description,
            Requirements: scholarship.requirements,
            Tags: JSON.stringify(scholarship.tags),
            Type: scholarship.type,
            EligibilityGpa: scholarship.eligibilityGpa || "",
            EligibleFields: JSON.stringify(scholarship.eligibleFields || []),
            EligibleLevels: JSON.stringify(scholarship.eligibleLevels || []),
            CreatedAt: now,
          },
        },
      ]);
      return this.mapToScholarship(records[0]);
    } catch (error) {
      console.error("Error creating scholarship:", error);
      throw error;
    }
  }

  async clearAllScholarships(): Promise<void> {
    if (!this.useAirtable) return;
    try {
      const records = await base!(tables.scholarships).select().all();
      if (records.length === 0) return;
      
      console.log(`Clearing ${records.length} existing scholarships...`);
      
      const recordIds = records.map(r => r.id);
      const batchSize = 10;
      for (let i = 0; i < recordIds.length; i += batchSize) {
        const batch = recordIds.slice(i, i + batchSize);
        await base!(tables.scholarships).destroy(batch);
      }
      
      console.log("✓ All scholarships cleared");
    } catch (error) {
      console.error("Error clearing scholarships:", error);
      throw error;
    }
  }

  async searchScholarships(filters: {
    type?: string;
    minAmount?: number;
    tags?: string[];
    fieldOfStudy?: string;
    educationLevel?: string;
  }): Promise<Scholarship[]> {
    if (!this.useAirtable) return [];
    try {
      const conditions: string[] = [];
      if (filters.type) {
        conditions.push(`{type} = "${filters.type}"`);
      }
      
      const selectOptions: any = {};
      if (conditions.length > 0) {
        selectOptions.filterByFormula = conditions.length > 1 ? `AND(${conditions.join(",")})` : conditions[0];
      }

      const records = await base!(tables.scholarships).select(selectOptions).all();

      return records.map((r) => this.mapToScholarship(r));
    } catch (error) {
      console.error("Error searching scholarships:", error);
      return [];
    }
  }

  async getScholarshipMatches(
    profileId: string
  ): Promise<(ScholarshipMatch & { scholarship: Scholarship })[]> {
    try {
      // First check in-memory storage
      const storedMatches = matchStorage.get(profileId);
      if (storedMatches && storedMatches.length > 0) {
        const results: (ScholarshipMatch & { scholarship: Scholarship })[] = [];
        for (const match of storedMatches.filter(m => m.status === 'new')) {
          const scholarship = await this.getScholarshipById(match.scholarshipId);
          if (scholarship) {
            results.push({
              ...match,
              scholarship,
            });
          }
        }
        return results.sort((a, b) => b.matchScore - a.matchScore);
      }
      
      // Fallback to Airtable if available
      if (!this.useAirtable) return [];
      
      const matches = await base!(tables.scholarshipMatches).select({
        filterByFormula: `AND({ProfileID} = "${profileId}", {Status} = "new")`,
      }).all();

      const results: (ScholarshipMatch & { scholarship: Scholarship })[] = [];
      for (const match of matches) {
        const scholarship = await this.getScholarshipById(
          match.fields.scholarshipId as string
        );
        if (scholarship) {
          results.push({
            ...this.mapToScholarshipMatch(match),
            scholarship,
          });
        }
      }
      return results.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error("Error fetching scholarship matches:", error);
      return [];
    }
  }

  async createScholarshipMatch(
    match: InsertScholarshipMatch
  ): Promise<ScholarshipMatch> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newMatch = {
      id,
      ...match,
      createdAt: now,
    };
    
    // Store in memory
    const existingMatches = matchStorage.get(match.profileId) || [];
    matchStorage.set(match.profileId, [...existingMatches, newMatch]);
    
    if (!this.useAirtable) {
      return newMatch;
    }
    try {
      const records = await base!(tables.scholarshipMatches).create([
        {
          fields: {
            id,
            ProfileID: match.profileId,
            ScholarshipID: match.scholarshipId,
            MatchScore: match.matchScore,
            AIReasoning: match.aiReasoning,
            Status: match.status || "new",
            CreatedAt: now,
          },
        },
      ]);
      return this.mapToScholarshipMatch(records[0]);
    } catch (error) {
      console.error("Error creating scholarship match:", error);
      // Still return the in-memory version even if Airtable fails
      return newMatch;
    }
  }

  async updateMatchStatus(
    matchId: string,
    status: string
  ): Promise<ScholarshipMatch> {
    if (!this.useAirtable) {
      return {
        id: matchId,
        profileId: "",
        scholarshipId: "",
        matchScore: 0,
        status,
        createdAt: new Date().toISOString(),
      };
    }
    try {
      const records = await base!(tables.scholarshipMatches).update([
        { id: matchId, fields: { status } },
      ]);
      return this.mapToScholarshipMatch(records[0]);
    } catch (error) {
      console.error("Error updating match status:", error);
      throw error;
    }
  }

  async createScholarshipApplication(
    application: InsertScholarshipApplication
  ): Promise<ScholarshipApplication> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const newApplication: ScholarshipApplication = {
      id,
      studentProfileId: application.studentProfileId,
      scholarshipId: application.scholarshipId,
      documents: application.documents,
      status: application.status || "pending",
      appliedAt: now,
    };

    // Store in memory
    const existing = applicationStorage.get(application.studentProfileId) || [];
    applicationStorage.set(application.studentProfileId, [...existing, newApplication]);

    console.log("✓ Scholarship application created:", { id, scholarshipId: application.scholarshipId });
    return newApplication;
  }

  async getApplications(profileId: string): Promise<ScholarshipApplication[]> {
    return applicationStorage.get(profileId) || [];
  }

  async getApplicationGuidance(
    profileId: string,
    scholarshipId: string
  ): Promise<ApplicationGuidance | undefined> {
    if (!this.useAirtable) return undefined;
    try {
      const records = await base!(tables.applicationGuidance).select({
        filterByFormula: `AND({profileId} = "${profileId}", {scholarshipId} = "${scholarshipId}")`,
      }).firstPage();
      if (!records || records.length === 0) return undefined;
      return this.mapToApplicationGuidance(records[0]);
    } catch (error) {
      console.error("Error fetching application guidance:", error);
      return undefined;
    }
  }

  async createApplicationGuidance(
    guidance: InsertApplicationGuidance
  ): Promise<ApplicationGuidance> {
    const id = randomUUID();
    const now = new Date().toISOString();
    if (!this.useAirtable) {
      return {
        id,
        ...guidance,
        createdAt: now,
      };
    }
    try {
      const records = await base!(tables.applicationGuidance).create([
        {
          fields: {
            id,
            profileId: guidance.profileId,
            scholarshipId: guidance.scholarshipId,
            essayTips: guidance.essayTips,
            checklist: guidance.checklist,
            improvementSuggestions: guidance.improvementSuggestions,
            createdAt: now,
          },
        },
      ]);
      return this.mapToApplicationGuidance(records[0]);
    } catch (error) {
      console.error("Error creating application guidance:", error);
      throw error;
    }
  }

  async saveConsultationBooking(
    profileId: string,
    counselorName: string,
    amount: number
  ): Promise<ApplicationGuidance> {
    const id = randomUUID();
    const now = new Date().toISOString();
    if (!this.useAirtable) {
      return {
        id,
        profileId,
        scholarshipId: `consultation-${counselorName}`,
        essayTips: `Consultation with ${counselorName}`,
        createdAt: now,
      };
    }
    try {
      const records = await base!(tables.applicationGuidance).create([
        {
          fields: {
            ProfileId: profileId,
            ScholarshipId: `consultation-${counselorName}`,
            EssayTips: `Consultation Booking: ${counselorName}`,
            Checklist: `Amount Paid: ₹${amount}`,
            ImprovementSuggestions: `Counselor: ${counselorName}, Booked on: ${now}`,
            CreatedAt: now,
          },
        },
      ]);
      console.log("✓ Consultation booking saved to Airtable:", { profileId, counselorName, amount });
      return this.mapToApplicationGuidance(records[0]);
    } catch (error) {
      console.error("Error saving consultation booking:", error);
      throw error;
    }
  }

  async seedSampleData(): Promise<void> {
    if (!this.useAirtable) return;
    const scholarships: InsertScholarship[] = [
      {
        title: "Google Computer Science Scholarship",
        organization: "Google Inc.",
        amount: "₹8,25,000",
        deadline: "2025-03-15",
        description: "Supporting underrepresented students in computer science.",
        requirements: "3.5+ GPA, leadership, passion for CS",
        tags: ["technology", "computer-science", "diversity"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Computer Science", "Software Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior"],
        isActive: true,
      },
      {
        title: "Microsoft LEAP Engineering",
        organization: "Microsoft",
        amount: "₹20,62,500",
        deadline: "2025-04-01",
        description: "Engineering internship for non-traditional backgrounds.",
        requirements: "Computer science, strong coding skills",
        tags: ["technology", "internship", "engineering"],
        type: "merit-based",
        eligibilityGpa: "3.0",
        eligibleFields: ["Computer Science", "Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior"],
        isActive: true,
      },
      {
        title: "Society of Women Engineers",
        organization: "SWE",
        amount: "₹12,37,500",
        deadline: "2025-02-15",
        description: "Empowering women in engineering fields.",
        requirements: "Female student, 3.5+ GPA, engineering major",
        tags: ["engineering", "women", "stem"],
        type: "merit-based",
        eligibilityGpa: "3.5",
        eligibleFields: ["Engineering"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior"],
        isActive: true,
      },
      {
        title: "First Generation Scholarship",
        organization: "Educational Foundation",
        amount: "₹6,60,000",
        deadline: "2025-07-01",
        description: "Supporting first-generation college students.",
        requirements: "First-gen status, financial need",
        tags: ["first-generation", "financial-need"],
        type: "need-based",
        eligibilityGpa: "2.8",
        isActive: true,
      },
      {
        title: "NASA Summer Internship",
        organization: "NASA",
        amount: "₹6,19,500",
        deadline: "2025-01-31",
        description: "Internship in aerospace engineering.",
        requirements: "STEM major, 3.0+ GPA",
        tags: ["internship", "aerospace", "stem"],
        type: "internship",
        eligibilityGpa: "3.0",
        eligibleFields: ["Engineering", "Physics"],
        eligibleLevels: ["undergraduate-sophomore", "undergraduate-junior"],
        isActive: true,
      },
    ];

    for (const scholarship of scholarships) {
      try {
        await this.createScholarship(scholarship);
      } catch (error) {
        console.error("Error seeding scholarship:", error);
      }
    }
  }

  private mapToStudentProfile(record: any): StudentProfile {
    let skills: string[] | undefined = undefined;
    
    // Parse skills from comma-separated string
    const skillsRaw = record.fields.Skills as string | undefined;
    if (skillsRaw) {
      skills = skillsRaw.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    
    return {
      id: record.id,
      name: (record.fields.Name as string) || "",
      email: (record.fields.Email as string) || "",
      phone: record.fields.Phone as string | undefined,
      location: (record.fields.Location as string) || "",
      educationLevel: record.fields.EducationLevel as string | undefined,
      fieldOfStudy: record.fields.FieldOfStudy as string | undefined,
      gpa: record.fields.GPA as string | undefined,
      graduationYear: record.fields.GraduationYear as string | undefined,
      skills,
      activities: record.fields.Activities as string | undefined,
      financialNeed: record.fields.FinancialNeed as string | undefined,
      summary: record.fields.Summary as string | undefined,
      education: record.fields.Education as string | undefined,
      experience: record.fields.Experience as string | undefined,
      projects: record.fields.Projects as string | undefined,
      createdAt: (record.fields.CreatedAt as string) || new Date().toISOString(),
      updatedAt: (record.fields.UpdatedAt as string) || new Date().toISOString(),
    };
  }

  private mapToScholarship(record: any): Scholarship {
    let tags: string[] = [];
    try {
      const tagsRaw = record.fields.tags || record.fields.Tags;
      if (tagsRaw) {
        tags = typeof tagsRaw === 'string' ? JSON.parse(tagsRaw) : (Array.isArray(tagsRaw) ? tagsRaw : []);
      }
    } catch (e) {
      tags = [];
    }

    let eligibleFields: string[] | undefined;
    try {
      const fieldsRaw = record.fields.eligibleFields || record.fields.EligibleFields;
      if (fieldsRaw) {
        eligibleFields = typeof fieldsRaw === 'string' ? JSON.parse(fieldsRaw) : (Array.isArray(fieldsRaw) ? fieldsRaw : undefined);
      }
    } catch (e) {
      eligibleFields = undefined;
    }

    let eligibleLevels: string[] | undefined;
    try {
      const levelsRaw = record.fields.eligibleLevels || record.fields.EligibleLevels;
      if (levelsRaw) {
        eligibleLevels = typeof levelsRaw === 'string' ? JSON.parse(levelsRaw) : (Array.isArray(levelsRaw) ? levelsRaw : undefined);
      }
    } catch (e) {
      eligibleLevels = undefined;
    }

    return {
      id: record.id,
      title: (record.fields.Title || record.fields.title || "Untitled Scholarship") as string,
      organization: (record.fields.Organization || record.fields.organization || "Unknown Organization") as string,
      amount: (record.fields.Amount || record.fields.amount || "Amount TBD") as string,
      deadline: (record.fields.Deadline || record.fields.deadline || "No deadline specified") as string,
      description: (record.fields.Description || record.fields.description || "No description available") as string,
      requirements: (record.fields.Requirements || record.fields.requirements || "Check with scholarship provider") as string,
      tags,
      type: (record.fields.Type || record.fields.type || "merit-based") as string,
      eligibilityGpa: record.fields.EligibilityGpa || record.fields.eligibilityGpa,
      eligibleFields,
      eligibleLevels,
      isActive: (record.fields.isActive as boolean) !== false,
      createdAt: (record.fields.CreatedAt || record.fields.createdAt || new Date().toISOString()) as string,
      notes: (record.fields.Notes || record.fields.notes) as string | undefined,
      profileId: (record.fields.ProfileId || record.fields.profileId) as string | undefined,
    };
  }

  async getResumeByProfileId(profileId: string): Promise<Scholarship | undefined> {
    if (!this.useAirtable) return undefined;
    try {
      // Query for scholarships that have notes content and match the profileId
      // The webhook creates records with profileId in the Notes or with ProfileId field
      const records = await base!(tables.scholarships).select({
        filterByFormula: `OR({ProfileId} = "${profileId}", FIND("${profileId}", {Notes}) > 0, FIND("${profileId}", {Title}) > 0)`,
        sort: [{ field: "CreatedAt", direction: "desc" }],
        maxRecords: 10,
      }).firstPage();
      
      if (!records || records.length === 0) {
        console.log("No resume found for profileId:", profileId);
        return undefined;
      }
      
      // Find the first record that has notes (resume content)
      for (const record of records) {
        const notes = record.fields.Notes || record.fields.notes;
        if (notes && typeof notes === 'string' && notes.length > 0) {
          console.log("✓ Found resume for profileId:", profileId);
          return this.mapToScholarship(record);
        }
      }
      
      console.log("No resume with notes found for profileId:", profileId);
      return undefined;
    } catch (error) {
      console.error("Error fetching resume by profile ID:", error);
      return undefined;
    }
  }

  private mapToScholarshipMatch(record: any): ScholarshipMatch {
    return {
      id: record.id,
      profileId: record.fields.profileId as string,
      scholarshipId: record.fields.scholarshipId as string,
      matchScore: record.fields.matchScore as number,
      aiReasoning: record.fields.aiReasoning as string | undefined,
      status: record.fields.status as string,
      createdAt: record.fields.createdAt as string,
    };
  }

  private mapToApplicationGuidance(record: any): ApplicationGuidance {
    return {
      id: record.id,
      profileId: (record.fields.ProfileId || record.fields.profileId) as string,
      scholarshipId: (record.fields.ScholarshipId || record.fields.scholarshipId) as string,
      essayTips: (record.fields.EssayTips || record.fields.essayTips) as string | undefined,
      checklist: (record.fields.Checklist || record.fields.checklist) as string | undefined,
      improvementSuggestions: (record.fields.ImprovementSuggestions || record.fields.improvementSuggestions) as string | undefined,
      createdAt: (record.fields.CreatedAt || record.fields.createdAt) as string,
    };
  }
}

export const storage = new AirtableStorage();
