# Campus Compass – Master Project Context

> **IMPORTANT:** This file is the single source of truth for the entire project.
> Every prompt must read this file first and follow it strictly.

---

## 1. PROJECT OVERVIEW

**Name:** Campus Compass – International Student Support Platform

**Problem:** International students face language gaps, unfamiliar food,
documentation processes (FRRO, enrollment, student ID), banking and SIM
difficulties, and social isolation. Generic support does not address differences
between regions and individual circumstances.

**Goal:** A web app that gives PERSONALIZED, COUNTRY-AWARE help. A student from
Uganda, Vietnam or Nigeria sees different food places, buddies, guides and
chatbot answers.

**Example user story:** Moses, a BTech student from Uganda, arrives in India and
needs a SIM card, a bank account, familiar food and friends.

---

## 2. TECH STACK (strict)

| Layer | Technology |
|---|---|
| Frontend | React with JSX (NOT TypeScript), inside Next.js App Router |
| Backend | Next.js Route Handlers (`app/api/**/route.js`) |
| Database | MongoDB Atlas with Mongoose |
| Styling | Tailwind CSS only (no other CSS framework) |
| Auth | NextAuth (Auth.js) with credentials provider, bcryptjs for hashing |
| Icons | lucide-react |
| Animations | framer-motion (light use) + Tailwind transitions |
| Chatbot | LLM API called only from a server route (never expose keys to client) |
| Maps | Leaflet / react-leaflet (free) |
| Language | JavaScript (.js / .jsx), use `@/` import alias |

**Environment variables** (`.env.local`, never commit):
```
MONGODB_URI
NEXTAUTH_SECRET
NEXTAUTH_URL
LLM_API_KEY
```

---

## 3. MODULES

| # | Module | Description |
|---|---|---|
| 1 | **Auth** | Register, login, logout, protected pages, roles (student, buddy, admin) |
| 2 | **Onboarding** | Multi-step form (country, languages, diet, university, visa type, arrival date) |
| 3 | **Dashboard** | Personalized home (pending tasks, quick links, recommended content) |
| 4 | **Checklist** | Arrival documentation tracker with deadlines and progress bar |
| 5 | **Guides** | SIM and Bank step-by-step guides with required documents, provider list, tips, and per-user step progress |
| 6 | **Food Finder** | Map and list, filter by cuisine, diet (halal, vegetarian, etc.), country tags, student reviews |
| 7 | **Community** | Student invitations, WhatsApp-style 1-to-1 chat after accepted invitation, Block and Report safety tools, campus mixer events with RSVP |
| 7.5 | **Notifications** | In-app notification bell, badge, dropdown, full history page, triggered by new chat messages and invitations |
| 8 | **Language Help** | Common phrases and campus glossary |
| 9 | **Chatbot** | Answers using the student's profile + matching guides from DB |
| 10 | **Admin Panel** | Role-protected CRUD for guides, places, events, checklist items |

---

## 4. CORE RULE: COUNTRY-BASED PERSONALIZATION

- A student can be from **ANY country**. NEVER hardcode country-specific logic,
  pages or components. All country differences come from **DATA TAGS** in the database.
- Every content document (Guide, Place, ChecklistItem, Event) has tags such as
  `region: [String]` (e.g. `["Uganda"]`, `["East Africa"]`, `["ALL"]`).

**Fallback chain** when fetching content for a user:
1. user's country
2. user's regionGroup
3. `"ALL"`

**Query pattern:**
```js
region: { $in: [user.country, user.regionGroup, "ALL"] }
```
Show the most specific match first. If the country has no data, the app must
still work and show regionGroup / ALL content with a friendly note.

**Connection / People matching priority (seniors and peers):**
1. Same country (default view in People tab)
2. Same language or regionGroup
3. Any available international peer/senior open to connect

Invitation-based connection flow: student sends an invitation (optional plain text note max 150 chars); chat opens only after the recipient accepts. Limits: max 3 pending sent invitations, max 10 invitations per 24 hours. Decline cooldown: 30 days. Expiry: 14 days. Safety tools (Block and Report); openToConnect controls discovery in People.

**Reusable helper:** Create ONE file `lib/personalization.js` used by every module.

---

## 5. DATABASE MODELS (Mongoose, in `/models`)

