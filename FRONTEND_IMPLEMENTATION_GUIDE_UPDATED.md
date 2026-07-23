# Daily Report Automation — Frontend Implementation Guide

Last reviewed: 2026-07-19

## 1. Project Goal

Build a frontend report-builder UI for the Daily Report Automation system.

The frontend should allow a user to create a report session, provide all required report data, preview generated report sections, build the final A4 landscape DOCX report, and download the completed document.

The FastAPI backend is already frontend-ready and supports:

- PostgreSQL-backed report metadata for dashboard/history persistence
- Filesystem-backed uploads, processed data, previews, and generated outputs
- Daily Hour CSV/XLSX uploads
- Wideload CSV/XLSX uploads
- Impounded/Prohibited CSV/XLSX uploads
- Overloaded CSV/XLSX uploads
- Manual Traffic Census inputs
- Manual Transgressions inputs
- Section previews in PNG, PDF, and DOCX formats
- Sections 1–7 rendering into the final DOCX
- Final A4 landscape DOCX generation
- Final DOCX download
- Password-gated report history and deletion via `X-Admin-Password`
- Production persistence health checks for PostgreSQL and Render disk storage
- Upload-through-build workflow tests

The frontend should be built in stages, starting with this implementation guide before writing code.

---

## 2. User Workflow

1. Open the report builder.
2. Create or start a report session.
3. Enter report metadata.
4. Upload required source files:
   - Daily Hour
   - Wideload
   - Impounded/Prohibited
   - Overloaded
5. Enter Traffic Census manual inputs.
6. Enter Transgressions manual inputs.
7. Review upload and manual-input completion status.
8. Preview generated report sections.
9. Build the final report.
10. Download the final DOCX.

The UI should make it obvious:

- What has been completed
- What is still missing
- What is ready for preview
- What is blocking the final build
- Whether the final report is ready for download

---

## 3. Frontend Stack

Preferred stack:

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod

Recommended usage:

| Tool | Purpose |
|---|---|
| Next.js | App routing and page structure |
| TypeScript | Shared frontend types and API safety |
| Tailwind CSS | Layout, spacing, cards, buttons, badges |
| TanStack Query | Backend session state, uploads, previews, build status |
| React Hook Form | Metadata and manual input forms |
| Zod | Form validation and API payload validation |

---

## 4. Recommended Frontend Repo Structure

```txt
frontend/
├── app/
│   ├── page.tsx
│   ├── admin/
│   │   └── page.tsx
│   ├── reports/
│   │   └── new/
│   │       └── page.tsx
│   └── globals.css
├── components/
│   ├── report-builder/
│   │   ├── ReportHeader.tsx
│   │   ├── ReportSidebar.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── ProgressSummary.tsx
│   │   ├── SectionCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ReportMetadataForm.tsx
│   │   ├── UploadChecklist.tsx
│   │   ├── ManualInputsPanel.tsx
│   │   └── SectionPreviewPanel.tsx
├── lib/
│   ├── api.ts
│   ├── types.ts
│   └── constants.ts
└── FRONTEND_IMPLEMENTATION_GUIDE.md
```

---

## 5. Screen Structure

Primary route:

```txt
/reports/new
```

This page should contain the full report builder workflow.

Admin route:

```txt
/admin
```

This page prompts for the backend `ADMIN_PASSWORD`, stores it only in browser
session storage for the current tab, and sends it as `X-Admin-Password` when
listing report history or deleting a report workspace. Report history and
delete controls should not appear in ordinary user settings. System status,
session/debug details, and developer prompt access for submitted tickets also
belong in this admin route, not in ordinary settings or the public tickets page.

### Preferred Layout

Use a two-column report builder layout.

### Left Column

User input and workflow actions:

1. Report Metadata
2. Upload Checklist
3. Manual Inputs
4. Build Final Report

### Right Column

Status, previews, and final output:

1. Progress Summary
2. Section Preview
3. Final Report Status
4. Download DOCX

Suggested desktop layout:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Daily Report Builder                                         │
│ Session status / save status / build status                  │
├─────────────────────────────────┬────────────────────────────┤
│ Left Column                     │ Right Column               │
│                                 │                            │
│ Report Metadata                 │ Progress Summary           │
│ Upload Checklist                │ Section Preview            │
│ Manual Inputs                   │ Final Report Status        │
│ Build Report                    │ Download DOCX              │
└─────────────────────────────────┴────────────────────────────┘
```

---

## 6. Component Plan

### `ReportMetadataForm.tsx`

Purpose:

- Capture report-level information.
- Provide required metadata before final build.

Possible fields:

- Report title
- Report date
- Station / site / location
- Prepared by
- Confirmed By / Approved By (Locked to "Faith Njani" and disabled for editing)
- Optional notes

Responsibilities:

- Render metadata form fields
- Validate required metadata
- Submit metadata to frontend state or backend session
- Show saved, unsaved, or invalid states

Phase 1:

- Static form with local state
- Basic mock validation

Phase 2+:

- Use React Hook Form and Zod
- Save metadata to backend session

---

### `UploadChecklist.tsx`

Purpose:

- Show all required source-file uploads.
- Display completion state for each upload category.

Required upload categories:

1. Daily Hour
2. Wideload
3. Impounded/Prohibited
4. Overloaded

Responsibilities:

- Render upload cards
- Track upload completion
- Show missing/uploaded/error states
- Tell user which files are still required

Phase 1:

- Mock upload state
- File selection changes local status only

Phase 2+:

- Use backend upload endpoints
- Refetch session status after upload
- Show real errors from backend

---

### `SectionUploadCard.tsx`

Purpose:

- Reusable card for one upload type.

Suggested props:

```ts
type SectionUploadCardProps = {
  uploadKey: UploadKey;
  title: string;
  description: string;
  acceptedFormats: string[];
  required: boolean;
  status: UploadStatus;
  filename?: string;
  errorMessage?: string;
  onFileSelected: (file: File) => void;
};
```

Upload statuses:

```ts
type UploadStatus =
  | "missing"
  | "selected"
  | "uploading"
  | "uploaded"
  | "error";
