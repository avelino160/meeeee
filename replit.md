# RanZap - WhatsApp Marketing Automation Platform

## Overview

RanZap is a comprehensive WhatsApp marketing automation platform that enables users to create and manage automated message campaigns, build conversation funnels, and handle bulk message dispatching. The application provides a visual funnel builder, contact management, message templates, and analytics dashboard for WhatsApp marketing campaigns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark theme focused)
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Visual Editor**: ReactFlow for the funnel builder canvas

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: OpenID Connect (OIDC) with Replit authentication
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API structure with TypeScript schemas

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle migrations with schema definitions in TypeScript
- **Core Entities**:
  - Users with OIDC authentication
  - WhatsApp connections for phone number linking
  - Campaigns for message automation
  - Funnels with node-based workflow definitions
  - Contacts with tagging and segmentation
  - Message templates for reusable content
  - Funnel executions for tracking automation flows
  - Session storage for user authentication

### Key Features Implementation
- **Funnel Builder**: Visual drag-and-drop interface using ReactFlow for creating message automation sequences
- **WhatsApp Integration**: Connection management with QR code pairing and status monitoring
- **Message Scheduling**: Cron-based scheduler service for delayed message delivery and funnel progression
- **Contact Management**: Import/export capabilities with contact segmentation and tagging
- **Template System**: Reusable message templates with variable substitution
- **Analytics Dashboard**: Campaign performance metrics and delivery statistics

### Authentication & Security
- **Authentication Provider**: Replit OIDC integration
- **Session Management**: Secure session cookies with PostgreSQL backing
- **Authorization**: Route-level protection with user context
- **API Security**: Request validation and error handling middleware

### Development & Deployment
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend development
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Environment**: Replit-optimized with cartographer and dev banner plugins
- **Code Quality**: TypeScript strict mode with comprehensive type checking

## External Dependencies

### Third-Party Services
- **OneMsg.io**: WhatsApp Business API integration for sending messages and media
- **Neon Database**: Serverless PostgreSQL hosting for data persistence
- **Replit Authentication**: OIDC provider for user authentication and authorization

### Key NPM Packages
- **React Ecosystem**: React 18, ReactFlow for visual editing, TanStack Query for data fetching
- **UI Framework**: Radix UI primitives, Tailwind CSS, Shadcn/ui components
- **Backend**: Express.js, Drizzle ORM, OpenID Connect client
- **Development**: Vite, TypeScript, tsx for development server
- **Utilities**: Zod for validation, date-fns for date handling, node-cron for scheduling

### Database Schema
- PostgreSQL with Drizzle ORM managing users, campaigns, funnels, contacts, messages, and WhatsApp connections
- Session-based authentication with connect-pg-simple for session storage
- Comprehensive relational design supporting funnel workflows and message automation