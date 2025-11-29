# ScholarshipAI - AI-Powered Scholarship Matching Platform

## Overview

ScholarshipAI is a web application that uses artificial intelligence to match students with relevant scholarship opportunities. The platform analyzes student profiles including academic performance, field of study, financial need, and extracurricular activities to provide personalized scholarship recommendations with match scores. Students can create detailed profiles, browse matched scholarships, track application deadlines, and receive AI-generated application guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Status & Issues

### Recent Fixes (Session)
- Updated student profile schema to use new fields: Name, Email, Phone, Location, Summary, Education, Experience, Skills (array), Projects
- Fixed Airtable integration issues by simplifying profile creation to use email field only
- Fixed scholarship filtering query to use lowercase "isactive" field name matching Airtable schema
- Simplified routes to use getStudentProfileById instead of non-existent getStudentProfile method
- All profiles created in Airtable now return with proper ID (using Airtable's auto-generated record ID)

### Known Issues to Address
- **CRITICAL: Google Gemini API key expired** - Need to renew GOOGLE_API_KEY environment variable
- Profile data displays only from in-memory fallback (not from Airtable yet) - Airtable table may not have all expected fields
- Scholarship matching fails due to expired API key
- Frontend profile display may need updates to show created profile details

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API structure with route-based organization
- **Development Setup**: Uses tsx for TypeScript execution in development
- **Build Process**: ESBuild for production bundling
- **Error Handling**: Centralized error handling middleware with structured error responses

### Data Storage
- **Database**: Airtable with serverless hosting
- **API Integration**: Direct Airtable SDK for database operations
- **Schema**: Simplified to match actual Airtable table structure
- **Tables**: users, student_profiles, scholarships, scholarship_matches, application_guidance

### Authentication & Authorization
- Currently uses temporary user IDs (authentication system planned but not implemented)
- Session management prepared with connect-pg-simple for PostgreSQL session storage

### AI Integration
- **Provider**: Google Gemini API for intelligent matching and guidance (CURRENTLY EXPIRED - NEEDS RENEWAL)
- **Scholarship Matching**: AI analyzes student profiles against scholarship requirements to generate match scores (0-100)
- **Application Guidance**: AI provides personalized essay tips, checklists, and improvement suggestions

## External Dependencies

### Core Dependencies
- **airtable**: Airtable SDK for database operations
- **@google/genai**: Google Gemini API client
- **drizzle-orm**: Type-safe ORM for database operations (legacy, transitioning to Airtable)

### UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs

### State & Forms
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Performant forms with easy validation
- **@hookform/resolvers**: Validation resolvers for React Hook Form
- **zod**: TypeScript-first schema validation

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution environment for development
- **esbuild**: Fast bundler for production builds

### External Services
- **Google Gemini API**: AI-powered scholarship matching and application guidance (NEEDS KEY RENEWAL)
- **Airtable**: Database with n8n integration capability