```

Responsibilities:

- Render file input
- Show accepted formats
- Show upload status
- Show selected/uploaded filename
- Show upload errors

---

### `ManualInputsPanel.tsx`

Purpose:

- Group manual input forms needed for the report.

Contains:

- `TrafficCensusForm`
- `TransgressionsForm`

Responsibilities:

- Show manual-input completion status
- Provide clear separation between input groups
- Help determine build readiness

---

### `TrafficCensusForm.tsx`

Purpose:

- Capture manual Traffic Census values.

Responsibilities:

- Render Traffic Census input fields
- Validate required fields
- Save values to frontend state/backend
- Show saved/unsaved state

Phase 1:

- Local mock form

Phase 2+:

- React Hook Form + Zod
- PATCH manual inputs to backend

---

### `TransgressionsForm.tsx`

Purpose:

- Capture manual Transgressions values.

Responsibilities:

- Render Transgressions input fields
- Validate required fields
- Save values to frontend state/backend
- Show saved/unsaved state

Phase 1:

- Local mock form

Phase 2+:

- React Hook Form + Zod
- PATCH manual inputs to backend

---

### `SectionPreviewPanel.tsx`

Purpose:

- Let users preview generated report sections before building the final report.

Backend preview support:

- PNG preview
- PDF preview
- DOCX preview

Expected sections:

- Section 1
- Section 2
- Section 3
- Section 4
- Section 5
- Section 6
- Section 7

Responsibilities:

- Show section tabs or selector
- Display selected section preview
- Support preview format selection where useful
- Show unavailable, loading, ready, and error states

Recommended UI:

- Section tabs across the top
- Preview format selector: PNG / PDF / DOCX
- Preview viewer area
- Refresh preview button if needed

Preview statuses:

```ts
type SectionPreviewStatus =
  | "not_ready"
  | "loading"
  | "ready"
  | "error";
```

---

### `BuildReportPanel.tsx`

Purpose:

- Show final report readiness and trigger final DOCX build.

Responsibilities:

- Display readiness checklist
- Disable build button until required inputs are complete
- Trigger backend final report build
- Show building, completed, and error states

Build statuses:

```ts
type BuildStatus =
  | "not_ready"
  | "ready"
  | "building"
  | "completed"
  | "error";
```

---

### `DownloadReportCard.tsx`

Purpose:

- Let users download the completed final DOCX.

Responsibilities:

- Show whether final DOCX is available
- Disable download until build is completed
- Trigger final DOCX download
- Show filename or generated timestamp if available

---

## 7. API Endpoint Map

Exact endpoint paths should be copied from `BACKEND_FRONTEND_INTEGRATION_GUIDE.md`.

| Frontend Action | Backend Purpose | Method | Frontend Function |
|---|---|---:|---|
| Create report session | Start new filesystem-backed session | `POST` | `createReportSession()` |
| Get session status | Fetch metadata, uploads, manual input, preview, and build state | `GET` | `getReportSession(sessionId)` |
| Save metadata | Persist report metadata | `PATCH` / `PUT` | `updateReportMetadata(sessionId, payload)` |
| Upload Daily Hour file | Attach Daily Hour CSV/XLSX | `POST` | `uploadReportFile(sessionId, "daily_hour", file)` |
| Upload Wideload file | Attach Wideload CSV/XLSX | `POST` | `uploadReportFile(sessionId, "wideload", file)` |
| Upload Impounded/Prohibited file | Attach Impounded/Prohibited CSV/XLSX | `POST` | `uploadReportFile(sessionId, "impounded_prohibited", file)` |
| Upload Overloaded file | Attach Overloaded CSV/XLSX | `POST` | `uploadReportFile(sessionId, "overloaded", file)` |
| Save Traffic Census inputs | Persist manual Traffic Census values | `PATCH` / `PUT` | `updateTrafficCensus(sessionId, payload)` |
| Save Transgressions inputs | Persist manual Transgressions values | `PATCH` / `PUT` | `updateTransgressions(sessionId, payload)` |
| Fetch section preview | Retrieve PNG/PDF/DOCX preview for selected section | `GET` | `getSectionPreview(sessionId, sectionNumber, format)` |
| Build final DOCX | Generate final A4 landscape DOCX | `POST` | `buildFinalReport(sessionId)` |
| Download final DOCX | Download completed report | `GET` | `downloadFinalReport(sessionId)` |
| Fetch SMS dates | Retrieve unique dates having SMS summaries | `GET` | `getSmsSummaryDates()` |
| Fetch SMS summaries | Retrieve SMS summary objects by date | `GET` | `getSmsSummariesByDate(reportDate)` |

Suggested `lib/api.ts` shape:

```ts
export async function createReportSession() {}

export async function getReportSession(sessionId: string) {}

export async function updateReportMetadata(
  sessionId: string,
  payload: ReportMetadata
) {}

export async function uploadReportFile(
  sessionId: string,
  uploadKey: UploadKey,
  file: File
) {}

export async function updateTrafficCensus(
  sessionId: string,
  payload: TrafficCensusInput
) {}

export async function updateTransgressions(
  sessionId: string,
  payload: TransgressionsInput
) {}

export async function getSectionPreview(
  sessionId: string,
  sectionNumber: ReportSectionNumber,
  format: PreviewFormat
) {}

export async function buildFinalReport(sessionId: string) {}

export async function downloadFinalReport(sessionId: string) {}

export async function getSmsSummaryDates() {}

export async function getSmsSummariesByDate(reportDate: string) {}
```

---

## 8. Frontend State Model

### Core Types

```ts
type UploadKey =
  | "daily_hour"
  | "wideload"
  | "impounded_prohibited"
  | "overloaded";

type PreviewFormat = "png" | "pdf" | "docx";

type ReportSectionNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

### Report Builder State

Phase 1 may use local React state.

Phase 2 should move server-backed state to TanStack Query.

```ts
type ReportBuilderState = {
  sessionId: string | null;
  metadata: ReportMetadata;

  uploads: Record<UploadKey, UploadState>;

  manualInputs: {
    trafficCensus: TrafficCensusInput;
    transgressions: TransgressionsInput;
  };

  manualInputStatus: {
    trafficCensus: ManualInputStatus;
    transgressions: ManualInputStatus;
  };

  previews: Record<ReportSectionNumber, SectionPreviewState>;

  selectedPreview: {
    sectionNumber: ReportSectionNumber;
    format: PreviewFormat;
  };

  buildStatus: BuildStatus;
  finalDocxAvailable: boolean;
  finalDocxFilename: string | null;
};
```

### Upload State

```ts
type UploadState = {
  status: UploadStatus;
  filename?: string;
  uploadedAt?: string;
  errorMessage?: string;
};
```

### Preview State

```ts
type SectionPreviewState = {
  status: SectionPreviewStatus;
  formatsAvailable: PreviewFormat[];
  errorMessage?: string;
  updatedAt?: string;
};
```

### Manual Input Status

```ts
type ManualInputStatus =
  | "empty"
  | "dirty"
  | "saving"
  | "saved"
  | "error";
```

---

## 9. Validation Plan

Validation should be introduced in layers.

### Phase 1 Validation

Use simple inline checks.

Validate:

- Required metadata fields are not empty
- Required upload categories are complete
- Manual input groups have required values
- Final build button is disabled until mock requirements are complete

### Phase 2 Validation

Use backend responses as source of truth.

Validate:

- Session ID exists before upload/build/preview
- File type is CSV or XLSX before upload
- Upload category is valid
- Preview section number is valid
- Preview format is valid
- Build action is blocked until backend reports readiness

### Phase 3 Validation with React Hook Form + Zod

Add Zod schemas in `lib/types.ts` or a dedicated validation file.

