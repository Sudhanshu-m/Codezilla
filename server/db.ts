import Airtable from "airtable";

const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

console.log("🔌 Airtable Configuration:");
console.log("   API Key:", apiKey ? "✓ Set" : "✗ Missing");
console.log("   Base ID:", baseId ? `✓ ${baseId}` : "✗ Missing");

if (!apiKey || !baseId) {
  console.warn(
    "⚠️  Airtable credentials not configured. Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables."
  );
}

if (apiKey) {
  Airtable.configure({ apiKey });
}

export const base = baseId && apiKey ? new Airtable().base(baseId) : null;

export const tables = {
  users: "users",
  studentProfiles: "student_profiles",
  scholarships: "scholarships",
  scholarshipMatches: "scholarship_matches",
  applicationGuidance: "application_guidance",
};

console.log("✅ Airtable client initialized:", base ? "Ready" : "Waiting for credentials");
