import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertStudentProfileSchema, 
  insertScholarshipSchema,
  insertScholarshipApplicationSchema,
  type StudentProfile,
  type Scholarship 
} from "@shared/schema";
import { generateScholarshipMatches, generateApplicationGuidance } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get student profile by profile ID
  app.get("/api/profile/:profileId", async (req, res) => {
    try {
      const profile = await storage.getStudentProfileById(req.params.profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Create student profile
  app.post("/api/profile", async (req, res) => {
    try {
      // Support both { profile: {...} } and direct {...} format
      const rawProfile = req.body.profile || req.body;
      console.log("Creating profile with data:", rawProfile);

      // Convert skills string to array if provided
      const profileData = {
        ...rawProfile,
        skills: rawProfile.skills 
          ? typeof rawProfile.skills === 'string'
            ? rawProfile.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s)
            : rawProfile.skills
          : undefined
      };

      const validatedProfile = insertStudentProfileSchema.parse(profileData);
      const profile = await storage.createStudentProfile(validatedProfile);

      console.log("✓ Profile created successfully:", profile);
      console.log("Returning profile with ID:", profile.id);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      res.status(400).json({ message: "Failed to create profile", error: error.message });
    }
  });

  // Update student profile
  app.put("/api/profile/:id", async (req, res) => {
    try {
      const profileData = insertStudentProfileSchema.partial().parse(req.body);
      const profile = await storage.updateStudentProfile(req.params.id, profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Seed sample data endpoint
  app.post("/api/seed-data", async (req, res) => {
    try {
      await storage.seedSampleData();
      res.json({ message: "Sample data seeded successfully" });
    } catch (error) {
      console.error("Error seeding data:", error);
      res.status(500).json({ message: "Failed to seed sample data" });
    }
  });

  // Get all scholarships
  app.get("/api/scholarships", async (req, res) => {
    try {
      const scholarships = await storage.getAllScholarships();
      res.json(scholarships);
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  // Search scholarships with filters
  app.get("/api/scholarships/search", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as string,
        tags: req.query.tags ? (req.query.tags as string).split(",") : undefined,
        fieldOfStudy: req.query.fieldOfStudy as string,
        educationLevel: req.query.educationLevel as string,
      };

      const scholarships = await storage.searchScholarships(filters);
      res.json(scholarships);
    } catch (error) {
      console.error("Error searching scholarships:", error);
      res.status(500).json({ message: "Failed to search scholarships" });
    }
  });

  // Get pre-stored scholarship matches (AI matching disabled for now)
  app.post("/api/matches/generate", async (req, res) => {
    try {
      const { profileId } = req.body;

      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }

      const profile = await storage.getStudentProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Get all available scholarships and create matches for them
      const scholarships = await storage.getAllScholarships();
      const createdMatches = [];

      for (const s of scholarships) {
        const match = await storage.createScholarshipMatch({
          profileId,
          scholarshipId: s.id,
          matchScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
          status: "new",
          aiReasoning: "Pre-stored scholarship. AI matching will be enabled soon."
        });
        createdMatches.push(match);
      }

      res.json({ matches: createdMatches });
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Failed to generate matches", matches: [] });
    }
  });

  // Get scholarship matches for a profile
  app.get("/api/matches/:profileId", async (req, res) => {
    try {
      const matches = await storage.getScholarshipMatches(req.params.profileId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Update match status (favorite, applied, etc.)
  app.put("/api/matches/:matchId/status", async (req, res) => {
    try {
      const { status } = req.body;
      const updatedMatch = await storage.updateMatchStatus(req.params.matchId, status);
      res.json(updatedMatch);
    } catch (error) {
      console.error("Error updating match status:", error);
      res.status(500).json({ message: "Failed to update match status" });
    }
  });

  // Generate application guidance (AI disabled for now)
  app.post("/api/guidance", async (req, res) => {
    try {
      const { profileId, scholarshipId } = req.body;

      if (!profileId || !scholarshipId) {
        return res.status(400).json({ message: "Profile ID and Scholarship ID are required" });
      }

      // Return placeholder guidance (no AI for now)
      const guidance = {
        id: `guidance-${Date.now()}`,
        profileId,
        scholarshipId,
        essayTips: "Focus on explaining your unique value proposition and how this scholarship aligns with your goals.",
        checklist: ["Review requirements", "Prepare documents", "Draft essay", "Proofread", "Submit before deadline"],
        improvementSuggestions: "Generic guidance. AI suggestions will be available soon.",
        createdAt: new Date().toISOString()
      };

      res.json(guidance);
    } catch (error) {
      console.error("Error getting guidance:", error);
      res.status(500).json({ message: "Failed to get guidance" });
    }
  });

  // Old guidance endpoint (keeping for compatibility)
  app.post("/api/guidance-old", async (req, res) => {
    try {
      const { profileId, scholarshipId } = req.body;

      if (!profileId || !scholarshipId) {
        return res.status(400).json({ message: "Profile ID and Scholarship ID are required" });
      }

      // Check if guidance already exists
      const existingGuidance = await storage.getApplicationGuidance(profileId, scholarshipId);
      if (existingGuidance) {
        return res.json(existingGuidance);
      }

      const profile = await storage.getStudentProfileById(profileId);
      const scholarship = await storage.getScholarshipById(scholarshipId);

      if (!profile || !scholarship) {
        return res.status(404).json({ message: "Profile or scholarship not found" });
      }

      const guidance = await generateApplicationGuidance(profile, scholarship);

      const savedGuidance = await storage.createApplicationGuidance({
        profileId,
        scholarshipId,
        essayTips: guidance.essayTips,
        checklist: typeof guidance.checklist === 'string' ? guidance.checklist : JSON.stringify(guidance.checklist),
        improvementSuggestions: guidance.improvementSuggestions
      });

      res.json(savedGuidance);
    } catch (error) {
      console.error("Error generating guidance:", error);
      res.status(500).json({ message: "Failed to generate guidance" });
    }
  });

  // Get application guidance
  app.get("/api/guidance/:profileId/:scholarshipId", async (req, res) => {
    try {
      const guidance = await storage.getApplicationGuidance(
        req.params.profileId,
        req.params.scholarshipId
      );

      if (!guidance) {
        return res.status(404).json({ message: "Guidance not found" });
      }

      res.json(guidance);
    } catch (error) {
      console.error("Error fetching guidance:", error);
      res.status(500).json({ message: "Failed to fetch guidance" });
    }
  });

  // Create scholarship application
  app.post("/api/applications", async (req, res) => {
    try {
      const { scholarshipId, profileId, documents, status = "draft" } = req.body;

      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }

      if (!scholarshipId) {
        return res.status(400).json({ message: "Scholarship ID is required" });
      }

      // Validate only PDF documents
      const invalidDocs = documents.filter((doc: string) => !doc.toLowerCase().endsWith('.pdf'));
      if (invalidDocs.length > 0) {
        return res.status(400).json({ message: "Only PDF documents are allowed" });
      }

      const application = await storage.createScholarshipApplication({
        studentProfileId: profileId,
        scholarshipId,
        documents,
        status: "pending"
      });

      console.log("✓ Application submitted successfully:", { applicationId: application.id, scholarshipId });
      res.json(application);
    } catch (error) {
      console.error("Error creating application:", error);
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Save consultation booking to Airtable
  app.post("/api/consultation-booking", async (req, res) => {
    try {
      const { profileId, counselorName, amount } = req.body;

      if (!profileId || !counselorName || !amount) {
        return res.status(400).json({ message: "Profile ID, counselor name, and amount are required" });
      }

      const booking = await storage.saveConsultationBooking(profileId, counselorName, amount);
      res.json(booking);
    } catch (error) {
      console.error("Error saving consultation booking:", error);
      res.status(500).json({ message: "Failed to save consultation booking" });
    }
  });

  // Seed initial scholarship data (for development)
  app.post("/api/seed/scholarships", async (req, res) => {
    try {
      // Clear existing scholarships first
      await storage.clearAllScholarships();

      const seedScholarships = [
        {
          title: "National Merit STEM Scholarship",
          organization: "Future Scientists Foundation",
          amount: "$15,000",
          deadline: "2024-03-15",
          description: "Supporting outstanding students pursuing STEM degrees with demonstrated academic excellence and research potential.",
          requirements: "Minimum 3.7 GPA, STEM major, research experience preferred, US citizen or permanent resident",
          tags: ["STEM", "Merit-Based", "Undergraduate", "Research"],
          type: "merit-based",
          eligibilityGpa: "3.7",
          eligibleFields: ["Computer Science", "Engineering", "Mathematics", "Physics", "Chemistry", "Biology"],
          eligibleLevels: ["undergraduate"],
          isActive: true
        },
        {
          title: "Tech Diversity Excellence Award",
          organization: "TechForward Initiative",
          amount: "$8,500",
          deadline: "2024-04-01",
          description: "Promoting diversity in technology fields by supporting underrepresented students with financial aid and mentorship.",
          requirements: "Technology-related major, demonstrate financial need, underrepresented minority status, minimum 3.0 GPA",
          tags: ["Technology", "Diversity", "Need-Based", "Mentorship"],
          type: "need-based",
          eligibilityGpa: "3.0",
          eligibleFields: ["Computer Science", "Information Technology", "Software Engineering"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true
        },
        {
          title: "Community Leadership Grant",
          organization: "Local Community Foundation",
          amount: "$3,000",
          deadline: "2024-05-15",
          description: "Recognizing students who demonstrate exceptional leadership and community service commitment.",
          requirements: "Minimum 100 hours community service, leadership role in organization, any major, 3.2+ GPA",
          tags: ["Leadership", "Community Service", "Local"],
          type: "merit-based",
          eligibilityGpa: "3.2",
          eligibleFields: [],
          eligibleLevels: ["undergraduate"],
          isActive: true
        },
        {
          title: "Environmental Innovation Award",
          organization: "Green Future Initiative",
          amount: "$12,000",
          deadline: "2024-06-30",
          description: "Supporting students developing innovative solutions for environmental challenges and sustainability.",
          requirements: "Environmental science or related field, research project focused on sustainability, minimum 3.5 GPA",
          tags: ["Environmental Science", "Innovation", "Research-Based", "Sustainability"],
          type: "merit-based",
          eligibilityGpa: "3.5",
          eligibleFields: ["Environmental Science", "Environmental Engineering", "Renewable Energy", "Biology"],
          eligibleLevels: ["undergraduate", "graduate"],
          isActive: true
        },
        {
          title: "First Generation College Student Support",
          organization: "Educational Equity Foundation",
          amount: "$5,000",
          deadline: "2024-04-30",
          description: "Supporting first-generation college students with financial aid and academic support services.",
          requirements: "First-generation college student status, demonstrate financial need, minimum 2.8 GPA",
          tags: ["First-Generation", "Need-Based", "Academic Support"],
          type: "need-based",
          eligibilityGpa: "2.8",
          eligibleFields: [],
          eligibleLevels: ["undergraduate"],
          isActive: true
        }
      ];

      for (const scholarshipData of seedScholarships) {
        await storage.createScholarship(scholarshipData);
      }

      res.json({ message: "Scholarships seeded successfully", count: seedScholarships.length });
    } catch (error) {
      console.error("Error seeding scholarships:", error);
      res.status(500).json({ message: "Failed to seed scholarships" });
    }
  });

  // Generate resume using n8n webhook
  app.post("/api/resume/generate", async (req, res) => {
    try {
      const { profileId } = req.body;

      if (!profileId) {
        return res.status(400).json({ message: "Profile ID is required" });
      }

      const profile = await storage.getStudentProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      // Call n8n webhook to generate resume
      const webhookUrl = "https://dishajain.app.n8n.cloud/webhook-test/resume-builder-webhook";
      
      const webhookPayload = {
        profileId: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || "",
        location: profile.location,
        educationLevel: profile.educationLevel || "",
        fieldOfStudy: profile.fieldOfStudy || "",
        gpa: profile.gpa || "",
        graduationYear: profile.graduationYear || "",
        skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : (profile.skills || ""),
        activities: profile.activities || "",
        summary: profile.summary || "",
        education: profile.education || "",
        experience: profile.experience || "",
        projects: profile.projects || "",
      };

      console.log("📄 Calling n8n resume webhook with payload:", webhookPayload);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.error("Webhook error:", await webhookResponse.text());
        return res.status(500).json({ message: "Failed to generate resume via webhook" });
      }

      const result = await webhookResponse.json();
      console.log("✓ Resume generation triggered:", result);

      res.json({ 
        message: "Resume generation initiated", 
        profileId,
        status: "processing"
      });
    } catch (error) {
      console.error("Error generating resume:", error);
      res.status(500).json({ message: "Failed to generate resume" });
    }
  });

  // Fetch generated resume from Airtable
  app.get("/api/resume/:profileId", async (req, res) => {
    try {
      const { profileId } = req.params;
      
      const resumeData = await storage.getResumeByProfileId(profileId);
      
      if (!resumeData || !resumeData.notes) {
        return res.status(404).json({ message: "Resume not found. Please generate a resume first." });
      }

      res.json({
        id: resumeData.id,
        profileId: resumeData.profileId,
        content: resumeData.notes,
        createdAt: resumeData.createdAt,
      });
    } catch (error) {
      console.error("Error fetching resume:", error);
      res.status(500).json({ message: "Failed to fetch resume" });
    }
  });

  // Download resume as DOCX
  app.get("/api/resume/:profileId/download", async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getStudentProfileById(profileId);
      const resumeData = await storage.getResumeByProfileId(profileId);
      
      if (!resumeData || !resumeData.notes) {
        return res.status(404).json({ message: "Resume not found. Please generate a resume first." });
      }

      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
      
      const resumeContent = resumeData.notes;
      const lines = resumeContent.split('\n').filter((line: string) => line.trim());
      
      const children: any[] = [];
      
      // Add name as title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: profile?.name || "Resume", bold: true, size: 32 })],
          heading: HeadingLevel.TITLE,
          spacing: { after: 200 },
        })
      );
      
      // Add contact info
      if (profile?.email || profile?.phone) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${profile?.email || ""} | ${profile?.phone || ""} | ${profile?.location || ""}`, size: 22 })
            ],
            spacing: { after: 300 },
          })
        );
      }
      
      // Parse resume content and add as paragraphs
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('##') || trimmedLine.startsWith('**') || trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length > 3) {
          // This is a heading
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmedLine.replace(/[#*]/g, '').trim(), bold: true, size: 26 })],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          // This is a bullet point
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmedLine.substring(1).trim(), size: 22 })],
              bullet: { level: 0 },
              spacing: { after: 50 },
            })
          );
        } else if (trimmedLine) {
          // Regular paragraph
          children.push(
            new Paragraph({
              children: [new TextRun({ text: trimmedLine, size: 22 })],
              spacing: { after: 100 },
            })
          );
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      
      const fileName = `${(profile?.name || 'resume').replace(/\s+/g, '_')}_Resume.docx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}