Suggested schemas:

```ts
reportMetadataSchema
trafficCensusSchema
transgressionsSchema
uploadKeySchema
previewFormatSchema
reportSectionNumberSchema
```

Validation goals:

- Clear field-level errors
- Predictable payload shapes
- Safer API calls
- Better build-readiness logic

---

## 10. TanStack Query Plan

Use TanStack Query for backend-backed session data.

Suggested queries:

```ts
useReportSession(sessionId)
useSectionPreview(sessionId, sectionNumber, format)
```

Suggested mutations:

```ts
useCreateReportSession()
useUpdateReportMetadata()
useUploadReportFile()
useUpdateTrafficCensus()
useUpdateTransgressions()
useBuildFinalReport()
```

Recommended invalidation behavior:

| Mutation | Invalidate |
|---|---|
| Create session | Session query |
| Update metadata | Session query |
| Upload file | Session query, previews |
| Update manual inputs | Session query, previews |
| Build final report | Session query |
| Download final report | No invalidation required |

---

## 11. Implementation Phases

### Phase 1 — Static UI

Goal:

Build the report builder interface without backend calls.

Tasks:

- Create `/reports/new` page
- Build two-column layout
- Create all planned UI components
- Use mock report session state
- Create mock upload states
- Create mock manual input forms
- Create mock section preview panel
- Create mock build and download states
- Use Tailwind CSS for layout and styling

Rules:

- No backend calls
- No TanStack Query yet unless project setup already includes it
- No complex validation
- No production API assumptions

Completion criteria:

- User can fill metadata
- User can fake/select all four required uploads
- User can fill manual input sections
- Progress summary updates from mock state
- Preview panel displays dummy section previews
- Build button enables when mock requirements are complete
- Download button enables after mock build completion

---

## Current Tracker

| Feature | Status |
|---|---|
| Responsive dashboard layout | Implemented |
| Sticky full-height sidebar | Implemented |
| Settings slide-over panel | Implemented |
| `lucide-react` icon usage | Implemented |
| Reusable `StatusBadge` component | Implemented |
| Build workflow status badges | Implemented |
| Progress summary / summary cards UI | Implemented |
| `type="date"` metadata input | Implemented |
| Numeric inputs with `type="number"`, `min`, `step` | Implemented |
| Reusable `SectionCard` layout wrapper | Implemented |
| Reusable layout primitives and dashboard architecture | Implemented |
| Sidebar dropdown menu structure | Implemented |
| Configuration-driven sidebar navigation | Implemented |
| Active report type indication | Implemented |

## Latest Progress Notes

- The frontend now has a responsive report builder layout with a large-screen sidebar and main content area.
- `ReportSidebar` is rendered as a sticky full-height dashboard navigation on `xl` screens.
- A slide-over settings panel has been implemented in `/app/reports/new/page.tsx` using a fixed inset overlay and right-hand panel.
- `lucide-react` has been introduced for SVG icon components, including the `Settings` icon in the sidebar.
- Sidebar navigation now uses a dropdown menu structure with a collapsible "Reports" section controlled by `reportsOpen` state.
- The current active report is **Static Weighbridge Report** (`/reports/new`), rendered with a `FileText` icon.
- **Mobile Weighbridge Report** has been added as a future sidebar item (currently disabled, href="#"), rendered with a `Truck` icon.
- Reports dropdown can be opened and closed via a `ChevronDown` icon button with smooth rotation animation.
- Navigation configuration has been moved to `lib/constants.ts` in a `REPORT_NAV_ITEMS` structure for maintainability and extensibility.
- `ReportSidebar` now uses configuration-driven rendering, mapping over nav items and applying appropriate icons and active states.
- `StatusBadge` is used across the upload checklist and build status states to standardize status labels.
- Progress summary cards are implemented via `ProgressSummary.tsx` and `SummaryCards.tsx` to surface metadata, upload, manual input, and build readiness.
- Input controls now use semantic browser UI: report date uses `type="date"`, and numeric manual inputs use `type="number"` with `min={0}` and `step={1}` validations.
- A reusable `SectionCard` wrapper now provides consistent panel styling for report sections.

- Documentation updated: 2026-07-19 — review and minor clarifications; no behavioral changes.

## Architecture Notes

- The current frontend architecture centers on reusable UI primitives in `components/report-builder`: `SectionCard`, `StatusBadge`, `ProgressSummary`, `SummaryCards`, and `ReportSidebar`.
- Layout is built as a responsive dashboard using Tailwind CSS utility classes and a two-column structure with mobile-first collapse behavior.
- `ReportSidebar` is a sticky dashboard panel that remains visible while the main builder content scrolls.
- Navigation structure is now externalized into `lib/constants.ts` as `REPORT_NAV_ITEMS`, enabling easy addition of new report types without modifying component logic.
- Each navigation item specifies `label`, `href`, `icon` (string identifier), and `active` (boolean) to control rendering and styling.
- Icon rendering in `ReportSidebar` maps icon identifiers (`"file"`, `"truck"`) to `lucide-react` components, allowing icon selection via configuration.
- Active report styling is controlled by the `active` property in the nav config, highlighting the current report with cyan-tinted background.
- The settings panel is implemented as a slide-over overlay, allowing non-disruptive local configuration without navigating away from the report builder.
- The codebase currently uses local component state in `/app/reports/new/page.tsx` and has not yet wired the UI to backend API calls.
- The navigation pattern establishes a foundation for adding multiple report types: new entries in `REPORT_NAV_ITEMS` will automatically render in the sidebar.
- The current structure is well-positioned to evolve into a backend-integrated session workflow once API client and query layers are added.

## Next Task

Prepare route structure for future report types while keeping the current Static Weighbridge Report UI working:

- Establish `/reports/[reportType]/new` route structure with `reportType` as dynamic segment
- Create report type discriminator logic (e.g., `reportType === "static" | "mobile"`)
- Keep `/reports/new` as the default route redirecting to `/reports/static/new` for backwards compatibility
- Plan layout hierarchy: shared dashboard layout vs. report-type-specific form layouts
- Prepare component variants for different report types (metadata, inputs, uploads)
- Extend `REPORT_NAV_ITEMS` to use dynamic `href` patterns (e.g., `/reports/${type}/new`)
- Document report type schema (which uploads, inputs, and sections apply to each type)
- Establish navigation routing logic to handle active state based on current route parameter

---

### Phase 2 — Backend API Connection

Goal:

Connect the static UI to the FastAPI backend.

Tasks:

- Copy exact routes from `BACKEND_FRONTEND_INTEGRATION_GUIDE.md`
- Implement `lib/api.ts`
- Create report session
- Fetch session status
- Upload Daily Hour file
- Upload Wideload file
- Upload Impounded/Prohibited file
- Upload Overloaded file
- Save metadata
- Save Traffic Census inputs
- Save Transgressions inputs
- Fetch section previews in PNG/PDF/DOCX
- Build final report
- Download final DOCX

