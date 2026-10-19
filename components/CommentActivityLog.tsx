import type { ReactElement } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddCommentIcon from "@mui/icons-material/AddComment";
import ReplyIcon from "@mui/icons-material/Reply";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import type { CommentActivityAction, CommentActorRole } from "@prisma/client";
import { formatEventDate } from "@/lib/dates";
import { activityLine } from "@/lib/comments";
import { RelativeDate } from "@/components/RelativeDate";
import { NavLink } from "@/components/NavLink";

// REQ-26.7: same already-built-element-table convention as
// components/MenuStatusChip.tsx's STATUS_ICONS -- one icon per action,
// reused for every row rather than picked by variable name at render time.
const ACTION_ICONS: Record<CommentActivityAction, ReactElement> = {
  CREATED: <AddCommentIcon fontSize="small" />,
  REPLIED: <ReplyIcon fontSize="small" />,
  ASSIGNED: <AssignmentIndIcon fontSize="small" />,
  REASSIGNED: <AssignmentIndIcon fontSize="small" />,
  RESOLVED: <CheckCircleIcon fontSize="small" />,
  REOPENED: <RestartAltIcon fontSize="small" />,
  DELETED: <DeleteIcon fontSize="small" />,
};

export type CommentActivityEntry = {
  id: string;
  action: CommentActivityAction;
  actorRole: CommentActorRole;
  targetSummary: string;
  detail: string | null;
  createdAt: Date;
};

// REQ-26.6/26.7: the full, newest-first activity log for every thread on
// this menu -- a compact single-line row per event, not a re-rendering of
// the conversation itself (that's components/CommentThread.tsx, above
// this section on the page). `patrolName` resolves every PATROL_LEADER
// row's label; this menu has exactly one patrol, so no per-row join is
// needed. `hasMore`/`nextLimit` drive the "Load more" link -- a plain page
// navigation with a larger `?activityLimit=`, matching how this app does
// every other piece of state (no client-side fetching anywhere else).
export function CommentActivityLog({
  menuId,
  patrolName,
  entries,
  hasMore,
  nextLimit,
}: {
  menuId: string;
  patrolName: string;
  entries: CommentActivityEntry[];
  hasMore: boolean;
  nextLimit: number;
}) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No comment activity yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Stack spacing={1} component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {entries.map((entry) => (
          <Stack key={entry.id} component="li" direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <Stack sx={{ color: "text.secondary", pt: 0.25 }}>{ACTION_ICONS[entry.action]}</Stack>
            <Stack spacing={0} sx={{ minWidth: 0 }}>
              <Typography variant="body2">
                {activityLine({
                  actorRole: entry.actorRole,
                  actorPatrolName: patrolName,
                  action: entry.action,
                  targetSummary: entry.targetSummary,
                  detail: entry.detail,
                })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <RelativeDate {...formatEventDate(entry.createdAt)} />
              </Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
      {hasMore && <NavLink href={`/menus/${menuId}?activityLimit=${nextLimit}#comment-activity-log`}>Load more</NavLink>}
    </Stack>
  );
}
