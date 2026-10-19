# 0026. Comment/annotation data model: a self-referencing table plus an append-only activity log

Date: 2026-10-19
Status: Accepted

## Context

[Requirement 26](../requirements/review-comments/26-full-comment-annotation-system.md) asks for an Office-review-mode-style commenting system layered onto a menu: either party can start a thread on the menu, a dish, or an ingredient; reply; assign it to a party; resolve/reopen it; delete it; and see every one of those actions recorded forever in an audit log. Nothing like this existed before — `Review` ([ADR 0007](0007-menu-status-lifecycle-and-permissions.md)) is a single optional comment tied 1:1 to the ASPL's approve/reject decision, with no notion of a thread, a reply, an assignee, or a per-action history. This is a real data-model shape decision, which this project's working conventions (CLAUDE.md) require its own ADR for, written at build time rather than guessed at when the requirement was first drafted.

## Decision

Two new tables, both scoped to a `Menu`:

**`Comment`** — one row per message, root or reply:
- `targetType` (`MENU` | `DISH` | `INGREDIENT`) plus optional `dishId`/`ingredientId` identify what it's anchored to. `targetType` is stored explicitly rather than inferred from which FK is non-null, because `dishId`/`ingredientId` are `onDelete: SetNull` — once `removeDish`/`removeIngredient` (`app/(app)/menus/[id]/actions.ts`) hard-deletes the underlying row, nullability alone could no longer tell a DISH comment whose dish is gone from a MENU comment. `targetLabel` is a point-in-time name snapshot for the same reason — a comment (and its activity-log entries) must keep reading sensibly forever, even after its anchor is renamed or removed.
- `parentId` (self-relation, nullable) makes a row a reply when set. Threading is one level deep only (REQ-26.2) — a reply's `parentId` always points at a root, never at another reply — enforced by application code (`comment-actions.ts`'s `replyToComment` always reads the parent and copies its target fields), not a DB constraint.
- `authorRole`/`authorPatrolId`, `assigneeRole`/`assigneePatrolId`, `resolvedByRole`/`resolvedByPatrolId`, `deletedByRole`/`deletedByPatrolId` all reuse the same two-value shape as `lib/session.ts`'s `Actor` type (`ASPL`, or `PATROL_LEADER` + a patrol id) — there is no broader identity system to draw from (see [ADR 0010](0010-cookie-based-role-identity.md)).
- Deletion is a soft delete (`deletedAt`/`deletedByRole`/`deletedByPatrolId`), never a row removal — REQ-26.5/26.6 require a comment's deletion to still show up in the audit log, which is impossible if the row (and the activity rows that reference it) are gone.

**`CommentActivity`** — one append-only row per lifecycle event (`CREATED`, `REPLIED`, `ASSIGNED`, `REASSIGNED`, `RESOLVED`, `REOPENED`, `DELETED`), each carrying its own frozen `targetSummary`/`detail` display text rather than being derived live from the `Comment` row at render time. This is what REQ-26.7's "Comment activity log" section renders, newest-first, independent of whatever the live `Comment` rows currently look like.

Both are a genuinely new, general-purpose layer — not a repurposing of `Review`, which stays exactly as REQ-26's "Relationship to the Existing Review Model" section describes: unchanged, and the only thing that still drives `Menu.status`.

## Alternatives Considered

- **A single table with a `type: "COMMENT" | "ACTIVITY"` discriminator**: rejected — a `Comment` and a `CommentActivity` row have almost no shared shape (one holds editable, soft-deletable conversation content; the other is frozen, append-only, and outlives the thing it describes), and a shared table would need most of its columns nullable depending on `type`, which is exactly the kind of schema ambiguity `targetType` above was introduced to avoid elsewhere in this same decision.
- **Deriving the activity log from `Comment` rows' own timestamp/status columns instead of a separate append-only table**: rejected — `Comment` only has one `createdAt`/`resolvedAt`/`deletedAt` each, so it can represent at most one create, one resolve-or-reopen, and one delete per row; it can't represent *multiple* resolve/reopen cycles, more than one reassignment, or (critically) survive a delete and still describe that delete happened. REQ-26.6 needs a true multi-event history per comment, which only a separate table can hold.
- **Named-individual assignee** (a real "who" beyond role): out of scope — the app has no user-account system at all (ADR 0010), and adding one just for comment assignment would be a far bigger change than this requirement asks for. `assigneeRole`/`assigneePatrolId` mirror the existing `Actor` shape instead; see Requirement 26's Open Questions for the explicit resolution.
- **Hard-deleting a `Comment` on removal, relying on `CommentActivity`'s frozen `targetSummary` alone to describe what's gone**: rejected — REQ-26.5 explicitly asks for a comment's *content* to still exist for the audit trail's sake, not just a description that it once existed; a soft delete keeps both.

## Consequences

- `dishId`/`ingredientId` on `Comment` are `onDelete: SetNull`, the first use of that referential action anywhere in this schema (every other optional FK in the app — e.g. `MealFrameworkException.patrolId` — predates this and was left at the Prisma/Postgres default). A dish or ingredient can still be freely removed (`removeDish`/`removeIngredient`) with comments attached to it; the comment survives, just no longer linked to a live row, identified from then on by its own stored `targetType`/`targetLabel` alone.
- Every comment-mutating Server Action in `app/(app)/menus/[id]/comment-actions.ts` now writes two rows in sequence (the `Comment` mutation, then a `CommentActivity` row) rather than one — not wrapped in a `db.$transaction` the way `approveMenu`/`rejectMenu` wrap their `Menu`+`Review` writes, since an activity-log write failing after a successful comment write is a much lower-stakes inconsistency (a thread exists but one of its log lines is missing) than `approveMenu`'s status/decision pair ever disagreeing. Worth revisiting if that assumption stops holding.
- This is the first schema change in this project to use `prisma migrate diff` + a hand-placed migration folder + `prisma migrate deploy`, instead of `prisma migrate dev`. The development database's migration history has pre-existing drift unrelated to this change (a failed, since-superseded attempt at the `20261014142438_patrols_table` migration left `migrate dev`'s shadow-database check unable to proceed without a destructive `migrate migrate reset`). `migrate deploy` — the same command this app's actual production deploys already run ([ADR 0019](0019-local-production-credentials-and-automated-migrations.md)) — applies cleanly against that same drift, so it was used instead. The drift itself is pre-existing and out of scope for this change; worth a dedicated cleanup pass later so `migrate dev` works again for the next schema change.

## Related

- [Requirement 26 - Full Comment & Annotation System](../requirements/review-comments/26-full-comment-annotation-system.md) — the requirement this data model implements.
- [ADR 0007 - Menu status lifecycle as a role-gated state machine](0007-menu-status-lifecycle-and-permissions.md) — `Review`/`ReviewDecision`, unchanged, and still the only thing driving `Menu.status`.
- [ADR 0010 - Cookie-based role identity, no accounts or passwords](0010-cookie-based-role-identity.md) — why `Comment`'s author/assignee/resolver/deleter fields are role-shaped, not person-shaped.
- [ADR 0019 - Local production credentials, automated migrations, and a startup environment guard](0019-local-production-credentials-and-automated-migrations.md) — `prisma migrate deploy`, the mechanism this ADR's migration also used.