Completion criteria:

- A real backend session can be created
- Uploads persist to filesystem-backed session
- Manual inputs persist
- Section previews are shown from backend
- Final A4 landscape DOCX is built
- Final DOCX downloads successfully

---

### Phase 3 — Forms, Validation, and Server State

Goal:

Harden the frontend with proper state and validation.

Tasks:

- Add TanStack Query hooks
- Add React Hook Form to metadata and manual inputs
- Add Zod validation schemas
- Add query invalidation after mutations
- Add proper loading states
- Add proper error states
- Add disabled states based on backend readiness
- Add file-type validation before upload

Completion criteria:

- Form validation is clear and reliable
- API data is handled through TanStack Query
- UI updates after uploads and manual input changes
- User-facing errors are understandable
- Build readiness matches backend session status

---

### Phase 4 — Preview UX

Goal:

Improve the report preview experience.

Tasks:

- Add preview format selector
- Support PNG preview display
- Support PDF preview display
- Support DOCX preview download/open behavior
- Add preview refresh behavior
- Add unavailable preview state
- Add preview error details
- Improve section tab status indicators

Completion criteria:

- User can switch between Sections 1–7
- User can switch preview format where available
- Preview loading and error states are clear
- Preview behavior matches backend capabilities

---

### Phase 5 — Polish and Production Readiness

Goal:

Prepare the frontend for regular use.

Tasks:

- Add environment-based API URL configuration
- Improve responsive layout
- Add accessible labels and keyboard-friendly controls
- Add reusable status badge component
- Add reusable card and section heading patterns
- Add basic tests for forms and build readiness
- Add frontend setup notes
- Add final UI polish

Completion criteria:

- UI is stable, clear, and maintainable
- Main workflow is production-ready
- Common failure states are handled
- Frontend setup is documented

---

## 12. Current Tracker

| Area | Status | Notes |
|---|---|---|
| Frontend implementation guide | Done | Document exists and is being updated |
| Backend integration guide reviewed | Pending | Use `BACKEND_FRONTEND_INTEGRATION_GUIDE.md` for exact endpoints |
| Next.js project setup | Done | Next.js 16 project created with TypeScript |
| Tailwind setup | Done | Tailwind CSS v4 configured and working |
| TypeScript types | Not started | Add in `lib/types.ts` |
| API helper layer | Not started | Add in `lib/api.ts` during Phase 2 |
| `/reports/new` page | Done | Static dashboard shell created and split into components |
| Report metadata form | Done | Controlled by React state |
| Upload checklist | Done | Supports mock file selection and dynamic status |
| Manual inputs panel | Done | Inputs are controlled by React state |
| Section preview panel | Done | Section tabs and format selector work locally |
| Build report panel | In progress | Build button simulates report generation |
| Download DOCX card | In progress | Download enabled after mock build completion |
| TanStack Query integration | Not started | Phase 3 |
| React Hook Form integration | Not started | Phase 3 |
| Zod validation | Not started | Phase 3 |
| Responsive polish | Not started | Phase 5 |

---

## Latest Progress Notes

- React state added to `/reports/new` page
- Metadata form is now controlled by React state
- Upload checklist supports mock file selection
- Upload status and filenames render dynamically
- Manual inputs are controlled by React state
- Section preview workflow has been added
- Section 1–7 tabs are clickable
- Preview format selector supports PNG, PDF, and DOCX
- Preview panel updates based on selected section and format
- Preview is still mock/local only
- Backend preview API is not connected yet
- Build button now simulates report generation
- Download button enables after mock build completion
- Backend integration has not started yet

---

## Phase 2B — Scalable Upload + Preview Architecture

The frontend now includes a more scalable upload and preview architecture that reduces duplication and centralizes orchestration:

- Generic `uploadSectionFile` API helper implemented
- `UPLOAD_ENDPOINTS` mapping added in `lib/constants.ts`
- Specialized upload handlers replaced with reusable `handleSectionUpload`
- `UploadChecklist` converted into configuration-driven rendering
- Dynamic upload cards generated from `uploadSections` config array
- `UploadChecklist` refactored into presentation-only component
- `page.tsx` now owns upload orchestration and backend communication

---

## Dynamic Preview System

The preview system has been generalized to support backend-driven preview flows across sections and formats:

- `previewUrls` state map implemented
- Dynamic preview URL mapping by upload section
- `SectionPreviewPanel` generalized for multiple backend previews
- PNG preview rendering implemented
- PDF and DOCX preview downloads functional
- Backend preview switching by selected section implemented

---

## Responsive Dashboard Layout Refinements

Recent layout refinements make the report builder more stable and responsive on large screens:

- Sticky right-side `ManualInputsPanel` rail
- Responsive grid layout using:
  - `xl:grid-cols-[minmax(0,1fr)_220px]`
  - `2xl:grid-cols-[minmax(0,1fr)_320px]`
- `ManualInputsPanel` aligned permanently to right side
- Main content area expanded for large screens
- KPI cards integrated into center content flow
- Sidebar progress summary powered by React Context

---

## Current Upload + Preview Flow

The current implementation flow is:

1. User uploads a file in the frontend
2. `page.tsx` routes the request through a generic upload handler
3. Backend processes the upload and updates the session
4. Backend generates preview assets for the appropriate section
5. Preview URL mapping is updated in `previewUrls`
6. Dynamic section rendering displays the current preview

---

## Current Working Features

The following features are currently functional in the frontend:

- Backend session creation
- Session restore after refresh
- Uploads for daily hour, wideload, impounded/prohibited, and overloaded
- Backend-driven upload status mapping
- Preview panel with dynamic section preview URL requests
- Manual input autosave
- Settings-managed officer list architecture
- Transgression modal UI
- Sticky right-side manual input rail
- Sidebar progress summary via context

---

## Current Frontend Architectural Patterns

The frontend now follows reusable patterns that improve maintainability and scalability:

- Configuration-driven rendering for navigation and upload sections
- Centralized backend communication in `lib/api.ts`
- React Context shared state for sidebar and progress
- Reusable upload orchestration in `page.tsx`
- Dynamic preview mapping across section previews
- Responsive dashboard grid architecture for large-screen layouts

---

## Current Frontend Architecture

The frontend architecture is organized around clear responsibilities for each component and layout:

- **app/reports/layout.tsx responsibilities**: Provides shared dashboard layout for all report types, manages sticky sidebar and main content area, handles responsive behavior across screen sizes.
- **page.tsx responsibilities**: Handles report-specific logic for the Static Weighbridge report, manages session creation, upload workflows, and preview rendering.
- **ReportSidebar responsibilities**: Renders configuration-driven navigation, displays active report state, provides settings panel access, consumes progress context for status updates.
- **Progress context responsibilities**: Manages shared state across layouts and components, tracks upload progress, session status, and build readiness, enables cross-component communication.
- **API layer responsibilities**: Abstracts backend communication in `lib/api.ts`, handles session management, file uploads, and preview fetching, provides consistent error handling.