### User
```
name, email (unique), password (hashed), role (student|buddy|admin),
country, regionGroup, languages[], diet, university, visaType, arrivalDate,
isSenior (Boolean), openToConnect (Boolean, default true), bio, onboardingDone (Boolean),
lastSeenAt (Date, default null), createdAt
```

### Guide
```
category (sim|bank|language), title, region[], visaTypes[],
requiredDocs[], providers[{name, notes}], steps[{order, title, description}],
tips[], sourceUrl, lastVerified (Date), updatedAt
```

### GuideProgress
```
userId, guideId, completedSteps[Number]
(unique index on userId + guideId)
```

### ChecklistItem
```
title, description, region[], deadlineOffsetDays, order,
guideCategory (enum: "sim" | "bank" | null) – links item to its guide page
```

### UserChecklist
```
userId, itemId, status (pending|done)
```

### Place
```
name, type (grocery|restaurant|cafeteria), cuisine[], dietTags[],
countryTags[], address, location{lat,lng}, rating, reviews[]
```

### BuddyMatch
```
requesterId, recipientId, pairKey, status (pending|active|declined|cancelled|expired|blocked),
blockedBy, lastMessageAt, inviteNote (max 150 chars), invitedAt, respondedAt, expiresAt, cooldownUntil
(unique index on pairKey; indexes on requesterId, recipientId, status, lastMessageAt)
```

### Report
```
reporterId, reportedId, matchId, reason (spam|harassment|inappropriate|fake_profile|other),
details (max 300), status (open|reviewed, default open), createdAt
(indexes on status + createdAt, reporterId + matchId)
```

### Message
```
matchId, senderId, recipientId, clientId (optional), text (1 to 500 chars),
readAt (Date, default null), createdAt, updatedAt
(compound indexes on matchId + createdAt, matchId + updatedAt, recipientId + readAt;
 unique sparse index on senderId + clientId)
```

### Event
```
title, description, date, region[], location, attendees[]
```

### Notification
```
recipientId, actorId, type (new_message|invitation_received|invitation_accepted),
matchId, count, preview (max 85 chars), readAt, isSample, createdAt, updatedAt
(compound index on recipientId + readAt + createdAt desc; TTL index on createdAt 60 days)
```

> **Note:** Use `mongoose.models.X || mongoose.model(...)` to avoid model recompile errors.
> Add indexes on `region` and `category` fields.
> Every content model (Guide, ChecklistItem, Place, Event) and seeded User documents
> include an **`isSample` (Boolean, default false)** field. The seed script sets it to
> `true` on all inserted rows so they can be safely deleted and reinserted without
> touching real user data.

---

## 6. FOLDER STRUCTURE

```
app/
  (auth)/
    login/
    register/
  onboarding/
  dashboard/
  checklist/
  guides/[category]/
  food/
  community/
    chat/[matchId]/
  notifications/
  language/
  chat/
  admin/
  api/
    auth/
    users/
    checklist/
    guides/
    places/
    buddies/
      [matchId]/
        messages/
        read/
    invitations/
      [matchId]/
    reports/
    events/
    notifications/
    chat/
    admin/
components/
  ui/
  layout/
  modules/
    community/
      chat/
    notifications/
lib/
  mongodb.js
  auth.js
  personalization.js
  community.js
  invitations.js
  reports.js
  messages.js
  presence.js
  notifications.js
  notificationText.js
  utils.js
models/
  User.js
  Guide.js
  GuideProgress.js
  ChecklistItem.js
  UserChecklist.js
  Place.js
  BuddyMatch.js
  Report.js
  Message.js
  Event.js
  Notification.js
scripts/
  seed.js
  migrate-invitations.js
  migrate-direct-chat.js
public/
```

---

## 7. UI / DESIGN SYSTEM

> Goal: modern, friendly, premium look that international students enjoy using.
> Define design tokens ONCE in `tailwind.config.js` and `globals.css` and reuse them.

### Colors
- **Primary:** indigo/violet (`indigo-600` to `violet-600` gradient)
- **Accent:** teal/emerald for success and progress; amber for warnings/deadlines
- **Background:** soft `slate-50` with subtle gradient blobs; white cards
- **Text:** `slate-900` headings, `slate-600` body
- **Dark mode:** via Tailwind `dark:` classes with a toggle

### Typography
Inter or Poppins via `next/font`; clear heading scale.

