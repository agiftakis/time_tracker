# Overview

TimeTracker Pro is a secure employee time management application with digital signature verification and comprehensive admin dashboard. The system provides real-time time tracking with timezone support, secure verification through employee and supervisor signatures, and admin analytics for workforce management. Built as a full-stack web application with mobile-responsive design and PWA capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for accessibility and consistency
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC) protocol
- **Session Management**: Express sessions with PostgreSQL store for persistent user sessions

## Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless database for scalability
- **Session Storage**: PostgreSQL sessions table for authentication state persistence
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Connection Pooling**: Neon serverless connection pooling for optimal performance

## Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect for secure user authentication
- **Session Strategy**: Server-side sessions with secure HTTP-only cookies
- **Role-based Access**: Admin flag in user model for administrative access control
- **Route Protection**: Middleware-based authentication checks on protected endpoints

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection and querying
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **passport & openid-client**: Authentication middleware and OpenID Connect client

### UI and Frontend
- **@radix-ui/***: Accessible UI component primitives for forms, dialogs, and interactions
- **@tanstack/react-query**: Server state management and data fetching with caching
- **wouter**: Lightweight routing library for single-page application navigation
- **react-hook-form & @hookform/resolvers**: Form handling with validation

### Development and Build
- **vite**: Build tool and development server with hot module replacement
- **tailwindcss**: Utility-first CSS framework for styling
- **typescript**: Static type checking and enhanced developer experience
- **zod**: Runtime type validation and schema definition

### PWA and Mobile
- **Service Worker**: Custom offline caching strategy for improved mobile experience
- **Web App Manifest**: PWA configuration for installable mobile application experience