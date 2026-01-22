# Undifest Event Platform

## Overview

Undifest is a mobile-first event lottery platform where users purchase e-books as lottery tickets for various prizes. The platform features a public-facing mobile application for users and a comprehensive administrative dashboard for managing events, banners, transactions, and winners. Its purpose is to provide an engaging and secure lottery experience, with a focus on mobile accessibility and robust backend management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React and TypeScript, using Vite for fast development. It follows a mobile-first design pattern with a maximum width constraint of 540px, centered on desktop. A custom design system adheres to Undifest brand guidelines, featuring a dark navy theme with purple/pink gradient accents and custom typography (Rajdhani font). Key UI patterns include a fixed bottom navigation bar, gradient-bordered event cards, carousel banners, and tab-based content switching. Shadcn UI, customized to brand guidelines, and Radix UI primitives are used for components, while TanStack Query manages server state.

### Backend Architecture

The backend is an Express.js application with TypeScript, running on Node.js. It uses ESM modules and is bundled with esbuild for production. The API is RESTful, handling file uploads via Multer (5MB limit) and using JSON for requests/responses. Authentication is session-based for users (phone number OTP) and JWT-based for admins.

### Database Layer

Drizzle ORM provides type-safe database operations with a Replit PostgreSQL (Neon-backed) database. The architecture employs a schema-first approach with Zod validation. Data models include Admin Users, Events, Banners, Users, Transactions, Winners, and Videos, all utilizing UUID primary keys. A `DatabaseStorage` class provides an interface-based storage abstraction.

### Authentication & Authorization

**User Authentication:** Phone number-based OTP authentication with 6-digit OTPs that expire in 5 minutes and are single-use. User JWT tokens have a 30-day expiration.
**Admin Authentication:** JWT-based system with bcrypt password hashing. Admin credentials ("admin", "admin123") are protected by a `requireAdmin` middleware.

### File Handling

Images are managed with in-memory Multer storage during upload, and their URLs are stored in the database. The system supports both uploaded images and external image URLs.

### Admin Panel Features

The admin panel provides a comprehensive suite of tools for platform management, distinct from the user-facing theme with a light design.
- **Dashboard:** Overview of active events, total transactions, revenue, and winners.
- **Event Manager:** Comprehensive event management interface with create/edit forms, collapsible current events section, past events tracking with profit/loss calculations, and sortable participants table with search and dual filters. The interface preserves server-maintained fields (ticketsReceived, cardTemplate, status) during edits to maintain data integrity.
- **Management Sections:** Banners, Members, Transactions, Winners, and Videos.
- **Secure Lottery Drawing System:** Server-side random winner selection using `crypto.randomInt`, with duplicate prevention, transaction validation, and event participation verification.
- **Security:** All admin endpoints are protected by `requireAdmin` middleware.
- **Query Client:** Automatically attaches JWT bearer tokens to requests for authentication.

## External Dependencies

**UI Component Libraries:**
- Shadcn UI
- Radix UI (21+ packages)
- Lucide React and React Icons
- Embla Carousel
- CMDK, React Day Picker, Recharts, Vaul

**Development & Build Tools:**
- Vite, TypeScript, Tailwind CSS, PostCSS with Autoprefixer
- ESBuild, TSX

**Backend Libraries:**
- Drizzle ORM, Drizzle Zod, Neon Serverless
- Multer, Connect PG Simple

**Data Management:**
- TanStack Query, React Hook Form, Hookform Resolvers, Zod, Date-fns

**Fonts & Assets:**
- Google Fonts (Rajdhani)
- Custom logo, branded card templates, banner images, UI elements, footer assets

**Database:**
- Replit PostgreSQL (Neon-backed) via `DATABASE_URL` environment variable.

**Deployment Environment:**
- Replit-specific plugins
- Autoscale deployment target