---

## Next Planned Implementation Steps

Future development will focus on expanding the upload and build capabilities:

- Verify transgression modal autosaves correctly.
- Confirm Section 5 preview renders NIL and populated transgression rows.
- Hydrate manual inputs from restored backend session.manual_inputs.
- Persist settings officer list to localStorage.
- Connect real final report build endpoint.
- Connect final DOCX download endpoint.
- Replace remaining mock build state with backend final_report.status.
- Add user-facing error messages for preview failures and upload errors.

---

## Settings Architecture

The settings system has been implemented to manage report officer information:

- Added `ReportSettingsContext`.
- Settings panel now manages report officer names.
- "Prepared By" and "Approved By" values are now intended to come from settings-managed officer lists.
- `app/reports/layout.tsx` now wraps report pages with `ReportSettingsProvider` and `ReportProgressProvider`.
- `ReportsLayoutContent` uses settings context inside the provider boundary.

---

## Automatic Session Creation

Session management has been enhanced with automatic creation and persistence:

- Backend report session can be created automatically once report date, prepared by, and approved by are selected.
- Manual "Create Session" button still exists as fallback.
- `report_id` is stored in localStorage as `active-report-id`.
- Refresh restores the active report session.

---

## Manual Input Autosave

Manual inputs now feature automatic saving to the backend:

- Manual inputs now autosave to `PATCH /api/report-sessions/{report_id}/manual-inputs`.
- Auto-save status added: idle, saving, saved, error.
- Traffic Census values are sent to backend.
- Cases cleared and transgressions count are sent through extra fields.
- Manual input restore/persistence flow is in progress.

---

## Preview Routing Updates

The preview system has been updated to directly request backend URLs:

- `SectionPreviewPanel` now requests backend preview URLs directly through `/sections/{section_name}/preview`.
- Preview format supports png, pdf, and docx.
- Backend section name mapping updated:
  - Section 1: daily-hour-statistics
  - Section 2: daily-hour-chart
  - Section 3: traffic-census
  - Section 4: daily_summary
  - Section 5: transgressions
  - Section 6: impounded-prohibited
  - Section 7: wideload
- PNG previews render inline.
- PDF/DOCX previews open as downloadable/linked files.

---

## Transgressions Modal Work

The transgressions input has been expanded with a dedicated modal:

- `ManualInputs` type expanded for:
  - `dailyTransgressions`
  - `transgressionActions`
- Added transgression modal in `ManualInputsPanel`.
- Modal includes two report-aligned sections:
  - Daily Transgressions Report
  - Transgressions Action Report
- Daily Transgressions fields:
  - Date
  - Time
  - Reg No
  - Axle Config
  - Transporter
  - Census Clerk
  - Police In charge
  - Action Taken
  - Caught
  - Next WB report sent
  - Next WB
- Action Report fields:
  - Date
  - Time Received
  - Truck No.
  - Sending WB station
  - OCS Reported To
  - Action 1
  - Action 2
  - Attach evidence
  - Weight noted
  - Tagged in system
- Transgression rows are prepared for backend autosave payload:
  - `daily_transgressions`
  - `action_report`

---

## Known Issues / In-Progress

Current limitations and ongoing work:

- Section 1 and Section 2 preview correctness depends on backend section preview support.
- Transgression preview depends on autosaved manual transgression payload.
- Manual input restore for transgression rows may still need hydration from backend `session.manual_inputs`.
- Final report build/download is still mock or pending full backend connection.
- Officer list persistence is local React state for now and may need localStorage later.

---

## 13. Next Task

Add UI polish and reset/new report behavior before backend integration.

Recommended next implementation task:

1. Improve the UI polish for the report builder layout and controls.
2. Add reset/new report behavior for starting a fresh mock session.
3. Add clear completion/progress indicators for metadata, uploads, manual inputs, and preview state.
4. Ensure the build button and download button reflect the current mock workflow state.
5. Keep the workflow local/mock and do not connect backend APIs yet.
6. Keep TanStack Query, React Hook Form, and Zod out of scope until after polish.

---

## Phase 2 — Backend Integration Progress

The frontend has successfully transitioned from static UI to backend-integrated functionality. The following integrations have been completed:

- FastAPI backend connection established
- Environment variable setup using NEXT_PUBLIC_API_BASE_URL
- Shared API helper created in lib/api.ts
- Report session creation connected to backend
- report_id persistence implemented in frontend state
- Daily Hour file upload connected to backend
- Backend-generated preview URL rendering implemented
- Frontend now renders real backend preview images

---

## Architectural Improvements

Several architectural enhancements have been implemented to improve maintainability and user experience:

- app/layout.tsx restored as root layout
- app/reports/layout.tsx implemented as shared reports dashboard layout
- ReportProgressContext added for cross-layout state sharing
- Sidebar now consumes progress state through React Context
- Sidebar navigation converted to configuration-driven rendering
- Weighbridge and Bound dropdowns converted to constants-driven rendering
- Sticky Manual Inputs right rail implemented
- KPI cards repositioned into main center layout
- Responsive 3-column dashboard structure implemented

---

## Current Working Features

The following features are currently functional in the frontend:

- Backend session creation
- Daily Hour upload
- Backend preview rendering
- Dynamic preview panel
- Progress tracking
- Reset workflow
- Sticky layout behavior
- Dynamic dropdowns
- Settings panel
- Sidebar report navigation dropdown

---

## Current Frontend Architecture

The frontend architecture is organized around clear responsibilities for each component and layout:

- **app/reports/layout.tsx responsibilities**: Provides shared dashboard layout for all report types, manages sticky sidebar and main content area, handles responsive behavior across screen sizes.
- **page.tsx responsibilities**: Handles report-specific logic for the Static Weighbridge report, manages session creation, upload workflows, and preview rendering.
- **ReportSidebar responsibilities**: Renders configuration-driven navigation, displays active report state, provides settings panel access, consumes progress context for status updates.
- **Progress context responsibilities**: Manages shared state across layouts and components, tracks upload progress, session status, and build readiness, enables cross-component communication.
- **API layer responsibilities**: Abstracts backend communication in lib/api.ts, handles session management, file uploads, and preview fetching, provides consistent error handling.

---

## Next Planned Implementation Steps

Future development will focus on expanding the upload and build capabilities:

- Generalize upload architecture
- Connect Wideload uploads
- Connect Impounded/Prohibited uploads
- Connect Overloaded uploads
- Backend-driven section statuses
- Real preview switching per section
- Build/download workflow integration
- PDF/DOCX preview support
- Persisted report restoration

---

## 14. Codebase Audit — 2026-05-08

This audit reflects the current project folder state after reviewing the frontend source files against this guide.

### Current Project Shape

