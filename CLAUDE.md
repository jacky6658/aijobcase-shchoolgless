# CLAUDE.md - EduMind AI 多租戶 SaaS 教材問答平台

## Project Overview

EduMind AI is a multi-tenant SaaS educational platform that enables students and teachers to ask questions about course materials using RAG (Retrieval-Augmented Generation) powered by Google Gemini AI. It supports multiple tenants (schools/organizations) with data isolation and quota management.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.8 + Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **API Routes**: Next.js 16 (serverless endpoints)
- **AI/LLM**: Google Gemini (`@google/genai`, model: `gemini-3-flash-preview`)
- **Charts**: Recharts 3.7
- **Database**: PostgreSQL with pgvector (vector embeddings), Redis + BullMQ (job queue)
- **Module System**: ESM (`"type": "module"`)

## Directory Structure

```
├── components/          # React UI components
│   ├── AIChatView.tsx           # Main chat interface with voice input & streaming
│   ├── AdminArchitectureDoc.tsx # System architecture blueprint
│   ├── AdminUserManagement.tsx  # User admin panel
│   ├── CourseList.tsx            # Course browser
│   ├── Dashboard.tsx            # Role-specific analytics
│   ├── Icons.tsx                # Reusable SVG icon library (18+ icons)
│   ├── LoginView.tsx            # Email + Google OAuth login
│   ├── MaterialManagement.tsx   # File upload, drag-drop, indexing
│   ├── SetPasswordView.tsx      # Password setup post-OAuth
│   ├── Sidebar.tsx              # Role-based navigation + tenant switcher
│   └── UsageView.tsx            # Quota visualization
├── pages/api/           # Next.js API routes
│   ├── chat.ts                  # RAG query endpoint (POST /api/chat)
│   └── materials/upload.ts      # File upload handler (POST /api/materials/upload)
├── services/            # Business logic layer
│   ├── authService.ts           # Authentication (email/password, Google OAuth, session)
│   ├── geminiService.ts         # Gemini AI integration (streaming + non-streaming)
│   ├── quotaService.ts          # Per-tenant usage tracking
│   └── vectorService.ts         # Vector search & document indexing (RAG)
├── App.tsx              # Root component: state management, routing, role-based access
├── index.tsx            # React DOM entry point
├── index.html           # HTML entry with Tailwind CDN
├── types.ts             # TypeScript interfaces and enums
├── constants.tsx        # Mock data and configuration constants
├── schema.sql           # PostgreSQL DDL (tables, pgvector, enums)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── metadata.json        # Project metadata
```

## Commands

```bash
npm run dev        # Start Vite dev server on 0.0.0.0:3000
npm run build      # Production build
npm run preview    # Preview production build
npm install        # Install dependencies
```

There is **no test suite** configured. No Jest, Vitest, or testing libraries are installed.

## Architecture & Key Patterns

### Multi-Tenant Model
- All data is scoped by `tenantId` — passed with every request
- Database constraints enforce tenant isolation (UNIQUE on tenant_id + email)
- Mock tenants: `t1` (NTU), `t2` (Global Academy)

### User Roles (4 tiers)
- `SUPER_ADMIN`: System-wide management
- `TENANT_ADMIN`: School admin — manages users, quotas, materials
- `TEACHER`: Uploads materials, monitors engagement
- `STUDENT`: Views courses, asks AI questions

### RAG Pipeline
```
User Question → vectorService.similaritySearch() → Top 5 chunks
    → geminiService.chatStream() (with quota check) → Streaming response
    → AIChatView renders with markdown + source citations
```

### State Management
- Local `useState` hooks — no Redux/Context API
- Props drilling for shared state
- `localStorage` for session persistence
- Mock data in `constants.tsx` for development

### Authentication (Currently Mocked)
- Email/password login (hardcoded: `alex@ntu.edu.tw` / `123456`)
- Simulated Google OAuth callback
- Session stored in localStorage
- Admin reset token: `secret_token_123` (hardcoded)
- **Production TODO**: bcrypt hashing, JWT tokens, backend session validation

## Code Conventions

### Naming
- **camelCase**: variables, functions, props
- **PascalCase**: React components, TypeScript interfaces/types
- **UPPER_SNAKE_CASE**: enums, constants
- **Prefix `Icon`**: icon components (e.g., `IconBook`, `IconChat`)

### TypeScript
- Use `interface` for object contracts
- Use `enum` for fixed value sets (`UserRole`, `SubscriptionPlan`, `MaterialType`)
- Mark optional properties with `?`
- Path alias: `@/` maps to project root

### Styling (Tailwind)
- Color palette: `indigo` (primary), `slate` (neutral), `emerald`/`red`/`amber` (semantic)
- Responsive: `md:` and `lg:` breakpoints on grid layouts
- Rounding: `rounded-xl` to `rounded-3xl`
- Shadows: `shadow-sm` (light) to `shadow-xl` (modals)
- Transitions: `transition-all duration-300`

### Components
- Functional components with hooks only
- Modal pattern with backdrop blur
- Loading states with Tailwind animations (`animate-pulse`, `animate-bounce`, `animate-spin`)
- Auto-scroll chat via `useRef`

### API Patterns
- Material upload returns `202` (async indexing via job queue)
- Streaming responses via async generators in `geminiService.chatStream()`
- Quota checked before every Gemini API call

## Database Schema (schema.sql)

| Table | Purpose |
|-------|---------|
| `tenants` | Organizations/schools with plan & quota |
| `users` | Accounts with role, tenant, auth info |
| `password_reset_tokens` | Token-based password recovery |
| `courses` | Course containers scoped to tenant |
| `materials` | Uploaded files (PDF/DOCX/PPTX) |
| `document_chunks` | RAG text segments with `vector(1536)` embeddings |
| `conversations` | Chat history per user/course |

Key enums: `subscription_plan` (FREE/PRO/ENTERPRISE/SCHOOL_MVP), `user_role`, `user_status` (ACTIVE/PENDING_PASSWORD/DISABLED), `material_type` (PDF/DOCX/PPTX)

## Environment Variables

- `GEMINI_API_KEY` or `API_KEY`: Google Gemini API key (required)
- Injected via `vite.config.ts` define block

## Language & Locale

- UI text is in **Traditional Chinese (繁體中文)**
- Code identifiers and comments use English
- Voice input configured for Chinese (`zh-TW` / `zh-CN`)

## Development Notes

- Dev tools panel in bottom-right corner allows role switching and tenant switching
- Mock services use in-memory data — no real database connection needed for frontend dev
- Vector similarity search is mocked with keyword matching + scoring heuristics
- Gemini system prompt has 5 educational guidelines (temperature: 0.4)