### Buttons
Gradient primary, outline secondary, ghost tertiary. All with:
- `hover:-translate-y-0.5`, stronger shadow, color shift
- `active:scale-95`, `transition-all duration-200`
- Visible focus ring
- Disabled and loading (spinner) states

### Cards
`rounded-2xl`, soft shadow, border, hover lift + shadow, optional gradient top border or icon badge.

### Inputs
`rounded-xl`, focus ring in primary color, inline validation errors.

### Navbar
Sticky, glass/blur effect, active link highlight, mobile hamburger menu.

### Layout
Sidebar on desktop dashboard, bottom or drawer navigation on mobile.

### Landing Page
Strong headline, gradient background, CTA buttons, feature cards, "How it works" section.

### Motion
- Subtle fade/slide-in on page load and list items (framer-motion)
- Skeleton loaders
- Toast notifications
- Progress bars with animated fill

### Icons
lucide-react on cards, buttons and nav.

### States
Every page needs loading, empty, and error states that look designed.

### Reusable Components (must build)
```
Button, Card, Input, Select, Badge, ProgressBar, Modal,
Toast, Skeleton, Navbar, Sidebar, EmptyState, StepCard
```

### Responsive (mobile-first)
Must look perfect at **360px, 768px, 1024px, 1440px**.
No horizontal scroll, touch-friendly targets (min 44px), responsive grids.

### Accessibility
Semantic HTML, alt text, aria-labels, keyboard navigation, sufficient contrast.

---

## 8. CODING RULES

- Step 0: Do not start, restart, or stop the dev server.
- Server Components for data pages; `"use client"` only for interactive parts
  (forms, map, chat, toggles).
- Every API route: `connectDB()`, check session, validate input, return proper
  status codes and JSON errors, wrap in `try/catch`.
- Always take `userId` from the **session**, NEVER from the request body.
- Role checks for admin routes (server-side).
- Never expose secrets to the client. Hash passwords with `bcryptjs`.
- Keep components small, reusable, and well named. Add short comments.
- Use `$addToSet` / `$pull` for array updates; use `.lean()` for read-only queries.
- No hardcoded country names in logic; only in seed data.
- Never pass component references (such as lucide icons) as props from a
  Server Component to a Client Component. Pass rendered elements instead,
  for example icon={<Users size={20} />}.
- Do not run "npm run build" while the dev server is running. Run it only
  when I ask for a production build.

---

## 9. DATA RULES

- All seed data is **SAMPLE data** and must be clearly marked as such.
- Every Guide shows **"Last verified"** date and source, plus a note:
  > "Rules may change. Please confirm with the provider or your university's international office."
- Seed script must include at least **3 sample countries** (Uganda, Vietnam, Nigeria)
  plus `"ALL"` content, to demonstrate personalization.

---

## 10. HOW WE WILL WORK

- Prompts are delivered **one at a time (Prompt 1 to 13)**. Do only what the current prompt asks. Do not build future modules early.
- **At the start of each prompt:** briefly list your plan, then write the code.
- **At the end of each prompt:** list the files created/changed and tell how to run and test it.
- If something is unclear, make a sensible assumption and state it.
- Reuse the design system and components from earlier prompts.

---

## 11. CODE STYLE (write like an experienced human developer, not a template)

- Use natural, specific names (handleProfileSubmit, countryOptions, isStepValid). Avoid generic names like data1, temp, result2, handleClick2, processData.
- Comment only when the reason is not obvious from the code. No comment on every line. No banner comments like "// ===== SECTION =====". No JSDoc on trivial functions. Short, plain English comments.
- No unused imports, no unused variables, no commented-out code, no leftover console.log (keep console.error only for real server errors).
- No placeholder text: no "Lorem ipsum", "foo/bar", "TODO: implement". Write real, friendly copy aimed at international students.
- No emojis in code, logs or comments (UI copy may use them sparingly).
- Keep it simple: do not create helpers, wrappers or config for something used only once. Prefer plain, readable logic over clever one-liners.
- Keep functions short and files focused. Split a file when it gets long (roughly 250+ lines), not earlier.
- Error messages must be realistic and specific ("Please enter a valid arrival date"), not generic ("An error occurred").
- Formatting must be consistent across the whole project.

---

*Last updated: 2026-11-16*