```txt
frontend/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   └── reports/
│       ├── layout.tsx
│       └── static-weighbridge/
│           └── new/
│               └── page.tsx
├── components/
│   └── report-builder/
│       ├── ManualInputsPanel.tsx
│       ├── ProgressSummary.tsx
│       ├── ReportHeader.tsx
│       ├── ReportMetadataForm.tsx
│       ├── ReportProgressContext.tsx
│       ├── ReportSettingsContext.tsx
│       ├── ReportSidebar.tsx
│       ├── SectionCard.tsx
│       ├── SectionPreviewPanel.tsx
│       ├── StatusBadge.tsx
│       ├── SummaryCards.tsx
│       └── UploadChecklist.tsx
└── lib/
    ├── api.ts
    ├── constants.ts
    └── types.ts
```

### Actual Route Status

- The active report builder route is now `/reports/static-weighbridge/new`.
- There is currently no `/reports/new` route in the frontend folder.
- There is currently no dynamic `/reports/[reportType]/new` route.
- `app/reports/layout.tsx` is the shared dashboard layout for report routes.
- `app/page.tsx` is not present in the current source tree.

### Current Dependency Status

- Installed direct runtime dependencies are `next`, `react`, `react-dom`, and `lucide-react`.
- Tailwind CSS v4, TypeScript, ESLint, and Next ESLint config are installed as dev dependencies.
- TanStack Query is not installed.
- React Hook Form is not installed.
- Zod is not installed as a direct project dependency.

### Current Backend Integration Status

`lib/api.ts` currently implements:

- `createReportSession(payload)` using `POST /api/report-sessions`
- `getReportSession(reportId)` using `GET /api/report-sessions/{reportId}`
- `uploadSectionFile(reportId, section, file)` using `POST /api/report-sessions/{reportId}/uploads/{endpoint}`
- `updateManualInputs(reportId, payload)` using `PATCH /api/report-sessions/{reportId}/manual-inputs`
- `updateReportSessionMetadata(reportId, payload)` using `PATCH /api/report-sessions/{reportId}/metadata`
- `getSummaryCards(reportId)` using `GET /api/report-sessions/{reportId}/summary-cards`
- `getSectionPreviewUrl(reportId, sectionName)` returning `/api/report-sessions/{reportId}/sections/{sectionName}/preview`

`NEXT_PUBLIC_API_BASE_URL` is supported, with `http://127.0.0.1:8000` as the fallback.

### Current Upload Model

The frontend upload keys currently are:

```ts
type UploadKey =
  | "daily_hour"
  | "wideload"
  | "impounded_prohibited"
  | "impounded_overloaded";
```

The older guide sections refer to `"overloaded"`, but the current code uses `"impounded_overloaded"` on the frontend and maps it to the backend upload endpoint `"overloaded"` through `UPLOAD_ENDPOINTS`.

Current upload endpoint mapping:

```ts
daily_hour -> daily-hour
wideload -> wideload
impounded_prohibited -> impounded-prohibited
impounded_overloaded -> overloaded
```

### Current Preview Model

`SectionPreviewPanel` no longer keeps a local `previewUrls` state map. It derives the preview URL directly from the active `reportId`, selected section, section-name mapping, and selected format.

Current section-name mapping:

```txt
1 -> daily-hour-statistics
2 -> daily-hour-chart
3 -> traffic-census
4 -> daily_summary
5 -> transgressions
6 -> impounded-prohibited
7 -> wideload
```

PNG previews render inline with an `<img>` tag. PDF and DOCX previews are opened through a generated link.

### Current State Management

- The app still uses local React state in `app/reports/static-weighbridge/new/page.tsx`.
- `ReportProgressContext` shares metadata/upload/manual/build readiness with the sidebar.
- `ReportSettingsContext` stores the officer list in `localStorage` under `report-officer-list`.
- `active-report-id` is stored in `localStorage` and used for session restore.
- Selected weighbridge and bound are stored in `localStorage` and restored into the dropdowns.
- Restored sessions currently hydrate metadata, upload statuses, manual input values, and final report status.
- Restored sessions hydrate selected weighbridge/bound from backend session metadata.
- Manual input hydration maps backend `session.manual_inputs` back into the frontend form state after page refresh.

### Current Build/Download Status

- Final report build now calls `POST /api/report-sessions/{reportId}/build-final-report`.
- The UI maps backend `final_report.status === "ready"` to the completed build state.
- Backend build errors are surfaced through the manual input rail.
- The Download DOCX button opens the backend final-report download URL after a successful build.
- Live backend build/download behavior still requires the FastAPI server to be running with a ready session.

### Current Validation And Server-State Status

- Validation is still inline/local and minimal.
- File inputs accept `.csv`, `.xlsx`, and `.xls`, but there is no explicit pre-upload file validation layer.
- TanStack Query, React Hook Form, and Zod are still out of scope in the current implementation.
- `npm run lint` passes with the current source.

### Guide Alignment Notes

The later guide sections are closer to the current code than the early planning sections. The following older guide claims should be treated as historical unless updated later:

- Primary route `/reports/new`
- Planned dynamic route `/reports/[reportType]/new`
- API helper layer "Not started"
- TypeScript types "Not started"
- Preview system using a local `previewUrls` map
- Upload key named `"overloaded"` in frontend state
- Backend integration not started
- Workflow being local/mock only

### Updated Near-Term Tasks

The next useful implementation work, based on current code, is:

1. Add compatibility routing for `/reports/new` if backwards compatibility is still required.
2. Decide whether to implement `/reports/[reportType]/new` or keep explicit report-type routes such as `/reports/static-weighbridge/new`.
3. Make sidebar active state route-aware instead of hard-coded in `REPORT_NAV_ITEMS`.
4. Add user-facing preview and upload error states.
5. Add explicit file-type validation before upload.
6. Replace the default Create Next App README with project-specific setup notes.
7. Consider adding a small browser-level smoke test for officer persistence, manual input restore, ordered uploads, and build/download button behavior.

---

## 15. Implementation Update — 2026-05-08

### Officer Settings Persistence

Implemented in `components/report-builder/ReportSettingsContext.tsx`.

- Officer names now load from `localStorage` using key `report-officer-list`.
- The default officer list remains:
  - Fredrick Kariuki
  - Faith Njani
- Added officers are de-duplicated and persisted automatically.
- The metadata form continues to consume the settings-managed officer list for "Prepared By" and "Approved By".

### Backend Final Report Build

Implemented across:

- `lib/api.ts`
- `lib/types.ts`
- `app/reports/static-weighbridge/new/page.tsx`
- `components/report-builder/ManualInputsPanel.tsx`

Added API helpers:

```ts
buildFinalReport(reportId)
getFinalReportDownloadUrl(reportId)
```

Build flow now works as follows:

1. User clicks Build Final Report.
2. Frontend calls `POST /api/report-sessions/{reportId}/build-final-report`.
3. Backend response is inspected for `final_report.status`.
4. `ready` maps to frontend `buildStatus: "completed"`.
5. `error` maps to frontend `buildStatus: "error"` and displays the backend error message.
6. After successful build, Download DOCX opens `/api/report-sessions/{reportId}/download-final-report`.

### Verification

- `npm run lint` passes.
- `npm run build` passes.
- The first sandboxed production build failed only because Next needed network access to fetch Google Fonts for `next/font`.
- Re-running `npm run build` with approved network access passed.
- The local FastAPI server was not running on `127.0.0.1:8000`, so the final build endpoint could not be live-tested from the browser during this pass.

### Backend Contract Confirmed From Source

The backend endpoint contract was confirmed from `/home/ace/Desktop/May/Report-app/backend/app/routes/reports.py` and backend tests:

```txt
POST /api/report-sessions/{report_id}/build-final-report
GET  /api/report-sessions/{report_id}/download-final-report
```

Successful final build response sets:

```txt
final_report.status = "ready"
final_report.download_url = "/api/report-sessions/{report_id}/download-final-report"
```

Failed or incomplete build response sets:

```txt
final_report.status = "error"
final_report.error = <backend error message>
```

---

## 16. Implementation Update — 2026-05-08 Manual Restore And Ordered Uploads

### Manual Input Restore After Refresh

Implemented in `app/reports/static-weighbridge/new/page.tsx`.

- Restored backend sessions now hydrate `manualInputs` from `session.manual_inputs`.
- Traffic Census backend fields are mapped back to:
  - `buses3500`
  - `vehicles3500to7000`
  - `vehicles7000`
- Extra manual fields are mapped back to:
  - `casesCleared`
  - `transgressions`
- Transgression rows are mapped from backend-normalized table labels and snake_case aliases back to frontend camelCase row fields.
- `manualInputsTouched` is restored when manual input data exists so build readiness survives page refresh.

### Ordered Upload Enforcement

Implemented in:

- `app/reports/static-weighbridge/new/page.tsx`
- `components/report-builder/UploadChecklist.tsx`

Required upload order is now:

1. Wideload
2. Impounded / Prohibited
3. Impounded / Overloaded
4. Daily Hour

Behavior:

- All upload cards are disabled until a backend session exists.
- Only Wideload is enabled immediately after session creation.
- Each next upload card unlocks only after the previous upload has backend-confirmed `uploaded` status.
- Build readiness now counts only `uploaded` files, not temporary `selected` files.
- Disabled upload cards show a short reason:
  - Create a backend session first.
  - Complete the previous upload first.

### Verification

- `npm run lint` passes.
- `npm run build` passes after allowing Next to fetch Google Fonts for `next/font`.
- The local FastAPI server was not running on `127.0.0.1:8000`, so restored-session hydration and upload sequencing were verified through code path/build checks rather than a live browser session against the backend.

---

## 17. Implementation Update — 2026-05-08 Weighbridge And Bound Metadata

### Dropdown Persistence

Implemented in `app/reports/static-weighbridge/new/page.tsx`.

- Selected weighbridge is stored in `localStorage` under `active-weighbridge-name`.
- Selected bound is stored in `localStorage` under `active-bound-name`.
- On page refresh, dropdowns initialize from stored selections.
- When an existing backend session is restored, dropdowns hydrate from `session.metadata.weighbridge_name`, `session.metadata.station`, and `session.metadata.bound`.

### Backend Metadata Update

Implemented in the backend project:

- `/home/ace/Desktop/May/Report-app/backend/app/routes/reports.py`
- `/home/ace/Desktop/May/Report-app/backend/app/services/report_session_store.py`
- `/home/ace/Desktop/May/Report-app/backend/tests/test_report_session_api.py`

New backend route:

```txt
PATCH /api/report-sessions/{report_id}/metadata
```

Payload:

```json
{
  "station": "JUJA",
  "bound": "THIKA BOUND",
  "weighbridge_name": "JUJA"
}
```

Behavior:

- Changing the dropdowns now PATCHes the active backend session metadata.
- Updated station/bound values are persisted in the filesystem-backed session.
- Final report build and preview rendering can now use the changed station/bound values for footer and title output.
- Backend generated outputs are invalidated only when metadata values actually change, so a plain page refresh does not clear an already ready final report.

### Frontend API Update

Implemented in `lib/api.ts`:

```ts
updateReportSessionMetadata(reportId, payload)
```

The report page debounces metadata PATCH calls after dropdown changes.

### Verification

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes after allowing Next to fetch Google Fonts for `next/font`.
- Backend metadata persistence test passes:
  - `env PYTHONPATH=backend backend/venv/bin/python -m pytest backend/tests/test_report_session_api.py -q`
- Backend test warning: pytest could not write cache under the backend repo because that directory is read-only in the current sandbox; tests still passed.

---

## 18. Implementation Update — 2026-05-08 Summary Cards API

### Backend Endpoint

Summary cards now use the backend endpoint:

```txt
GET /api/report-sessions/{report_id}/summary-cards
```

Expected card fields:

```ts
type SummaryCard = {
  title: string;
  value: number | null;
  display_value: string;
  status: "ready" | "awaiting_data" | string;
  subtitle: string;
  source: string;
};
```

### Frontend Integration

Implemented in:

- `lib/api.ts`
- `components/report-builder/SummaryCards.tsx`
- `app/reports/static-weighbridge/new/page.tsx`

Behavior:

- `SummaryCards` receives the active `reportId`.
- Without a session, cards render local fallback placeholders.
- With a session, cards fetch backend values from `/summary-cards`.
- Cards refetch when `uploadCount` changes, so uploads can refresh the displayed KPI values.
- Loading state shows an ellipsis in card values.
- Fetch errors are displayed in the card subtitle area.

### Verification

- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- `npm run build` passes after allowing Next to fetch Google Fonts for `next/font`.

---

## 19. Implementation Update — 2026-05-08 Session Reference Abstraction

### User-Facing Session Copy

Implemented in `app/reports/static-weighbridge/new/page.tsx`.

- Removed the raw backend session id from the main report builder page.
- Replaced technical copy with user-facing workspace status:
  - `Report workspace ready`
  - `Complete report info to start a workspace.`
- Renamed the session button copy:
  - `Start Report`
  - `Report Started`

### Settings Technical Details

Implemented in:

- `components/report-builder/ReportProgressContext.tsx`
- `app/reports/layout.tsx`

Behavior:

- `ReportProgressContext` now carries `sessionId`.
- The Settings slide-over shows the active session id under `Session Details`.
- End users can focus on report workflow/results, while technical session reference remains available for troubleshooting.

### Verification

- `npx tsc --noEmit` passes.
- `npm run lint` passes.

---

## 20. Implementation Update — 2026-05-09 Hosting And API Configuration

### Current Hosted Frontend

The frontend is hosted as a static-exported Next.js app.

Current production frontend:

```txt
https://dnkreport.netlify.app
```

Current GitHub repository:

```txt
git@github.com:Walshwade-dev/report-compiler.git
```

Current branch:

```txt
main
```

### Current Backend

The active deployed backend is:

```txt
https://report-app-px6c.onrender.com
```

Backend health check:

```txt
GET https://report-app-px6c.onrender.com/health
```

Expected response:

```json
{"status":"ok"}
```

### Frontend API Routing

Implemented in:

- `frontend/lib/api.ts`
- `netlify.toml`
- `vercel.json`
- `frontend/vercel.json`

The frontend centralizes API URL construction in `frontend/lib/api.ts`.

Local development:

```txt
http://127.0.0.1:8000/api/{path}
```

Hosted browser runtime:

```txt
/api/{path}
```

Netlify and Vercel rewrite same-origin `/api/*` requests to:

```txt
https://report-app-px6c.onrender.com/api/*
```

This avoids browser CORS issues because the browser talks to the frontend host, while the hosting platform forwards the request to Render.

### Netlify Configuration

`netlify.toml` currently uses static export output:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "out"
```

API rewrites:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://report-app-px6c.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/health"
  to = "https://report-app-px6c.onrender.com/health"
  status = 200
  force = true
```

### Vercel Configuration

`vercel.json` and `frontend/vercel.json` both include API rewrites so either root-directory deployment mode works:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://report-app-px6c.onrender.com/api/:path*"
    },
    {
      "source": "/health",
      "destination": "https://report-app-px6c.onrender.com/health"
    }
  ]
}
```

### Preview Behavior

DOCX previews work from the deployed backend.

PNG and PDF previews currently return backend `500` errors in production because those formats require server-side conversion:

```txt
DOCX -> LibreOffice -> PDF -> pdftoppm -> PNG
```

The Render backend environment must include OS-level packages:

```txt
libreoffice
poppler-utils
```

Until those packages are available in the backend deployment, the frontend handles failed PNG previews gracefully and offers the generated DOCX preview as a fallback.

Recommended backend deployment fix:

- Deploy the backend with Docker.
- Install `libreoffice` and `poppler-utils` in the backend image.
- Keep `MPLCONFIGDIR=/tmp/matplotlib`.

### Verification

- `https://report-app-px6c.onrender.com/health` returns `200`.
- `npm run lint` passes in `frontend/`.
- `npm run build` passes in `frontend/`.
- Netlify should serve the app from `frontend/out`.
- Hosted API requests should use `/api/...` in the browser network tab.

---

## 21. Implementation Update — 2026-05-14 Mobile Report Progress

### Mobile Weighbridge Report Route

Implemented in `frontend/app/reports/mobile-weighbridge/new/page.tsx`.

- Added a dedicated Mobile Weighbridge Report workflow at:

```txt
/reports/mobile-weighbridge/new
```

- The page now supports:
  - Mobile report metadata entry for report date, station, and shift.
  - Backend session creation through the shared report session API.
  - Manual mobile fields for Danka staff, police officers, vehicle, mileage, route, and cases cleared in court.
  - Local draft persistence with reset/reupload support.
  - Mobile register upload with CSV/XLSX/XLS validation.
  - KPI cards for total weighed, warned, charged GVW/axle, and charged dimensions.
  - Backend summary details and normalized uploaded-row preview.
  - Mobile Excel report download after successful upload.

### Shared Navigation And Progress

Implemented in:

- `frontend/app/reports/layout.tsx`
- `frontend/components/report-builder/ReportSidebar.tsx`
- `frontend/components/report-builder/ProgressSummary.tsx`
- `frontend/components/report-builder/ReportProgressContext.tsx`
- `frontend/lib/constants.ts`

Progress made:

- The reports navigation now links to both Static Weighbridge and Mobile Weighbridge workflows.
- The mobile/tablet header mirrors the report navigation so both workflows are reachable without the desktop sidebar.
- `ReportProgressContext` now tracks `reportType` and `uploadTotal`, allowing the sidebar summary to display either the static report checklist or the mobile workflow checklist.
- The mobile workflow reports progress as Session, Manual, Register, and Excel readiness.

### API And Type Support

Implemented in:

- `frontend/lib/api.ts`
- `frontend/lib/types.ts`
- `frontend/lib/files.ts`

Progress made:

- Added mobile register upload support through `uploadMobileReportFile()`.
- Added mobile Excel download URL support through `getMobileExcelReportDownloadUrl()`.
- Reused `createReportSession()` and `updateManualInputs()` for the mobile report flow.
- Added `resolveApiUrl()` handling for backend-provided download URLs.
- Added mobile report input and vehicle charge types for the frontend state model.
- Centralized supported spreadsheet validation for CSV/XLS/XLSX uploads.

### Current Status

- Static weighbridge workflow remains the primary full DOCX workflow.
- Mobile weighbridge workflow is now present as an application route and wired to the backend session/upload/download flow.
- Mobile Excel generation depends on backend support for `/uploads/mobile-report` and `/download-mobile-excel-report`.
- The next frontend pass should live-test mobile upload/download against the deployed or local backend and then tighten any response-shape mismatches.

---

## 22. Implementation Update — 2026-06-29 Developer Portal, SMS Summaries & Signatory Lock

### Developer Ticket & Prompt Portal

Implemented at route:
```txt
/tickets
```
Component: `frontend/app/tickets/page.tsx`

- A dedicated page allowing users to submit system bugs/flaws or enhancement requests.
- Inputs: Title, Category (Bug/Feature/Enhancement), Severity (Low/Medium/High/Critical), Affected Area/File, Observed Description, Expected Behavior.
- Compiled developer prompts are generated dynamically using standard AI prompt instructions format.
- Tickets are persisted client-side in the browser's `localStorage` (key: `dev-tickets`).
- Provides one-click action buttons to copy the prompt to the clipboard or download it as a markdown file (`.md`).

### SMS Summary Dashboard Panel

Implemented in `frontend/components/dashboard/SmsSummaryPanel.tsx` and integrated on the `/analytics` page:
- Dynamically fetches dates having generated reports from the backend (`GET /api/report-sessions/sms-summaries/dates`).
- Fetches and displays formatted SMS summary text payloads (`GET /api/report-sessions/sms-summaries/{report_date}`) for static and mobile weighbridge sessions.
- Displays calculated fields including total weighed, charged, warned, and impounded/prohibited.
- Allows copying the SMS summary payload directly to the clipboard.

### Locked signatory "Faith Njani"

- Across the metadata form and final report templates, the signatory field `confirmed_by` is locked to **"Faith Njani"**.
- In `ReportMetadataForm.tsx`, this field is hardcoded and disabled to prevent manual overrides.

### Impounded & Prohibited Formula

- The impounded and prohibited metric on the dashboards and generated documents is computed using the formula `P = Z + R`, where `Z` is the charged count and `R` is the count of cases cleared/released in court.
