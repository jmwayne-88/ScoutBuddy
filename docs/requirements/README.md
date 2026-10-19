# Requirements

One file per product iteration from [ROADMAP.md](../../ROADMAP.md) (01-05), each expanding that iteration's roadmap bullets into numbered, testable requirements and an acceptance checklist — update the corresponding file here (and ROADMAP.md's summary) together if an iteration's scope changes, don't let them drift apart. Numbers from 06 on are cross-cutting requirements not tied to a single ROADMAP iteration (infrastructure, presentation-layer redesigns, etc.).

## Organization

A requirement file lives flat at the root of this folder (as plain `NN-slug.md`) while it's still pending — not yet built, or built but not yet committed and pushed. **Once a requirement has been built, committed, and pushed, move its file into the category subfolder that best matches its functionality** (`git mv NN-slug.md <category>/`), and update this README's index and any cross-links the move affects (sibling requirement links, ADR back-links, and any code comments pointing at the old path). Do this as part of landing the work, not as a separate later cleanup pass — it's a standing step in shipping a requirement, not a one-off reorganization.

Categories are grouped by what the requirement is actually about, not by number order or by when it shipped. Add a new category subfolder if a requirement doesn't fit any existing one well; don't force a fit. Current categories:

- **roadmap-iterations/** — the five original sequenced product iterations from [ROADMAP.md](../../ROADMAP.md) (01-05): the foundational approval loop, patrol/campout/meal-framework data model.
- **infrastructure-deployment/** — environment isolation, database branching, deployment pipeline.
- **patrol-management/** — ASPL-facing patrol CRUD and campout patrol rosters.
- **design-system-visual-identity/** — the MUI design system itself and patrol/role visual identity (icons, avatars).
- **ux-interaction-polish/** — presentation-layer and interaction-pattern work: layout, status visualization, async states, destructive-action patterns, empty states, validation, loading states, navigation, gamification.
- **printing-exports/** — menu print preview and shopping-list generation.
- **review-comments/** — the comment/annotation system and review-history UX.
- **data-upload/** — bulk-uploading troop data from a file (AI-assisted extraction, review-before-save).

## Index

### Pending (not yet built, or built but not yet committed/pushed)

- [24 - Due-Date & Review Notifications (Push/Email)](24-due-date-and-review-notifications.md)
- [27 - Multi-Tenant Unit Isolation & Switching](27-multi-tenant-unit-isolation.md)

### roadmap-iterations/

- [01 - Core Approval Loop (single patrol, single campout)](roadmap-iterations/01-core-approval-loop.md)
- [02 - All Four Patrols + Visual Identity](roadmap-iterations/02-four-patrols-and-visual-identity.md)
- [03 - Multiple Campouts](roadmap-iterations/03-multiple-campouts.md)
- [04 - Meal-Framework Variation](roadmap-iterations/04-meal-framework-variation.md)
- [05 - Workflow Hardening & Polish](roadmap-iterations/05-workflow-hardening-and-polish.md)

### infrastructure-deployment/

- [06 - Test Database Isolation](infrastructure-deployment/06-test-database-isolation.md)
- [11 - Production Deployment Pipeline & Environment Isolation](infrastructure-deployment/11-production-deployment-pipeline.md)

### patrol-management/

- [08 - Manage Patrols](patrol-management/08-manage-patrols.md)
- [10 - Per-Campout Patrol Roster (Add/Remove)](patrol-management/10-per-campout-patrol-roster.md)

### design-system-visual-identity/

- [09 - Adopt MUI with the Scouting America Brand Palette](design-system-visual-identity/09-adopt-mui-design-system.md)
- [17 - Avatar/Card Home Role Picker](design-system-visual-identity/17-avatar-card-role-picker.md)
- [18 - Patrol Icon/Avatar Identity](design-system-visual-identity/18-patrol-icon-identity.md)

### ux-interaction-polish/

- [07 - Campout Dashboard Layout & Status Visualization](ux-interaction-polish/07-campout-dashboard-layout.md)
- [13 - UX Quick-Win Polish Pass](ux-interaction-polish/13-ux-quick-win-polish.md)
- [14 - Async Action Pending States](ux-interaction-polish/14-async-action-pending-states.md)
- [15 - Consistent Destructive-Action Pattern](ux-interaction-polish/15-consistent-destructive-action-pattern.md)
- [16 - Icon-Button Row Actions & Swipe-to-Delete](ux-interaction-polish/16-icon-button-row-actions.md)
- [19 - Personality-Driven Empty States](ux-interaction-polish/19-personality-driven-empty-states.md)
- [20 - Inline Validation Errors (Replacing `?error=` Query Strings)](ux-interaction-polish/20-inline-validation-errors.md)
- [21 - Loading Skeletons for Server-Rendered Pages](ux-interaction-polish/21-loading-skeletons.md)
- [23 - Persistent Mobile Bottom Navigation](ux-interaction-polish/23-mobile-bottom-navigation.md)
- [25 - Lightweight Gamification (Streaks & Recognition)](ux-interaction-polish/25-lightweight-gamification.md)

### printing-exports/

- [12 - Menu Print Preview & Shopping List](printing-exports/12-menu-print-preview.md)

### review-comments/

- [22 - Chat-Thread Review History](review-comments/22-chat-thread-review-history.md)
- [26 - Full Comment & Annotation System (Office Review-Mode Style)](review-comments/26-full-comment-annotation-system.md)
- [28 - Comment Pane UX Revision](review-comments/28-comment-pane-ux-revision.md)
- [29 - Smaller Comment Icon, Meal-Level Comments & Campout-List Comment Counts](review-comments/29-smaller-comment-icon-and-meal-comments.md)

### data-upload/

- [30 - AI-Assisted Campout Upload from PDF/Excel](data-upload/30-campout-upload-from-pdf-excel.md)
